import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, sql } from 'drizzle-orm';
import { aiLearnedTemplates, aiTemplateUsage } from '@server/database/schema';

export interface LearnedTemplate {
  id: string;
  topicKey: string;
  questionText: string;
  answerText: string;
  useCount: number;
  successCount: number;
  failCount: number;
  status: string;
  successThreshold: number;
}

export interface PendingUsage {
  id: string;
  templateId: string;
  sessionId: string;
}

const LEARNABLE_TOPIC_MAP: Record<string, string> = {
  restDaysOverride: 'rest_days_custom',
  '二选一问题超范围，自动转人工': 'two_choice_out_of_range',
};

const MIN_USES_FOR_MASTERY = 3;

@Injectable()
export class ReplyLearningService {
  private readonly logger = new Logger(ReplyLearningService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  determineTopicKey(transferReason: string): string | null {
    return LEARNABLE_TOPIC_MAP[transferReason] ?? null;
  }

  async findTemplate(topicKey: string): Promise<LearnedTemplate | null> {
    const mastered = await this.db
      .select()
      .from(aiLearnedTemplates)
      .where(and(
        eq(aiLearnedTemplates.topicKey, topicKey),
        eq(aiLearnedTemplates.status, 'mastered'),
      ))
      .orderBy(desc(aiLearnedTemplates.successCount))
      .limit(1);
    if (mastered.length > 0) return mastered[0] as LearnedTemplate;

    const learning = await this.db
      .select()
      .from(aiLearnedTemplates)
      .where(and(
        eq(aiLearnedTemplates.topicKey, topicKey),
        eq(aiLearnedTemplates.status, 'learning'),
      ))
      .orderBy(desc(aiLearnedTemplates.successCount))
      .limit(1);
    if (learning.length > 0) return learning[0] as LearnedTemplate;

    return null;
  }

  async storeTemplate(
    topicKey: string,
    question: string,
    answer: string,
    sessionId: string,
  ): Promise<void> {
    await this.db.insert(aiLearnedTemplates).values({
      topicKey,
      questionText: question,
      answerText: answer,
      sourceSessionId: sessionId,
    });
    this.logger.log(`存储话术模板: topic=${topicKey}, question=${question.slice(0, 50)}...`);
  }

  async startUsage(templateId: string, sessionId: string): Promise<void> {
    await this.db.insert(aiTemplateUsage).values({
      templateId,
      sessionId,
      status: 'pending',
    });
    await this.db
      .update(aiLearnedTemplates)
      .set({ useCount: sql`${aiLearnedTemplates.useCount} + 1` })
      .where(eq(aiLearnedTemplates.id, templateId));
  }

  async checkPendingUsage(sessionId: string): Promise<PendingUsage | null> {
    const rows = await this.db
      .select()
      .from(aiTemplateUsage)
      .where(and(
        eq(aiTemplateUsage.sessionId, sessionId),
        eq(aiTemplateUsage.status, 'pending'),
      ))
      .limit(1);
    return (rows[0] as PendingUsage) ?? null;
  }

  async recordOutcome(usageId: string, templateId: string, success: boolean): Promise<void> {
    await this.db
      .update(aiTemplateUsage)
      .set({ status: success ? 'success' : 'fail' })
      .where(eq(aiTemplateUsage.id, usageId));

    if (success) {
      await this.db
        .update(aiLearnedTemplates)
        .set({ successCount: sql`${aiLearnedTemplates.successCount} + 1` })
        .where(eq(aiLearnedTemplates.id, templateId));
    } else {
      await this.db
        .update(aiLearnedTemplates)
        .set({ failCount: sql`${aiLearnedTemplates.failCount} + 1` })
        .where(eq(aiLearnedTemplates.id, templateId));
    }

    await this.checkMastery(templateId);
  }

  async cancelPendingUsage(sessionId: string): Promise<void> {
    const pending = await this.checkPendingUsage(sessionId);
    if (pending) {
      await this.recordOutcome(pending.id, pending.templateId, false);
      this.logger.log(`取消待追踪模板使用: session=${sessionId}, template=${pending.templateId}`);
    }
  }

  private async checkMastery(templateId: string): Promise<void> {
    const rows = await this.db
      .select()
      .from(aiLearnedTemplates)
      .where(eq(aiLearnedTemplates.id, templateId))
      .limit(1);
    if (rows.length === 0) return;

    const template = rows[0];
    if (template.status === 'mastered') return;
    if (template.useCount < MIN_USES_FOR_MASTERY) return;

    const successRate = (template.successCount / template.useCount) * 100;
    if (successRate >= template.successThreshold) {
      await this.db
        .update(aiLearnedTemplates)
        .set({ status: 'mastered' })
        .where(eq(aiLearnedTemplates.id, templateId));
      this.logger.log(
        `模板 ${templateId} 升级为 mastered (成功率: ${successRate.toFixed(1)}%)`,
      );
    }
  }
}
