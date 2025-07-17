import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { DocumentStatus } from '../../common/enums';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Document title' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Document description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Document status', enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ 
    description: 'Document tags', 
    type: [String],
    example: ['tag1', 'tag2'],
    isArray: true
  })
  @IsOptional()
  @Transform(({ value }) => {
    console.log('CreateDocumentDto Transform input value:', value, 'Type:', typeof value);
    
    // If value is undefined or null, return empty array
    if (value === undefined || value === null) {
      return [];
    }
    
    // If value is empty string, return empty array
    if (value === '') {
      return [];
    }
    
    // If value is a string, convert to array
    if (typeof value === 'string') {
      return value.trim() === '' ? [] : [value.trim()];
    }
    
    // If value is already an array, filter out empty strings
    if (Array.isArray(value)) {
      return value.filter(tag => tag && typeof tag === 'string' && tag.trim() !== '');
    }
    
    // For any other type, return empty array
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Document metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: 'Document title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Document description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Document status', enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ 
    description: 'Document tags', 
    type: [String],
    example: ['tag1', 'tag2'],
    isArray: true
  })
  @IsOptional()
  @Transform(({ value }) => {
    console.log('UpdateDocumentDto Transform input value:', value, 'Type:', typeof value);
    
    // If value is undefined or null, return empty array
    if (value === undefined || value === null) {
      return [];
    }
    
    // If value is empty string, return empty array
    if (value === '') {
      return [];
    }
    
    // If value is a string, convert to array
    if (typeof value === 'string') {
      return value.trim() === '' ? [] : [value.trim()];
    }
    
    // If value is already an array, filter out empty strings
    if (Array.isArray(value)) {
      return value.filter(tag => tag && typeof tag === 'string' && tag.trim() !== '');
    }
    
    // For any other type, return empty array
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Document metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
