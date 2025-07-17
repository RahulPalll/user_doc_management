import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const mockDataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    dataSource = module.get(DataSource);

    // Mock environment variables
    process.env.NODE_ENV = 'test';
    process.env.npm_package_version = '1.0.0';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealthStatus', () => {
    it('should return basic health status', async () => {
      const result = await service.getHealthStatus();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: 'test',
        version: '1.0.0',
      });
    });
  });

  describe('getDetailedHealthStatus', () => {
    it('should return detailed health status with healthy database', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getDetailedHealthStatus();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: 'test',
        version: '1.0.0',
        checks: {
          database: {
            status: 'healthy',
            connection: 'active',
          },
        },
      });
    });

    it('should return detailed health status with unhealthy database', async () => {
      const dbError = new Error('Database connection failed');
      dataSource.query.mockRejectedValue(dbError);

      const result = await service.getDetailedHealthStatus();

      expect(result.checks.database.status).toBe('unhealthy');
      expect(result.checks.database.error).toBe('Database connection failed');
    });
  });

  describe('checkDatabase', () => {
    it('should return healthy status when database query succeeds', async () => {
      dataSource.query.mockResolvedValue([{ '?column?': 1 }]);

      // Access private method for testing
      const result = await (service as any).checkDatabase();

      expect(result).toEqual({
        status: 'healthy',
        connection: 'active',
      });
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return unhealthy status when database query fails', async () => {
      const dbError = new Error('Connection timeout');
      dataSource.query.mockRejectedValue(dbError);

      const result = await (service as any).checkDatabase();

      expect(result).toEqual({
        status: 'unhealthy',
        error: 'Connection timeout',
      });
    });
  });
});
