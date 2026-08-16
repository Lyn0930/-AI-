import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { LeadsModule } from './modules/leads/leads.module';
import { ContactModule } from './modules/contact/contact.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotifyModule } from './modules/notify/notify.module';
import { AssignmentModule } from './modules/assignment/assignment.module';
import { AutomationModule } from './modules/automation/automation.module';
import { StatsModule } from './modules/stats/stats.module';
import { AdminModule } from './modules/admin/admin.module';
import { RoutingModule } from './modules/routing/routing.module';
import { SummaryModule } from './modules/summary/summary.module';
import { BitableSyncModule } from './modules/bitable-sync/bitable-sync.module';
import { SmsModule } from './modules/sms/sms.module';
import { WorkersModule } from './modules/workers/workers.module';
import { ViewModule } from './modules/view/view.module';
import { SchemaMigrationModule } from './modules/migration/schema-migration.module';
import { SalaryConfigModule } from './modules/salary-config/salary-config.module';

@Module({
  imports: [
    // 平台 Module，提供平台能力
    PlatformModule.forRoot(),
    // ====== @route-section: business-modules START ======
    LeadsModule,
    ContactModule,
    ChatModule,
    NotifyModule,
    AssignmentModule,
    AutomationModule,
    StatsModule,
    AdminModule,
    RoutingModule,
    SummaryModule,
    BitableSyncModule,
    SmsModule,
    WorkersModule,
    SchemaMigrationModule,
    SalaryConfigModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
