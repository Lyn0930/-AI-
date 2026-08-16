import { Module } from '@nestjs/common';
import { LeadsAutomationService } from './leads.automation';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [LeadsModule],
  providers: [LeadsAutomationService],
})
export class AutomationModule {}
