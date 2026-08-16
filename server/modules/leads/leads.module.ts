import { Module, forwardRef } from '@nestjs/common';
import {
  CaptchaController,
  LeadsController,
  LeadsOpenApiController,
  PublicLeadsController,
} from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadGradingService } from './lead-grading.service';
import { NotifyModule } from '../notify/notify.module';
import { RoutingModule } from '../routing/routing.module';
import { BitableSyncModule } from '../bitable-sync/bitable-sync.module';
import { SmsModule } from '../sms/sms.module';
import { AdminModule } from '../admin/admin.module';
import { SchemaMigrationModule } from '../migration/schema-migration.module';

@Module({
  imports: [
    NotifyModule,
    forwardRef(() => RoutingModule),
    BitableSyncModule,
    SmsModule,
    AdminModule,
    SchemaMigrationModule,
  ],
  controllers: [CaptchaController, LeadsController, LeadsOpenApiController, PublicLeadsController],
  providers: [LeadsService, LeadGradingService],
  exports: [LeadsService, LeadGradingService],
})
export class LeadsModule {}
