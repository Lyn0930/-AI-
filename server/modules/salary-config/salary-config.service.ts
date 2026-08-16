import { Injectable, Inject, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { salaryConfig } from '@server/database/schema';
import { and, asc, eq } from 'drizzle-orm';
import type {
  SalaryConfig,
  CreateSalaryConfigRequest,
  UpdateSalaryConfigRequest,
} from '@shared/api.interface';
import { SchemaMigrationService } from '../migration/schema-migration.service';

function mapToSalaryConfig(row: typeof salaryConfig.$inferSelect): SalaryConfig {
  // userProfile 自定义类型 fromDriver 返回 string（userId 字符串）
  // 这里只关心 "是否有人改过"，不需要解析 user
  const updatedBy =
    row.updatedBy && typeof row.updatedBy === 'string' && row.updatedBy.length > 0
      ? row.updatedBy
      : null;
  return {
    id: row.id,
    serviceType: row.serviceType,
    cityTier: row.cityTier as SalaryConfig['cityTier'],
    areaType: row.areaType as SalaryConfig['areaType'],
    subDimension: (row.subDimension ?? '') as SalaryConfig['subDimension'],
    baseLow: row.baseLow,
    baseHigh: row.baseHigh,
    altLow: row.altLow,
    altHigh: row.altHigh,
    updatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * 住家保姆等市场薪资区间配置服务。
 *
 * 数据源是数据库 salary_config 表，业务方在「智能路由管理 → 薪资话术」Tab 直接改。
 * chat.service 在生成 persona 时调 listByServiceType()，把当前生效的区间拼到 persona
 * 末尾作为可引用的事实数据，AI 据此生成对应话术。
 */
@Injectable()
export class SalaryConfigService {
  private readonly logger = new Logger(SalaryConfigService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly schemaMigration: SchemaMigrationService,
  ) {}

  async list(): Promise<SalaryConfig[]> {
    // 必须先 await 迁移：GET /api/salary-config 可能在 buildPersonaReference() 之前被调用
    // （如 UI Tab 首次加载、smoke test），fire-and-forget 会让 list() 命中尚未建表的 DB → 42P01
    await this.schemaMigration.ensureSalaryConfigTableAndSeed();
    const rows = await this.db
      .select()
      .from(salaryConfig)
      .orderBy(
        asc(salaryConfig.serviceType),
        asc(salaryConfig.cityTier),
        asc(salaryConfig.areaType),
        asc(salaryConfig.subDimension),
      );
    return rows.map(mapToSalaryConfig);
  }

  async listByServiceType(serviceType: string): Promise<SalaryConfig[]> {
    await this.schemaMigration.ensureSalaryConfigTableAndSeed();
    const rows = await this.db
      .select()
      .from(salaryConfig)
      .where(eq(salaryConfig.serviceType, serviceType))
      .orderBy(asc(salaryConfig.cityTier), asc(salaryConfig.areaType));
    return rows.map(mapToSalaryConfig);
  }

  async create(data: CreateSalaryConfigRequest): Promise<SalaryConfig> {
    const subDim = data.subDimension ?? '';
    const existing = await this.db
      .select()
      .from(salaryConfig)
      .where(
        and(
          eq(salaryConfig.serviceType, data.serviceType),
          eq(salaryConfig.cityTier, data.cityTier),
          eq(salaryConfig.areaType, data.areaType),
          eq(salaryConfig.subDimension, subDim),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      const dimLabel = subDim ? ` + ${subDim}` : '';
      throw new ConflictException(
        `服务 ${data.serviceType} + ${data.cityTier} + ${data.areaType}${dimLabel} 已存在，请用编辑修改`,
      );
    }

    const [row] = await this.db
      .insert(salaryConfig)
      .values({
        serviceType: data.serviceType,
        cityTier: data.cityTier,
        areaType: data.areaType,
        subDimension: subDim,
        baseLow: data.baseLow,
        baseHigh: data.baseHigh,
        altLow: data.altLow,
        altHigh: data.altHigh,
      })
      .returning();

    return mapToSalaryConfig(row);
  }

  async update(id: string, data: UpdateSalaryConfigRequest): Promise<SalaryConfig> {
    const updateData: Partial<{
      baseLow: number;
      baseHigh: number;
      altLow: number;
      altHigh: number;
      updatedBy: string;
    }> = {};
    if (data.baseLow !== undefined) updateData.baseLow = data.baseLow;
    if (data.baseHigh !== undefined) updateData.baseHigh = data.baseHigh;
    if (data.altLow !== undefined) updateData.altLow = data.altLow;
    if (data.altHigh !== undefined) updateData.altHigh = data.altHigh;
    if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;

    if (Object.keys(updateData).length === 0) {
      // 没要改的字段，直接返回当前行
      const [row] = await this.db
        .select()
        .from(salaryConfig)
        .where(eq(salaryConfig.id, id))
        .limit(1);
      if (!row) throw new NotFoundException(`薪资配置 ${id} 不存在`);
      return mapToSalaryConfig(row);
    }

    const [row] = await this.db
      .update(salaryConfig)
      .set(updateData)
      .where(eq(salaryConfig.id, id))
      .returning();

    if (!row) {
      throw new NotFoundException(`薪资配置 ${id} 不存在`);
    }

    return mapToSalaryConfig(row);
  }

  async remove(id: string): Promise<void> {
    const [row] = await this.db
      .delete(salaryConfig)
      .where(eq(salaryConfig.id, id))
      .returning({ id: salaryConfig.id });

    if (!row) {
      throw new NotFoundException(`薪资配置 ${id} 不存在`);
    }
  }

  /**
   * 把当前生效的薪资区间序列化成可注入 persona 末尾的字符串。
   * 给 chat.service 在生成 persona 时调用。
   * 没有数据时返回空串（不阻塞 persona 生成）。
   */
  async buildPersonaReference(): Promise<string> {
    // await 而不是 void：保证 list() 之前表已建好，避免并发首次请求时 list() 命中 42P01
    await this.schemaMigration.ensureSalaryConfigTableAndSeed();
    const all = await this.list();
    if (all.length === 0) return '';

    // 按 serviceType 分组
    const byService = new Map<string, SalaryConfig[]>();
    for (const cfg of all) {
      if (!byService.has(cfg.serviceType)) byService.set(cfg.serviceType, []);
      byService.get(cfg.serviceType)!.push(cfg);
    }

    // 服务类型显示名（"住家保姆" → "住家保姆"；"钟点工" → "钟点工保姆"，与 persona 一致）
    const serviceDisplay = (s: string) =>
      s.endsWith('保姆') ? s : `${s}保姆`;

    // 把"城市 + 户型 + subDimension"拼成可读标签
    const dimensionLabel = (cfg: SalaryConfig): string => {
      const parts: string[] = [cfg.cityTier];
      if (cfg.areaType && cfg.areaType !== '不适用') parts.push(cfg.areaType);
      if (cfg.subDimension) parts.push(cfg.subDimension);
      return parts.join(' + ');
    };

    // 一条区间文本：主线区间 + 可选的备选区间
    const rangeLine = (cfg: SalaryConfig): string => {
      const main = `市场价 ${cfg.baseLow}-${cfg.baseHigh} 元/月`;
      const hasAlt = cfg.altLow > 0 || cfg.altHigh > 0;
      const alt = hasAlt
        ? `；客户对阿姨要求不高时可尝试 ${cfg.altLow}-${cfg.altHigh} 元/月`
        : '';
      return `- ${dimensionLabel(cfg)}：${main}${alt}`;
    };

    const blocks: string[] = [];
    for (const [serviceType, items] of byService) {
      const lines: string[] = [`【${serviceDisplay(serviceType)}市场薪资区间（业务维护，可能更新）】`];
      for (const it of items) lines.push(rangeLine(it));
      blocks.push(lines.join('\n'));
    }

    return (
      '\n\n【市场薪资参考（来自业务配置表）】\n' +
      '当客户在【一线/二线/三线 + 户型 + 工作制（钟点工/白班/育儿/护工/菲式）】等组合下询问【市场价/多少钱/薪资/月薪】时，' +
      '按下面的业务维护的区间回答；如果客户对阿姨要求不高且该条配置有备选区间，用备选区间。\n' +
      '如果表中没有客户对应的城市/户型/工作制组合，转人工让业务确认。\n\n' +
      blocks.join('\n\n')
    );
  }
}
