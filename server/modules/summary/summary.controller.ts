import { Controller, Post, Param, Query, Req } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { SummaryService } from './summary.service';
import type { ConversationSummaryResponse } from '@shared/api.interface';

@Controller('api/chat')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @NeedLogin()
  @Post('sessions/:sessionId/summary')
  async generateSummary(
    @Req() req: Request,
    @Param('sessionId') sessionId: string,
    @Query('all') all?: string,
  ): Promise<ConversationSummaryResponse> {
    const userId = (req as unknown as { userContext?: { userId?: string } }).userContext?.userId ?? '';
    return this.summaryService.generateSummary(sessionId, userId, all === 'true');
  }
}
