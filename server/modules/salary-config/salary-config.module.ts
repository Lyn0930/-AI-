import { Module } from '@nestjs/common';
import { SalaryConfigController } from './salary-config.controller';
import { SalaryConfigService } from './salary-config.service';
import { SchemaMigrationModule } from '../migration/schema-migration.module';

@Module({
  imports: [SchemaMigrationModule],
  controllers: [SalaryConfigController],
  providers: [SalaryConfigService],
  exports: [SalaryConfigService],
})
export class SalaryConfigModule {}
