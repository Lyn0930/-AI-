import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';
import { aiConfigs, qaEntries } from '@server/database/schema';
import type { AIConfigItem } from '@shared/api.interface';

const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class AiConfigService {
  private readonly logger = new Logger(AiConfigService.name);
  private cache = new Map<string, { value: string; expiresAt: number }>();
  private qaCache: { value: string; expiresAt: number } | null = null;

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getConfig(key: string): Promise<string | null> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const rows = await this.db
      .select({ value: aiConfigs.configValue })
      .from(aiConfigs)
      .where(eq(aiConfigs.configKey, key))
      .limit(1);

    if (rows.length === 0) return null;

    const value = rows[0].value;
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  async getConfigWithDefault(key: string, defaultValue: string): Promise<string> {
    const value = await this.getConfig(key);
    return value ?? defaultValue;
  }

  async getConfigNumber(key: string, defaultValue: number): Promise<number> {
    const value = await this.getConfig(key);
    if (value === null) return defaultValue;
    const num = parseInt(value, 10);
    return Number.isNaN(num) ? defaultValue : num;
  }

  async getAllConfigs(): Promise<AIConfigItem[]> {
    const rows = await this.db
      .select({
        key: aiConfigs.configKey,
        value: aiConfigs.configValue,
        type: aiConfigs.configType,
        description: aiConfigs.description,
        updatedAt: aiConfigs.updatedAt,
      })
      .from(aiConfigs)
      .orderBy(aiConfigs.configKey);

    return rows.map((row) => ({
      key: row.key,
      value: row.value,
      type: row.type as 'text' | 'number' | 'json',
      description: row.description ?? '',
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async updateConfigs(items: { key: string; value: string }[]): Promise<void> {
    for (const item of items) {
      const existing = await this.db
        .select({ id: aiConfigs.id })
        .from(aiConfigs)
        .where(eq(aiConfigs.configKey, item.key))
        .limit(1);

      if (existing.length > 0) {
        await this.db
          .update(aiConfigs)
          .set({ configValue: item.value })
          .where(eq(aiConfigs.id, existing[0].id));
      } else {
        await this.db.insert(aiConfigs).values({
          configKey: item.key,
          configValue: item.value,
          configType: 'text',
        });
      }
    }

    this.cache.clear();
    this.qaCache = null;
  }

  async getQaContext(): Promise<string> {
    if (this.qaCache && this.qaCache.expiresAt > Date.now()) {
      return this.qaCache.value;
    }

    const rows = await this.db
      .select({
        question: qaEntries.question,
        answer: qaEntries.answer,
      })
      .from(qaEntries)
      .where(eq(qaEntries.enabled, true))
      .orderBy(qaEntries.sortOrder);

    if (rows.length === 0) {
      this.qaCache = { value: '', expiresAt: Date.now() + CACHE_TTL_MS };
      return '';
    }

    const qaText = rows
      .map((r) => `Q: ${r.question}\nA: ${r.answer}`)
      .join('\n\n');

    const context = `\n\n=== 常见问题参考 ===\n${qaText}`;
    this.qaCache = { value: context, expiresAt: Date.now() + CACHE_TTL_MS };
    return context;
  }

  async getPersonaWithQa(defaultPersona: string): Promise<string> {
    const persona = await this.getConfigWithDefault('swan_persona', defaultPersona);
    const qaContext = await this.getQaContext();
    return persona + qaContext;
  }

  async getTransferKeywords(defaultKeywords: string[]): Promise<string[]> {
    const value = await this.getConfig('transfer_keywords');
    if (!value) return defaultKeywords;
    try {
      const parsed = JSON.parse(value) as string[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultKeywords;
    } catch {
      return defaultKeywords;
    }
  }
}
