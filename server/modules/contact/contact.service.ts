import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { contactLogs, leads } from '@server/database/schema';
import { eq, desc } from 'drizzle-orm';
import type {
  ContactLog,
  ContactType,
  ContactStatus,
  CreateContactLogRequest,
} from '@shared/api.interface';

/** 将数据库行映射为 ContactLog 接口（Date → ISO string） */
function mapToContactLog(row: typeof contactLogs.$inferSelect): ContactLog {
  return {
    id: row.id,
    leadId: row.leadId,
    contactType: row.contactType as ContactType,
    status: row.status as ContactStatus,
    notes: row.notes,
    operatorId: row.operatorId,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  /**
   * 获取线索的联系记录列表（按创建时间降序）
   */
  async listByLeadId(leadId: string): Promise<ContactLog[]> {
    const rows = await this.db
      .select()
      .from(contactLogs)
      .where(eq(contactLogs.leadId, leadId))
      .orderBy(desc(contactLogs.createdAt));

    return rows.map(mapToContactLog);
  }

  /**
   * 添加联系记录
   */
  async create(
    leadId: string,
    data: CreateContactLogRequest,
    operatorId: string,
  ): Promise<ContactLog> {
    // 校验线索是否存在
    const leadExists = await this.db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (leadExists.length === 0) {
      throw new NotFoundException(`线索 ${leadId} 不存在`);
    }

    const [row] = await this.db
      .insert(contactLogs)
      .values({
        leadId,
        contactType: data.contactType,
        status: data.status,
        notes: data.notes ?? null,
        operatorId,
      })
      .returning();

    await this.db
      .update(leads)
      .set({ lastFollowedUpAt: new Date() })
      .where(eq(leads.id, leadId));

    return mapToContactLog(row);
  }
}
