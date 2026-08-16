import { Controller, Get, Post, Param } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { BitableSyncService } from './bitable-sync.service';
import type {
  BitableSyncStatus,
  BitableSyncResult,
  BitableSyncLeadItem,
} from '@shared/api.interface';

@Controller('api/bitable-sync')
export class BitableSyncController {
  constructor(private readonly bitableSyncService: BitableSyncService) {}

  @NeedLogin()
  @Get('status')
  async getSyncStatus(): Promise<BitableSyncStatus> {
    return this.bitableSyncService.getSyncStatus();
  }

  @NeedLogin()
  @Get('unsynced')
  async getUnsyncedLeads(): Promise<BitableSyncLeadItem[]> {
    return this.bitableSyncService.getUnsyncedLeads();
  }

  @NeedLogin()
  @Post('sync/:leadId')
  async syncLead(@Param('leadId') leadId: string): Promise<BitableSyncResult> {
    return this.bitableSyncService.syncLeadToBitable(leadId);
  }

  @NeedLogin()
  @Post('sync-all')
  async syncAll(): Promise<BitableSyncResult> {
    return this.bitableSyncService.syncAllUnsynced();
  }
}
