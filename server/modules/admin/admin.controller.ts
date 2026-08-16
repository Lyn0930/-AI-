import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { AdminService } from './admin.service';
import { AiConfigService } from './ai-config.service';
import { CreateQAEntryDto } from './dto/qa-entry.dto';
import { UpdateQAEntryDto } from './dto/qa-entry.dto';
import { UpdateAIConfigDto } from './dto/ai-config.dto';
import type { TestChatRequest } from '@shared/api.interface';

@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly aiConfigService: AiConfigService,
  ) {}

  // ============ QA 知识库 ============

  @NeedLogin()
  @Get('qa')
  async listQa(@Query('category') category?: string) {
    return this.adminService.listQa(category);
  }

  @NeedLogin()
  @Post('qa')
  async createQa(@Body() dto: CreateQAEntryDto) {
    return this.adminService.createQa(dto);
  }

  @NeedLogin()
  @Put('qa/:id')
  async updateQa(@Param('id') id: string, @Body() dto: UpdateQAEntryDto) {
    return this.adminService.updateQa(id, dto);
  }

  @NeedLogin()
  @Delete('qa/:id')
  async deleteQa(@Param('id') id: string) {
    await this.adminService.deleteQa(id);
    return { success: true };
  }

  // ============ AI 配置 ============

  @NeedLogin()
  @Get('ai-config')
  async getAiConfig() {
    return this.aiConfigService.getAllConfigs();
  }

  @NeedLogin()
  @Put('ai-config')
  async updateAiConfig(@Body() dto: UpdateAIConfigDto) {
    await this.aiConfigService.updateConfigs(dto.configs);
    return { success: true };
  }

  // ============ 测试客服 ============

  @NeedLogin()
  @Post('test-chat')
  async testChat(@Body() dto: TestChatRequest) {
    return this.adminService.testChat(dto);
  }
}
