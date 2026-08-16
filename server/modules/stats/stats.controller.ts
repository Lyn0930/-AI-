import { Controller, Get, Query, Res } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Response } from 'express';
import { StatsService } from './stats.service';

@Controller('api/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @NeedLogin()
  @Get('team-performance')
  async getTeamPerformance() {
    return this.statsService.getTeamPerformance();
  }

  @NeedLogin()
  @Get('lead-funnel')
  async getLeadFunnel() {
    return this.statsService.getLeadFunnel();
  }

  @NeedLogin()
  @Get('timeline')
  async getTimeline(@Query('days') days?: string) {
    const daysInt = days ? parseInt(days, 10) || 30 : 30;
    return this.statsService.getTimeline(daysInt);
  }

  @NeedLogin()
  @Get('source-effectiveness')
  async getSourceEffectiveness() {
    return this.statsService.getSourceEffectiveness();
  }

  @NeedLogin()
  @Get('system-health')
  async getSystemHealth() {
    return this.statsService.getSystemHealth();
  }

  @NeedLogin()
  @Get('grade-funnel')
  async getGradeFunnel() {
    return this.statsService.getGradeFunnel();
  }

  @NeedLogin()
  @Get('ai-effectiveness')
  async getAiEffectiveness() {
    return this.statsService.getAiEffectiveness();
  }

  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    const metrics = await this.statsService.getPrometheusMetrics();
    res.type('text/plain').send(metrics);
  }
}
