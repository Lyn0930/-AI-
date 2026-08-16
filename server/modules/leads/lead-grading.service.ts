import { Injectable, Inject, Logger, forwardRef } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, desc } from 'drizzle-orm';
import { leads, leadGradeHistory, requirements, chatMessages, chatSessions } from '@server/database/schema';
import { RoutingService } from '../routing/routing.service';
import {
  GRADE_E_KEYWORDS,
  GRADE_A_KEYWORDS,
  GRADE_RECOVERY_KEYWORDS,
} from '../chat/chat.prompt';
import type { GradeHistory, GradeTransitionTrigger } from '@shared/api.interface';

const VALID_GRADES = ['A', 'B', 'C', 'D', 'E'];

/** 同一线索同目标等级在 5s 内的重复变更去重（防客户连发"不需要""不用了"导致的多次写入） */
const GRADE_CHANGE_DEDUP_MS = 5_000;

/** 上下文窗口：取最近 10 条对话作为跃迁判定依据 */
const CONTEXT_WINDOW_SIZE = 10;

/** 客户消息累计 < 2 条时不做 E 级降级（防止开场一句"不需要"就流失） */
const MIN_CUSTOMER_MESSAGES_FOR_E = 2;

/**
 * 线索分级服务（2026-08-14 重构）
 *
 * 变更要点：
 * 1. 移除 AI 首次评级（swan_home_clue_grading_1）、CapabilityService 依赖
 * 2. 移除 E 关键词的 AI 语义二次确认（confirmGradeEByAI）
 * 3. 移除 3 天无响应 B→D 降级任务（downgradeStaleChatting）
 * 4. 关键词跃迁升级为 3 层防御：
 *    - 第一层：上一轮 bot 是否在问需求采集题（否定词是回答，不是流失）
 *    - 第二层：上下文窗口内是否仍有积极信号（还在找、还需、推荐等）
 *    - 第三层：客户消息累计数兜底（开场单条不流失）
 * 5. updateGrade 加入 5s 同 (leadId, targetGrade) 去重
 */
@Injectable()
export class LeadGradingService {
  private readonly logger = new Logger(LeadGradingService.name);
  private readonly recentTransitions = new Map<string, { grade: string; at: number }>();

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    @Inject(forwardRef(() => RoutingService))
    private readonly routingService: RoutingService,
  ) {}

  /**
   * 主动写入分级。带 5s 去重（同 leadId 同 newGrade 在 5s 内只生效一次）。
   */
  async updateGrade(
    leadId: string,
    newGrade: string,
    reason: string,
    triggeredBy: GradeTransitionTrigger,
    confidence?: number,
  ): Promise<void> {
    const cacheKey = leadId;
    const cached = this.recentTransitions.get(cacheKey);
    const now = Date.now();
    if (cached && cached.grade === newGrade && now - cached.at < GRADE_CHANGE_DEDUP_MS) {
      this.logger.debug(`5s 内重复分级跳过: lead=${leadId} target=${newGrade}`);
      return;
    }

    const [lead] = await this.db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) return;

    const oldGrade = lead.leadGrade;
    if (oldGrade === newGrade && confidence === undefined) {
      this.recentTransitions.set(cacheKey, { grade: newGrade, at: now });
      return;
    }

    const updateData: Record<string, string> = {
      leadGrade: newGrade,
      gradeReason: reason,
    };
    if (confidence !== undefined) {
      updateData.gradeConfidence = confidence.toString();
    }

    await this.db.update(leads).set(updateData).where(eq(leads.id, leadId));
    this.recentTransitions.set(cacheKey, { grade: newGrade, at: now });

    if (oldGrade !== newGrade) {
      await this.db.insert(leadGradeHistory).values({
        leadId,
        oldGrade: oldGrade,
        newGrade,
        reason: reason.slice(0, 200),
        triggeredBy,
      });
      this.logger.log(
        `线索 ${leadId} 分级变更: ${oldGrade ?? 'null'} → ${newGrade} (${triggeredBy}) ${reason}`,
      );
      this.routingService
        .handleGradeChange(leadId, oldGrade, newGrade)
        .catch((err: unknown) => {
          this.logger.warn(
            `分级变更触发重新分配失败: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
    }
  }

  /**
   * 关键词跃迁检测（3 层防御版）
   */
  async checkGradeTransition(leadId: string, userMessage: string): Promise<void> {
    const [lead] = await this.db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead || !lead.leadGrade) return;
    const currentGrade = lead.leadGrade;

    // === 第一层：上一轮 bot 是否在问需求采集题？ ===
    const lastBotAskedRequirement = await this.checkIfAnsweringRequirementQuestion(lead.id);

    // === 第二层：上下文窗口 ===
    const recentContext = await this.getRecentContext(lead.id);

    // === 第三层：E 关键词检测 ===
    const eKeywordHit = this.detectEKeyword(userMessage);

    // === E 级降级判定（多条件豁免） ===
    if (eKeywordHit && currentGrade !== 'E') {
      // 第一层豁免：客户在回答 bot 的需求采集题
      if (lastBotAskedRequirement) {
        this.logger.log(
          `E关键词命中但豁免[第1层:需求采集上下文]: lead=${leadId} msg="${userMessage.slice(0, 30)}"`,
        );
        // 继续走到 B/C 升级判定（不要 return）
      } else if (this.hasPositiveSignalInContext(recentContext)) {
        // 第二层豁免：上下文窗口内仍存在积极信号
        this.logger.log(
          `E关键词命中但豁免[第2层:积极信号]: lead=${leadId} msg="${userMessage.slice(0, 30)}"`,
        );
      } else if (recentContext.customerCount < MIN_CUSTOMER_MESSAGES_FOR_E) {
        // 第三层豁免：客户消息累计不足
        this.logger.log(
          `E关键词命中但豁免[第3层:消息累计不足]: lead=${leadId} count=${recentContext.customerCount}`,
        );
      } else {
        await this.updateGrade(leadId, 'E', `E关键词命中: ${userMessage.slice(0, 50)}`, 'ai');
        return;
      }
    }

    // === D → B 恢复 ===
    if (currentGrade === 'D') {
      let recovered = false;
      for (const kw of GRADE_RECOVERY_KEYWORDS) {
        if (userMessage.includes(kw)) {
          await this.updateGrade(leadId, 'B', '回收用户恢复响应，表达服务意向', 'ai');
          recovered = true;
          break;
        }
      }
      if (recovered) return;
      // 即便没命中关键词，只要不是 E 关键词 + 有积极信号，也升级
      if (!eKeywordHit && this.hasPositiveSignalInContext(recentContext)) {
        await this.updateGrade(leadId, 'B', '回收用户恢复响应', 'ai');
        return;
      }
      return;
    }

    // === 拉取已采集需求 ===
    const [req] = await this.db
      .select()
      .from(requirements)
      .where(eq(requirements.leadId, leadId))
      .limit(1);
    const hasStartTime = !!req?.startTime;
    const hasBudget = !!req?.budget;
    const hasServiceType = !!req?.serviceType;

    // === B → A 升级（用户主动询问匹配方案/急需服务） ===
    if (currentGrade === 'B') {
      const hasDetails = hasServiceType && (hasStartTime || hasBudget);
      if (hasDetails) {
        for (const kw of GRADE_A_KEYWORDS) {
          if (userMessage.includes(kw)) {
            await this.updateGrade(leadId, 'A', '用户主动询问匹配方案，急需服务', 'ai');
            return;
          }
        }
      }
    }

    // === C → B 升级（用户表达了具体需求） ===
    if (currentGrade === 'C') {
      if (hasStartTime || hasBudget) {
        await this.updateGrade(leadId, 'B', '用户表达了具体需求（确定了服务时间/预算）', 'ai');
        return;
      }
    }
  }

  /**
   * 客户消息中是否包含 E 级关键词
   */
  private detectEKeyword(text: string): boolean {
    return GRADE_E_KEYWORDS.some((kw) => text.includes(kw));
  }

  /**
   * 上下文窗口内的客户消息是否含积极信号（恢复/匹配/急需）
   */
  private hasPositiveSignalInContext(ctx: { customerMessages: { content: string }[] }): boolean {
    const POSITIVE = [...GRADE_RECOVERY_KEYWORDS, ...GRADE_A_KEYWORDS];
    return ctx.customerMessages.some((m) => POSITIVE.some((kw) => m.content.includes(kw)));
  }

  /**
   * 取最近 CONTEXT_WINDOW_SIZE 条对话，返回正序（最早在前）
   */
  private async getRecentContext(leadId: string): Promise<{
    all: { role: string; content: string; createdAt: Date }[];
    customerMessages: { content: string }[];
    customerCount: number;
  }> {
    const rows = await this.db
      .select({
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
      .where(eq(chatSessions.leadId, leadId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(CONTEXT_WINDOW_SIZE);
    const all = rows.reverse();
    const customerMessages = all.filter((m) => m.role === 'customer');
    return { all, customerMessages, customerCount: customerMessages.length };
  }

  /**
   * 检查上一条 bot 消息是否在问需求采集类问题
   * 命中 → 客户回复中的"不需要"等否定词是在回答问题，不应触发 E 级降级
   */
  private async checkIfAnsweringRequirementQuestion(leadId: string): Promise<boolean> {
    const lastBot = await this.getLastBotMessage(leadId);
    if (!lastBot) return false;
    const REQUIREMENT_QUESTION_KEYWORDS = [
      '老人', '照护', '陪护', '做饭', '口味', '面积', '多大', '几口',
      '月休', '休息', '到岗', '什么时候', '地址', '哪个区', '街道',
      '预算', '薪资', '多少', '要求', '特殊要求', '保洁', '频次',
      '孩子', '宝宝', '预产期', '几号', '住家', '白班',
    ];
    return REQUIREMENT_QUESTION_KEYWORDS.some((kw) => lastBot.content.includes(kw));
  }

  private async getLastBotMessage(leadId: string): Promise<{ content: string } | null> {
    const rows = await this.db
      .select({
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
      .where(eq(chatSessions.leadId, leadId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(CONTEXT_WINDOW_SIZE);
    return rows.find((m) => m.role === 'bot') ?? null;
  }

  async getGradeHistory(leadId: string): Promise<GradeHistory[]> {
    const rows = await this.db
      .select()
      .from(leadGradeHistory)
      .where(eq(leadGradeHistory.leadId, leadId))
      .orderBy(desc(leadGradeHistory.createdAt));

    return rows.map((row) => ({
      id: row.id,
      leadId: row.leadId,
      oldGrade: row.oldGrade,
      newGrade: row.newGrade,
      reason: row.reason,
      triggeredBy: row.triggeredBy as GradeTransitionTrigger,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async regrade(leadId: string, grade: string, reason: string): Promise<void> {
    if (!VALID_GRADES.includes(grade)) {
      throw new Error(`无效的分级: ${grade}`);
    }
    await this.updateGrade(leadId, grade, reason, 'manual', 1);
  }
}
