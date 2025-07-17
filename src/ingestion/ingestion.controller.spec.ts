import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { IngestionStatus, IngestionType, UserRole } from '../common/enums';
import { CreateIngestionDto, UpdateIngestionDto } from './dto';
import { PaginationDto } from '../common/dto';

describe('IngestionController', () => {
  let controller: IngestionController;
  let service: IngestionService;

  const mockIngestion = {
    id: '1',
    type: IngestionType.DOCUMENT_UPLOAD,
    status: IngestionStatus.PENDING,
    parameters: { batchSize: 100 },
    result: null,
    errorMessage: null,
    totalItems: 100,
    processedItems: 0,
    failedItems: 0,
    startedAt: null,
    completedAt: null,
    initiatedById: 'user1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    get progress() {
      return 0;
    },
    get duration() {
      return null;
    },
  };

  const mockIngestionService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    startProcess: jest.fn(),
    completeProcess: jest.fn(),
    failProcess: jest.fn(),
    remove: jest.fn(),
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        {
          provide: IngestionService,
          useValue: mockIngestionService,
        },
      ],
    }).compile();

    controller = module.get<IngestionController>(IngestionController);
    service = module.get<IngestionService>(IngestionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an ingestion process', async () => {
      const createIngestionDto: CreateIngestionDto = {
        type: IngestionType.DOCUMENT_UPLOAD,
        parameters: { batchSize: 100 },
        totalItems: 100,
      };

      mockIngestionService.create.mockResolvedValue(mockIngestion);

      const result = await controller.create(createIngestionDto, 'user1');

      expect(result).toEqual(mockIngestion);
      expect(service.create).toHaveBeenCalledWith(createIngestionDto, 'user1');
    });
  });

  describe('findAll', () => {
    it('should return paginated ingestion processes', async () => {
      const paginationDto = new PaginationDto();
      paginationDto.page = 1;
      paginationDto.limit = 10;
      const mockResult = {
        data: [mockIngestion],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockIngestionService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        paginationDto,
        'user1',
        UserRole.VIEWER,
      );

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(
        paginationDto,
        'user1',
        UserRole.VIEWER,
        undefined,
        undefined,
      );
    });
  });

  describe('findOne', () => {
    it('should return an ingestion process', async () => {
      mockIngestionService.findOne.mockResolvedValue(mockIngestion);

      const result = await controller.findOne('1', 'user1', UserRole.VIEWER);

      expect(result).toEqual(mockIngestion);
      expect(service.findOne).toHaveBeenCalledWith(
        '1',
        'user1',
        UserRole.VIEWER,
      );
    });
  });

  describe('update', () => {
    it('should update an ingestion process', async () => {
      const updateIngestionDto: UpdateIngestionDto = {
        parameters: { batchSize: 200 },
      };
      const updatedIngestion = {
        ...mockIngestion,
        parameters: { batchSize: 200 },
      };

      mockIngestionService.update.mockResolvedValue(updatedIngestion);

      const result = await controller.update(
        '1',
        updateIngestionDto,
        'user1',
        UserRole.EDITOR,
      );

      expect(result).toEqual(updatedIngestion);
      expect(service.update).toHaveBeenCalledWith(
        '1',
        updateIngestionDto,
        'user1',
        UserRole.EDITOR,
      );
    });
  });

  describe('startProcess', () => {
    it('should start an ingestion process', async () => {
      const startedIngestion = {
        ...mockIngestion,
        status: IngestionStatus.PROCESSING,
      };

      mockIngestionService.startProcess.mockResolvedValue(startedIngestion);

      const result = await controller.startProcess(
        '1',
        'user1',
        UserRole.ADMIN,
      );

      expect(result).toEqual(startedIngestion);
      expect(service.startProcess).toHaveBeenCalledWith(
        '1',
        'user1',
        UserRole.ADMIN,
      );
    });
  });

  describe('completeProcess', () => {
    it('should complete an ingestion process', async () => {
      const result = { success: true, message: 'Completed' };
      const completedIngestion = {
        ...mockIngestion,
        status: IngestionStatus.COMPLETED,
        result,
      };

      mockIngestionService.completeProcess.mockResolvedValue(
        completedIngestion,
      );

      const response = await controller.completeProcess(
        '1',
        result,
        'user1',
        UserRole.ADMIN,
      );

      expect(response).toEqual(completedIngestion);
      expect(service.completeProcess).toHaveBeenCalledWith(
        '1',
        result,
        'user1',
        UserRole.ADMIN,
      );
    });
  });

  describe('failProcess', () => {
    it('should fail an ingestion process', async () => {
      const errorMessage = 'Process failed';
      const failedIngestion = {
        ...mockIngestion,
        status: IngestionStatus.FAILED,
        errorMessage,
      };

      mockIngestionService.failProcess.mockResolvedValue(failedIngestion);

      const result = await controller.failProcess(
        '1',
        errorMessage,
        'user1',
        UserRole.ADMIN,
      );

      expect(result).toEqual(failedIngestion);
      expect(service.failProcess).toHaveBeenCalledWith(
        '1',
        errorMessage,
        'user1',
        UserRole.ADMIN,
      );
    });
  });

  describe('remove', () => {
    it('should remove an ingestion process', async () => {
      mockIngestionService.remove.mockResolvedValue(undefined);

      await controller.remove('1', 'user1', UserRole.ADMIN);

      expect(service.remove).toHaveBeenCalledWith('1', 'user1', UserRole.ADMIN);
    });
  });

  describe('getStats', () => {
    it('should return ingestion statistics', async () => {
      const mockStats = {
        total: 100,
        pending: 20,
        processing: 10,
        completed: 60,
        failed: 10,
        byType: {
          [IngestionType.DOCUMENT_UPLOAD]: 80,
          [IngestionType.BATCH_IMPORT]: 20,
        },
        averageDuration: 120.5,
      };

      mockIngestionService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats('user1', UserRole.ADMIN);

      expect(result).toEqual(mockStats);
      expect(service.getStats).toHaveBeenCalledWith('user1', UserRole.ADMIN);
    });
  });
});
