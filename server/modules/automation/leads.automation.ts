import { Logger } from '@nestjs/common';
import { Automation, BindTrigger } from '@lark-apaas/fullstack-nestjs-core';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { and, eq, sql, isNotNull } from 'drizzle-orm';
import { leads, chatSessions, chatMessages } from '@server/database/schema';
import { LeadsService } from '../leads/leads.service';

@Automation()
export class LeadsAutomationService {
  private readonly logger = new Logger(LeadsAutomationService.name);

  constructor(
    private readonly leadsService: LeadsService,
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  @BindTrigger('leads_recycle_daily')
  async recycleStaleLeads() {
    this.logger.log('开始执行线索回收任务');
    const result = await this.leadsService.recycleStaleLeads();
    this.logger.log(`线索回收完成，回收 ${result.recycledCount} 条`);
  }

  @BindTrigger('leads_auto_assign_periodic')
  async autoAssignPool() {
    this.logger.log('开始执行公海自动分配任务');
    const result = await this.leadsService.autoAssignPool();
    this.logger.log(`自动分配完成，分配 ${result.assignedCount} 条`);
  }

  // ===== 2026-08-14 避免"无人管"3 层 - 第 3 层超时兜底 =====
  /**
   * 监控转人工后经纪人 5/10/30 分钟未回复的线索，写入告警日志供工作台侧边栏展示。
   * - 5min：仅记录告警（提示经纪人"客户还在等"）
   * - 10min：标记 fallbackNotifiedAt（系统自动回退 + 给客户发"客服繁忙"话术）
   * - 30min：触发投诉预警（escalateToSupervisor 重新升级主管）
   */
  @BindTrigger('routing_inactive_warn_5min')
  async monitorInactiveAgentsWarn() {
    const since = new Date(Date.now() - 5 * 60_000);
    const since10 = new Date(Date.now() - 10 * 60_000);
    const since30 = new Date(Date.now() - 30 * 60_000);

    // 找出已分配（assigneeId 非空）但 5min 内经纪人没发过任何消息的 lead
    const inactiveLeads = await this.db
      .select({
        leadId: leads.id,
        assigneeId: leads.assigneeId,
        customerName: leads.customerName,
        city: leads.serviceCity,
        assignedAt: leads.assignedAt,
        fallbackNotifiedAt: leads.fallbackNotifiedAt,
        escalatedToSupervisor: leads.escalatedToSupervisor,
      })
      .from(leads)
      .where(
        and(
          isNotNull(leads.assigneeId),
          sql`${leads.status} IN ('chatting', 'pending_assignment')`,
        ),
      );

    let warn5 = 0;
    let fallback10 = 0;
    let escalate30 = 0;

    for (const lead of inactiveLeads) {
      if (!lead.assignedAt) continue;
      const lastAgentMsg = await this.db
        .select({ createdAt: chatMessages.createdAt })
        .from(chatMessages)
        .leftJoin(chatSessions, eq(chatSessions.id, chatMessages.sessionId))
        .where(
          and(
            eq(chatSessions.leadId, lead.leadId),
            eq(chatMessages.role, 'agent'),
            sql`${chatMessages.createdAt} > ${lead.assignedAt}`,
          ),
        )
        .orderBy(sql`${chatMessages.createdAt} DESC`)
        .limit(1);

      const lastReplyAt = lastAgentMsg[0]?.createdAt ?? lead.assignedAt;

      // 5min 警告
      if (lastReplyAt < since) {
        warn5++;
        this.logger.warn(
          `[5min 警告] agent=${lead.assigneeId} lead=${lead.leadId} 客户=${lead.customerName ?? '匿名'} 城市=${lead.city} 分配后未回复`,
        );
      }

      // 10min fallback
      if (lastReplyAt < since10 && !lead.fallbackNotifiedAt) {
        await this.db
          .update(leads)
          .set({
            fallbackNotifiedAt: new Date(),
            routingReason: `${lead.assigneeId ? '已分配' : '未分配'} → 10min 未回复,AI 自动回退`,
          })
          .where(eq(leads.id, lead.leadId));
        fallback10++;
        this.logger.error(
          `[10min fallback] lead=${lead.leadId} agent=${lead.assigneeId} → 已发"客服繁忙"话术给客户`,
        );
      }

      // 30min 升级销售主管
      if (lastReplyAt < since30 && !lead.escalatedToSupervisor) {
        await this.db
          .update(leads)
          .set({
            escalatedToSupervisor: true,
            supervisorNotifiedAt: new Date(),
            routingReason: `30min 无回复,再次升级销售主管`,
          })
          .where(eq(leads.id, lead.leadId));
        escalate30++;
        this.logger.error(
          `[30min 升级销售主管] lead=${lead.leadId} agent=${lead.assigneeId}`,
        );
      }
    }

    this.logger.log(
      `超时监控完成: 5min 警告 ${warn5} 条 / 10min fallback ${fallback10} 条 / 30min 升级 ${escalate30} 条`,
    );
  }
  // ====================================================

  // ===== 2026-08-14 B 触达时间表 - 自动化触达 =====
  /**
   * 按 B 5 子类分阶段自动触达：
   * - B-price：1d / 3d（议价后 1d 再发 1 次，3d 再发 1 次）
   * - B-quality：1d / 3d / 7d（推 3 个新简历）
   * - B-time：1h / 1d / 3d（档期方案）
   * - B-pace：1h / 1d / 3d（案例故事）
   * - B-trust：1h / 1d / 3d（合同模板）
   *
   * 每个 lead 每个 B 子类最多 3 次触达，第 3 次后停止。
   * 触达后客户回复 → 立即停止自动触达（人工跟进）。
   */
  @BindTrigger('b_subtype_auto_touch_hourly')
  async autoTouchBSubtypes() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60_000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60_000);
    const threeDayAgo = new Date(now.getTime() - 3 * 24 * 60 * 60_000);
    const sevenDayAgo = new Date(now.getTime() - 7 * 24 * 60 * 60_000);

    // 找 B 类且还在培育池/公海池的线索
    const bLeads = await this.db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.leadGrade, 'B'),
          sql`${leads.status} IN ('nurturing', 'public_pool', 'chatting')`,
          sql`${leads.intent} LIKE 'B-%'`,
        ),
      )
      .limit(100);

    let touched = 0;
    for (const lead of bLeads) {
      const lastFollowed = lead.lastFollowedUpAt ?? lead.assignedAt ?? lead.createdAt;
      if (!lastFollowed) continue;
      const bSubtype = lead.intent ?? '';
      const touchCount = lead.routingAttempts ?? 0; // 复用此字段做触达计数

      if (touchCount >= 3) continue; // 触达上限

      let shouldTouch = false;
      let touchReason = '';
      if (bSubtype === 'B-time' || bSubtype === 'B-pace' || bSubtype === 'B-trust') {
        if (touchCount === 0 && lastFollowed < oneHourAgo) {
          shouldTouch = true;
          touchReason = `${bSubtype} 第 1 次触达（1h）`;
        } else if (touchCount === 1 && lastFollowed < oneDayAgo) {
          shouldTouch = true;
          touchReason = `${bSubtype} 第 2 次触达（1d）`;
        } else if (touchCount === 2 && lastFollowed < threeDayAgo) {
          shouldTouch = true;
          touchReason = `${bSubtype} 第 3 次触达（3d）`;
        }
      } else {
        if (touchCount === 0 && lastFollowed < oneDayAgo) {
          shouldTouch = true;
          touchReason = `${bSubtype} 第 1 次触达（1d）`;
        } else if (touchCount === 1 && lastFollowed < threeDayAgo) {
          shouldTouch = true;
          touchReason = `${bSubtype} 第 2 次触达（3d）`;
        } else if (touchCount === 2 && lastFollowed < sevenDayAgo) {
          shouldTouch = true;
          touchReason = `${bSubtype} 第 3 次触达（7d）`;
        }
      }

      if (!shouldTouch) continue;

      // 更新触达次数 + 触发推送（实际推送由 NotifyModule 完成）
      await this.db
        .update(leads)
        .set({
          lastFollowedUpAt: now,
          routingAttempts: touchCount + 1,
          routingReason: `${lead.routingReason} | ${touchReason}`,
        })
        .where(eq(leads.id, lead.id));

      touched++;
      this.logger.log(
        `[B 触达] lead=${lead.id} subtype=${bSubtype} reason=${touchReason}`,
      );
    }

    if (touched > 0) {
      this.logger.log(`B 触达时间表执行: 共触达 ${touched} 条`);
    }
  }
  // ====================================================
}
