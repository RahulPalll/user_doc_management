import { IsEnum, IsOptional, IsObject, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IngestionType } from '../../common/enums';

export class CreateIngestionDto {
  @ApiProperty({
    description: 'Type of ingestion process',
    enum: IngestionType,
  })
  @IsEnum(IngestionType)
  type: IngestionType;

  @ApiPropertyOptional({ description: 'Parameters for the ingestion process' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Total number of items to process',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalItems?: number;
}

export class UpdateIngestionDto {
  @ApiPropertyOptional({ description: 'Parameters for the ingestion process' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Result of the ingestion process' })
  @IsOptional()
  @IsObject()
  result?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Number of processed items', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  processedItems?: number;

  @ApiPropertyOptional({ description: 'Number of failed items', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  failedItems?: number;
}
