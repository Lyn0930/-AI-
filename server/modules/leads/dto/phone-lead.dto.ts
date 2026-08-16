import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 电话转线索 DTO（内部接口，需登录态）
 */
export class PhoneLeadDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  serviceCity?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  serviceType?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
