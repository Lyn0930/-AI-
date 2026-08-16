import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 飞书多维表格表单提交 DTO
 * 字段名与 bitable 表单字段一致（中文）
 */
export class BitableFormLeadDto {
  @IsString()
  @IsNotEmpty()
  '电话'!: string;

  @IsString()
  @IsOptional()
  '客户姓名'?: string;

  @IsString()
  @IsOptional()
  '城市'?: string;

  @IsString()
  @IsOptional()
  '来源'?: string;

  @IsString()
  @IsOptional()
  '服务类型'?: string;

  @IsString()
  @IsOptional()
  '家庭人口'?: string;

  @IsString()
  @IsOptional()
  '面积'?: string;

  @IsString()
  @IsOptional()
  '预算'?: string;
}
