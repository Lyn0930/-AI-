import {
  IsString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateSalaryConfigDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  baseLow?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseHigh?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  altLow?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  altHigh?: number;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
