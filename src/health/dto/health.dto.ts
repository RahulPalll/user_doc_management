import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 3600 })
  uptime: number;

  @ApiProperty({ example: 'production' })
  environment: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;
}
