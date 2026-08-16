import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { sql, eq, and, gte, inArray } from 'drizzle-orm';
import { leads, contactLogs, chatSessions, leadGradeHistory, requirements, aiConfigs } from '@server/database/schema';
import { normalizeSource } from '@shared/channels';
import type {
  TeamPerformanceItem,
  LeadFunnel,
  TimelineItem,
  SystemHealth,
  SourceEffectiveness,
  GradeFunnelItem,
  AiEffectivenessKpi,
  AiEffectivenessResponse,
} from '@shared/api.interface';

@Injectable()
export class StatsService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getTeamPerformance(): Promise<TeamPerformanceItem[]> {
    const result = await this.db
      .select({
        assigneeId: leads.assigneeId,
        assignedCount: sql<number>`count(DISTINCT ${leads.id})`,
        convertedCount:
          sql<number>`count(DISTINCT CASE WHEN ${leads.status} IN ('collected', 'closed') THEN ${leads.id} END)`,
        chattingCount:
          sql<number>`count(DISTINCT CASE WHEN ${leads.status} = 'chatting' THEN ${leads.id} END)`,
        contactCount: sql<number>`count(DISTINCT ${contactLogs.id})`,
        activeSessions:
          sql<number>`count(DISTINCT CASE WHEN ${chatSessions.status} = 'active' THEN ${chatSessions.id} END)`,
      })
      .from(leads)
      .leftJoin(contactLogs, eq(contactLogs.leadId, leads.id))
      .leftJoin(chatSessions, eq(chatSessions.leadId, leads.id))
      .where(sql`${leads.assigneeId} IS NOT NULL`)
      .groupBy(leads.assigneeId);

    return result.map((row: Record<string, unknown>) => {
      const assigned = Number(row.assignedCount);
      const converted = Number(row.convertedCount);
      return {
        assigneeId: row.assigneeId as string,
        assignedCount: assigned,
        convertedCount: converted,
        chattingCount: Number(row.chattingCount),
        contactCount: Number(row.contactCount),
        activeSessions: Number(row.activeSessions),
        conversionRate:
          assigned > 0
            ? Math.round((converted / assigned) * 1000) / 10
            : 0,
      };
    });
  }

  async getLeadFunnel(): Promise<LeadFunnel> {
    const result = await this.db
      .select({
        status: leads.status,
        count: sql<number>`count(*)`,
      })
      .from(leads)
      .groupBy(leads.status);

    const funnel: LeadFunnel = {
      new: 0,
      contacting: 0,
      chatting: 0,
      collected: 0,
      closed: 0,
    };

    for (const row of result) {
      const status = row.status as keyof LeadFunnel;
      if (status in funnel) {
        funnel[status] = Number(row.count);
      }
    }

    return funnel;
  }

  async getTimeline(days: number): Promise<TimelineItem[]> {
    const daysInt = Math.min(Math.max(days, 1), 90);

    const [dailyLeads, dailyContacts, dailyConversions] = await Promise.all([
      this.db
        .select({
          date: sql<string>`to_char(${leads.createdAt}::date, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)`,
        })
        .from(leads)
        .where(gte(leads.createdAt, sql`now() - interval '1 day' * ${daysInt}`))
        .groupBy(sql`${leads.createdAt}::date`)
        .orderBy(sql`${leads.createdAt}::date`),

      this.db
        .select({
          date: sql<string>`to_char(${contactLogs.createdAt}::date, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)`,
        })
        .from(contactLogs)
        .where(
          gte(contactLogs.createdAt, sql`now() - interval '1 day' * ${daysInt}`),
        )
        .groupBy(sql`${contactLogs.createdAt}::date`)
        .orderBy(sql`${contactLogs.createdAt}::date`),

      this.db
        .select({
          date: sql<string>`to_char(${leads.updatedAt}::date, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)`,
        })
        .from(leads)
        .where(
          and(
            inArray(leads.status, ['collected', 'closed']),
            gte(leads.updatedAt, sql`now() - interval '1 day' * ${daysInt}`),
          ),
        )
        .groupBy(sql`${leads.updatedAt}::date`)
        .orderBy(sql`${leads.updatedAt}::date`),
    ]);

    const dateSet = new Set<string>();
    const leadsMap = new Map<string, number>();
    const contactsMap = new Map<string, number>();
    const conversionsMap = new Map<string, number>();

    for (const r of dailyLeads) {
      dateSet.add(r.date);
      leadsMap.set(r.date, Number(r.count));
    }
    for (const r of dailyContacts) {
      dateSet.add(r.date);
      contactsMap.set(r.date, Number(r.count));
    }
    for (const r of dailyConversions) {
      dateSet.add(r.date);
      conversionsMap.set(r.date, Number(r.count));
    }

    return Array.from(dateSet)
      .sort()
      .map((date: string) => ({
        date,
        newLeads: leadsMap.get(date) ?? 0,
        contacts: contactsMap.get(date) ?? 0,
        conversions: conversionsMap.get(date) ?? 0,
      }));
  }

  async getSourceEffectiveness(): Promise<SourceEffectiveness[]> {
    const result = await this.db
      .select({
        source: leads.source,
        total: sql<number>`count(*)`,
        converted:
          sql<number>`count(CASE WHEN ${leads.status} IN ('collected', 'closed') THEN 1 END)`,
      })
      .from(leads)
      .groupBy(leads.source);

    return result.map((row: Record<string, unknown>) => {
      const total = Number(row.total);
      const converted = Number(row.converted);
      return {
        source: normalizeSource(row.source as string),
        total,
        converted,
        conversionRate:
          total > 0 ? Math.round((converted / total) * 1000) / 10 : 0,
      };
    });
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const [leadsStats] = await this.db
      .select({
        totalLeads: sql<number>`count(*)`,
        unassigned:
          sql<number>`count(CASE WHEN ${leads.assigneeId} IS NULL THEN 1 END)`,
        poolSize:
          sql<number>`count(CASE WHEN ${leads.assigneeId} IS NULL AND ${leads.status} NOT IN ('closed', 'collected') THEN 1 END)`,
        todayNew:
          sql<number>`count(CASE WHEN ${leads.createdAt} >= CURRENT_DATE THEN 1 END)`,
      })
      .from(leads);

    const [sessionsStats] = await this.db
      .select({
        total: sql<number>`count(*)`,
        active:
          sql<number>`count(CASE WHEN ${chatSessions.status} = 'active' THEN 1 END)`,
      })
      .from(chatSessions);

    const [contactsStats] = await this.db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(contactLogs);

    return {
      totalLeads: Number(leadsStats?.totalLeads ?? 0),
      unassigned: Number(leadsStats?.unassigned ?? 0),
      poolSize: Number(leadsStats?.poolSize ?? 0),
      todayNew: Number(leadsStats?.todayNew ?? 0),
      activeSessions: Number(sessionsStats?.active ?? 0),
      totalSessions: Number(sessionsStats?.total ?? 0),
      totalContacts: Number(contactsStats?.total ?? 0),
    };
  }

  async getGradeFunnel(): Promise<GradeFunnelItem[]> {
    const [totalRow] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(leads);
    const totalLeads = Number(totalRow?.count ?? 0);

    const gradeRows = await this.db
      .select({
        grade: leads.leadGrade,
        count: sql<number>`count(*)`,
      })
      .from(leads)
      .where(sql`${leads.leadGrade} IS NOT NULL`)
      .groupBy(leads.leadGrade);

    const gradeMap = new Map<string, number>();
    for (const row of gradeRows) {
      gradeMap.set(row.grade as string, Number(row.count));
    }

    const countA = gradeMap.get('A') ?? 0;
    const countB = gradeMap.get('B') ?? 0;
    const countC = gradeMap.get('C') ?? 0;
    const countD = gradeMap.get('D') ?? 0;
    const countE = gradeMap.get('E') ?? 0;
    const validCount = countA + countB + countC;

    const pct = (n: number): number =>
      totalLeads > 0 ? Math.round((n / totalLeads) * 10000) / 100 : 0;

    const stages: GradeFunnelItem[] = [
      { stage: 'total', label: '线索总入库', count: totalLeads, percentage: 100, color: '#1e293b' },
      { stage: 'valid', label: '有效线索(A+B+C)', count: validCount, percentage: pct(validCount), color: '#2563eb' },
      { stage: 'C', label: 'C级(培育池)', count: countC, percentage: pct(countC), color: '#3b82f6' },
      { stage: 'B', label: 'B级(优先跟进)', count: countB, percentage: pct(countB), color: '#d97706' },
      { stage: 'E', label: 'E级(过滤)', count: countE, percentage: pct(countE), color: '#94a3b8' },
      { stage: 'D', label: 'D级(回收池)', count: countD, percentage: pct(countD), color: '#0d9488' },
      { stage: 'A', label: 'A级(立即处理)', count: countA, percentage: pct(countA), color: '#dc2626' },
    ];

    return stages;
  }

  async getAiEffectiveness(): Promise<AiEffectivenessResponse> {
    const [totalRow] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(leads);
    const totalLeads = Number(totalRow?.count ?? 0);

    const gradeFunnel = await this.getGradeFunnel();

    const [aiAutoRow] = await this.db
      .select({
        gradedCount: sql<number>`count(DISTINCT ${leads.id})`,
        aiCount: sql<number>`count(DISTINCT CASE WHEN ${leadGradeHistory.triggeredBy} IN ('ai', 'system') THEN ${leads.id} END)`,
      })
      .from(leads)
      .innerJoin(leadGradeHistory, eq(leadGradeHistory.leadId, leads.id));
    const gradedCount = Number(aiAutoRow?.gradedCount ?? 0);
    const aiCount = Number(aiAutoRow?.aiCount ?? 0);
    const aiAutomationRate = gradedCount > 0 ? Math.round((aiCount / gradedCount) * 1000) / 10 : 0;

    const [avgTimeRow] = await this.db
      .select({
        avgSeconds: sql<number>`coalesce(avg(extract(epoch from (${leadGradeHistory.createdAt} - ${leads.createdAt}))), 0)`,
      })
      .from(leads)
      .innerJoin(leadGradeHistory, eq(leadGradeHistory.leadId, leads.id))
      .where(eq(leadGradeHistory.oldGrade, null as unknown as string));
    const avgGradeSeconds = Math.round(Number(avgTimeRow?.avgSeconds ?? 0));

    const [reqRow] = await this.db
      .select({
        totalReq: sql<number>`count(*)`,
        completeReq: sql<number>`count(CASE WHEN ${requirements.serviceType} IS NOT NULL AND ${requirements.budget} IS NOT NULL AND ${requirements.startTime} IS NOT NULL THEN 1 END)`,
      })
      .from(requirements);
    const totalReq = Number(reqRow?.totalReq ?? 0);
    const completeReq = Number(reqRow?.completeReq ?? 0);
    const reqCompletenessRate = totalReq > 0 ? Math.round((completeReq / totalReq) * 1000) / 10 : 0;

    const [phoneRow] = await this.db
      .select({
        verified: sql<number>`count(CASE WHEN ${leads.phoneVerified} = true THEN 1 END)`,
      })
      .from(leads);
    const phoneVerifiedCount = Number(phoneRow?.verified ?? 0);
    const phoneVerificationRate = totalLeads > 0 ? Math.round((phoneVerifiedCount / totalLeads) * 1000) / 10 : 0;

    const [nurtureRow] = await this.db
      .select({
        activated: sql<number>`count(DISTINCT ${leadGradeHistory.leadId})`,
      })
      .from(leadGradeHistory)
      .where(and(
        eq(leadGradeHistory.oldGrade, 'C'),
        inArray(leadGradeHistory.newGrade, ['A', 'B']),
      ));
    const [nurtureBaseRow] = await this.db
      .select({
        total: sql<number>`count(DISTINCT ${leadGradeHistory.leadId})`,
      })
      .from(leadGradeHistory)
      .where(eq(leadGradeHistory.oldGrade, 'C'));
    const nurtureBase = Number(nurtureBaseRow?.total ?? 0);
    const nurtureActivated = Number(nurtureRow?.activated ?? 0);
    const nurtureActivationRate = nurtureBase > 0 ? Math.round((nurtureActivated / nurtureBase) * 1000) / 10 : 0;

    const [recycleRow] = await this.db
      .select({
        reactivated: sql<number>`count(DISTINCT ${leadGradeHistory.leadId})`,
      })
      .from(leadGradeHistory)
      .where(and(
        eq(leadGradeHistory.oldGrade, 'D'),
        inArray(leadGradeHistory.newGrade, ['A', 'B', 'C']),
      ));
    const [recycleBaseRow] = await this.db
      .select({
        total: sql<number>`count(DISTINCT ${leadGradeHistory.leadId})`,
      })
      .from(leadGradeHistory)
      .where(eq(leadGradeHistory.oldGrade, 'D'));
    const recycleBase = Number(recycleBaseRow?.total ?? 0);
    const recycleReactivated = Number(recycleRow?.reactivated ?? 0);
    const recycleRecoveryRate = recycleBase > 0 ? Math.round((recycleReactivated / recycleBase) * 1000) / 10 : 0;

    const validCount = gradeFunnel.find((s: GradeFunnelItem) => s.stage === 'valid')?.count ?? 0;
    const leadValidityRate = totalLeads > 0 ? Math.round((validCount / totalLeads) * 1000) / 10 : 0;

    const [transferRow] = await this.db
      .select({
        transferredLeads: sql<number>`count(DISTINCT ${chatSessions.leadId})`,
      })
      .from(chatSessions)
      .where(sql`${chatSessions.transferReason} IS NOT NULL`);
    const transferredLeads = Number(transferRow?.transferredLeads ?? 0);
    const aiTransferRate = totalLeads > 0 ? Math.round((transferredLeads / totalLeads) * 1000) / 10 : 0;

    const [gradingAccuracyRow] = await this.db
      .select({ configValue: aiConfigs.configValue })
      .from(aiConfigs)
      .where(eq(aiConfigs.configKey, 'grading_accuracy_benchmark'))
      .limit(1);
    const gradingAccuracy = gradingAccuracyRow
      ? Number(gradingAccuracyRow.configValue)
      : null;

    const kpis: AiEffectivenessKpi[] = [
      {
        key: 'grading_accuracy',
        name: '线索分级准确率',
        definition: 'AI分级与人工标注一致的比例',
        target: 80,
        actual: gradingAccuracy,
        unit: '%',
        dataSource: '抽样验证100条',
        direction: 'higher',
      },
      {
        key: 'ai_automation',
        name: 'AI自动化率',
        definition: '无需人工介入完成分级的线索数 / 总线索数',
        target: 85,
        actual: aiAutomationRate,
        unit: '%',
        dataSource: 'lead_grade_history.triggeredBy',
        direction: 'higher',
      },
      {
        key: 'avg_grading_time',
        name: '平均分级时长',
        definition: '从线索入库到完成分级的平均时间',
        target: 30,
        actual: avgGradeSeconds,
        unit: '秒',
        dataSource: 'leads.createdAt - lead_grade_history.createdAt',
        direction: 'lower',
      },
      {
        key: 'req_completeness',
        name: '需求采集完整率',
        definition: '关键字段(服务类型+时间+预算)填充率',
        target: 75,
        actual: reqCompletenessRate,
        unit: '%',
        dataSource: 'requirements表字段非空率',
        direction: 'higher',
      },
      {
        key: 'phone_verification',
        name: '电话验证率',
        definition: '已验证电话的线索数 / 总线索数',
        target: 70,
        actual: phoneVerificationRate,
        unit: '%',
        dataSource: 'leads.phoneVerified',
        direction: 'higher',
      },
      {
        key: 'nurture_activation',
        name: '培育激活率',
        definition: 'C级线索通过培育升级为B/A级的比例',
        target: 15,
        actual: nurtureActivationRate,
        unit: '%',
        dataSource: 'lead_grade_history + lead_nurturing_tasks',
        direction: 'higher',
      },
      {
        key: 'recycle_recovery',
        name: '回收恢复率',
        definition: 'D级线索通过回收重新激活的比例',
        target: 10,
        actual: recycleRecoveryRate,
        unit: '%',
        dataSource: 'lead_grade_history.reactivated',
        direction: 'higher',
      },
      {
        key: 'lead_validity',
        name: '线索有效率',
        definition: '(A+B+C级线索) / 总线索数',
        target: 60,
        actual: leadValidityRate,
        unit: '%',
        dataSource: 'leads.leadGrade分布',
        direction: 'higher',
      },
      {
        key: 'ai_transfer',
        name: 'AI转人工率',
        definition: '转人工线索数 / 总线索数',
        target: 20,
        actual: aiTransferRate,
        unit: '%',
        dataSource: 'chat_sessions.transferReason',
        direction: 'lower',
      },
    ];

    return { kpis, gradeFunnel, totalLeads };
  }

  async getPrometheusMetrics(): Promise<string> {
    const [health, funnel] = await Promise.all([
      this.getSystemHealth(),
      this.getLeadFunnel(),
    ]);
    const converted = funnel.collected + funnel.closed;

    const lines: string[] = [
      '# HELP leads_total Total number of leads',
      '# TYPE leads_total counter',
      `leads_total ${health.totalLeads}`,
      '',
      '# HELP leads_today_new New leads created today',
      '# TYPE leads_today_new gauge',
      `leads_today_new ${health.todayNew}`,
      '',
      '# HELP leads_unassigned Leads without assignee',
      '# TYPE leads_unassigned gauge',
      `leads_unassigned ${health.unassigned}`,
      '',
      '# HELP leads_pool_size Leads in pool (unassigned and not closed/collected)',
      '# TYPE leads_pool_size gauge',
      `leads_pool_size ${health.poolSize}`,
      '',
      '# HELP leads_converted_total Total converted leads (collected or closed)',
      '# TYPE leads_converted_total counter',
      `leads_converted_total ${converted}`,
      '',
      '# HELP chat_sessions_active Active chat sessions',
      '# TYPE chat_sessions_active gauge',
      `chat_sessions_active ${health.activeSessions}`,
      '',
      '# HELP chat_sessions_total Total chat sessions',
      '# TYPE chat_sessions_total counter',
      `chat_sessions_total ${health.totalSessions}`,
      '',
      '# HELP contact_logs_total Total contact logs',
      '# TYPE contact_logs_total counter',
      `contact_logs_total ${health.totalContacts}`,
      '',
    ];

    return lines.join('\n');
  }
}
