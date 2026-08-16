import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsString } from 'class-validator';

class ConfigItemDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;
}

export class UpdateAIConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigItemDto)
  configs!: ConfigItemDto[];
}
