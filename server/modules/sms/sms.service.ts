import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { ConnectionsService } from '@lark-apaas/miaoda-connections-sdk';
import { eq, desc, and } from 'drizzle-orm';
import * as Dysmsapi from '@alicloud/dysmsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';
import { smsCodes } from '@server/database/schema';
import type { SmsSendResponse } from '@shared/api.interface';

const CODE_EXPIRY_MINUTES = 5;
const CODE_RESEND_COOLDOWN_MS = 60_000;
const CONNECTION_NAME = 'aliyun_sms';

interface AliyunSmsConfig {
  accessKeyId: string;
  accessKeySecret: string;
  signName: string;
  templateCode: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly connections: ConnectionsService,
  ) {}

  async sendCode(phoneNumber: string): Promise<SmsSendResponse> {
    const lastCode = await this.db
      .select()
      .from(smsCodes)
      .where(eq(smsCodes.phoneNumber, phoneNumber))
      .orderBy(desc(smsCodes.createdAt))
      .limit(1);

    if (lastCode.length > 0) {
      const elapsed = Date.now() - lastCode[0].createdAt.getTime();
      if (elapsed < CODE_RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((CODE_RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new BadRequestException(`请${waitSec}秒后再试`);
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60_000);

    await this.db.insert(smsCodes).values({
      phoneNumber,
      code,
      expiresAt,
      used: false,
    });

    const config = await this.getAliyunConfig();

    if (!config) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('短信服务未配置，请在妙搭开发态配置 aliyun_sms 凭证');
        throw new BadRequestException('短信服务暂不可用');
      }
      this.logger.log(`[DEV] 验证码: ${code} (手机号: ${phoneNumber})`);
      return { success: true, devCode: code };
    }

    try {
      await this.sendAliyunSms(phoneNumber, code, config);
      this.logger.log(`验证码已发送: ${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-4)}`);
      return { success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`短信发送失败: ${msg}`);
      throw new BadRequestException('短信发送失败，请稍后重试');
    }
  }

  async verifyCode(phoneNumber: string, code: string): Promise<void> {
    const rows = await this.db
      .select()
      .from(smsCodes)
      .where(and(eq(smsCodes.phoneNumber, phoneNumber), eq(smsCodes.used, false)))
      .orderBy(desc(smsCodes.createdAt))
      .limit(1);

    if (rows.length === 0) {
      throw new BadRequestException('验证码不存在或已使用，请重新获取');
    }

    const record = rows[0];

    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('验证码已过期，请重新获取');
    }

    if (record.code !== code) {
      throw new BadRequestException('验证码错误');
    }

    await this.db
      .update(smsCodes)
      .set({ used: true })
      .where(eq(smsCodes.id, record.id));
  }

  private async getAliyunConfig(): Promise<AliyunSmsConfig | null> {
    try {
      const connection = await this.connections.getConnection({
        connectionName: CONNECTION_NAME,
      });

      if (connection.state !== 'connected') {
        return null;
      }

      if (connection.value.type !== 'custom') {
        this.logger.warn(`凭证类型 ${connection.value.type} 不支持，需要 custom 类型`);
        return null;
      }

      const authData = connection.value.authData as Record<string, unknown>;
      const accessKeyId = authData.accessKeyId as string;
      const accessKeySecret = authData.accessKeySecret as string;
      const signName = authData.signName as string;
      const templateCode = authData.templateCode as string;

      if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
        this.logger.warn('凭证缺少必要字段: accessKeyId/accessKeySecret/signName/templateCode');
        return null;
      }

      return { accessKeyId, accessKeySecret, signName, templateCode };
    } catch {
      return null;
    }
  }

  private async sendAliyunSms(
    phoneNumber: string,
    code: string,
    config: AliyunSmsConfig,
  ): Promise<void> {
    const apiConfig = new OpenApi.Config({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
    });
    apiConfig.endpoint = 'dysmsapi.aliyuncs.com';

    const client = new Dysmsapi.default(apiConfig);
    const request = new Dysmsapi.SendSmsRequest({
      phoneNumbers: phoneNumber,
      signName: config.signName,
      templateCode: config.templateCode,
      templateParam: JSON.stringify({ code }),
    });

    const resp = await client.sendSms(request);
    const body = resp.body;

    if (body.code !== 'OK') {
      throw new Error(`Aliyun SMS error: ${body.code} - ${body.message}`);
    }
  }
}
