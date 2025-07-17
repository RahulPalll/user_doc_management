import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  const mockHealthService = {
    getHealthStatus: jest.fn(),
    getDetailedHealthStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should return basic health status', async () => {
      const mockHealth = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 1000,
      };

      mockHealthService.getHealthStatus.mockResolvedValue(mockHealth);

      const result = await controller.check();

      expect(result).toEqual(mockHealth);
      expect(service.getHealthStatus).toHaveBeenCalled();
    });
  });

  describe('detailedCheck', () => {
    it('should return detailed health status', async () => {
      const mockDetailedHealth = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 1000,
        version: '1.0.0',
        database: {
          status: 'ok',
          responseTime: 50,
        },
        memory: {
          used: 100000000,
          free: 200000000,
          total: 300000000,
        },
        disk: {
          used: 1000000000,
          free: 2000000000,
          total: 3000000000,
        },
      };

      mockHealthService.getDetailedHealthStatus.mockResolvedValue(
        mockDetailedHealth,
      );

      const result = await controller.detailedCheck();

      expect(result).toEqual(mockDetailedHealth);
      expect(service.getDetailedHealthStatus).toHaveBeenCalled();
    });
  });
});
