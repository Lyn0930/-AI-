import { Module } from '@nestjs/common';
import { SchemaMigrationService } from './schema-migration.service';

@Module({
  providers: [SchemaMigrationService],
  exports: [SchemaMigrationService],
})
export class SchemaMigrationModule {}
