import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngestionService } from './ingestion.service';
import { IngestionProcess, User } from '../database/entities';
import {
  IngestionStatus,
  IngestionType,
  UserRole,
  UserStatus,
} from '../common/enums';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PaginationDto } from '../common/dto';

describe('IngestionService', () => {
  let service: IngestionService;
  let ingestionRepository: Repository<IngestionProcess>;

  const mockUser = {
    id: 'user1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.VIEWER,
    status: UserStatus.ACTIVE,
    lastLoginAt: null as Date | null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    documents: [],
    ingestionProcesses: [],
    get fullName() {
      return `${this.firstName} ${this.lastName}`;
    },
  };

  const mockIngestion = {
    id: '1',
    type: IngestionType.DOCUMENT_UPLOAD,
    status: IngestionStatus.PENDING,
    parameters: { batchSize: 100 } as Record<string, any> | null,
    result: null as Record<string, any> | null,
    errorMessage: null as string | null,
    totalItems: 100,
    processedItems: 0,
    failedItems: 0,
    startedAt: null as Date | null,
    completedAt: null as Date | null,
    initiatedBy: mockUser,
    initiatedById: 'user1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    get progress() {
      if (this.totalItems === 0) return 0;
      return Math.round((this.processedItems / this.totalItems) * 100);
    },
    get duration() {
      if (!this.startedAt) return null;
      const endTime = this.completedAt || new Date();
      return Math.round((endTime.getTime() - this.startedAt.getTime()) / 1000);
    },
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
    getCount: jest.fn(),
    clone: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: getRepositoryToken(IngestionProcess),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    ingestionRepository = module.get<Repository<IngestionProcess>>(
      getRepositoryToken(IngestionProcess),
    );

    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createIngestionDto = {
      type: IngestionType.DOCUMENT_UPLOAD,
      parameters: { batchSize: 100 },
      totalItems: 100,
    };

    it('should create ingestion process successfully', async () => {
      mockRepository.create.mockReturnValue(mockIngestion);
      mockRepository.save.mockResolvedValue(mockIngestion);

      const result = await service.create(createIngestionDto, 'user1');

      expect(result).toEqual(mockIngestion);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createIngestionDto,
        initiatedById: 'user1',
        status: IngestionStatus.PENDING,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated ingestion processes for admin', async () => {
      const paginationDto = new PaginationDto();
      paginationDto.page = 1;
      paginationDto.limit = 10;
      paginationDto.sortBy = 'createdAt';
      paginationDto.sortOrder = 'DESC';
      const mockIngestions = [mockIngestion];
      const total = 1;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        mockIngestions,
        total,
      ]);

      const result = await service.findAll(
        paginationDto,
        'user1',
        UserRole.ADMIN,
      );

      expect(result).toEqual({
        data: mockIngestions,
        total,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter ingestion processes for non-admin users', async () => {
      const paginationDto = new PaginationDto();
      paginationDto.page = 1;
      paginationDto.limit = 10;
      const mockIngestions = [mockIngestion];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockIngestions, 1]);

      await service.findAll(paginationDto, 'user1', UserRole.VIEWER);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ingestion.initiatedById = :userId',
        { userId: 'user1' },
      );
    });
  });

  describe('findOne', () => {
    it('should return ingestion process when found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockIngestion);

      const result = await service.findOne('1', 'user1', UserRole.ADMIN);

      expect(result).toEqual(mockIngestion);
    });

    it('should throw NotFoundException when ingestion process not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.findOne('1', 'user1', UserRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('startProcess', () => {
    it('should start ingestion process successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockIngestion);
      jest
        .spyOn(service as any, 'processIngestion')
        .mockImplementation(() => {});
      const updatedIngestion = {
        ...mockIngestion,
        status: IngestionStatus.PROCESSING,
        startedAt: new Date(),
      };
      mockRepository.save.mockResolvedValue(updatedIngestion);

      const result = await service.startProcess('1', 'user1', UserRole.ADMIN);

      expect(result.status).toEqual(IngestionStatus.PROCESSING);
      expect(result.startedAt).toBeDefined();
    });

    it('should throw BadRequestException when process is not pending', async () => {
      const processingIngestion = {
        ...mockIngestion,
        status: IngestionStatus.PROCESSING,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(processingIngestion);

      await expect(
        service.startProcess('1', 'user1', UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when user is not owner and not admin', async () => {
      const otherUserIngestion = {
        ...mockIngestion,
        initiatedById: 'user1',
        status: IngestionStatus.PENDING,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(otherUserIngestion);

      await expect(
        service.startProcess('1', 'user2', UserRole.VIEWER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('completeProcess', () => {
    it('should complete ingestion process successfully', async () => {
      const processingIngestion = {
        ...mockIngestion,
        status: IngestionStatus.PROCESSING,
      };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(processingIngestion);
      const result = { success: true, message: 'Completed' };
      const completedIngestion = {
        ...processingIngestion,
        status: IngestionStatus.COMPLETED,
        completedAt: new Date(),
        result,
      };
      mockRepository.save.mockResolvedValue(completedIngestion);

      const response = await service.completeProcess(
        '1',
        result,
        'user1',
        UserRole.ADMIN,
      );

      expect(response.status).toEqual(IngestionStatus.COMPLETED);
      expect(response.result).toEqual(result);
    });

    it('should throw BadRequestException when process is not processing', async () => {
      // Create a fresh mock with PENDING status
      const pendingIngestion = {
        ...mockIngestion,
        status: IngestionStatus.PENDING,
      };
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(pendingIngestion);

      await expect(
        service.completeProcess('1', {}, 'user1', UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('failProcess', () => {
    it('should fail ingestion process successfully', async () => {
      const processingIngestion = {
        ...mockIngestion,
        status: IngestionStatus.PROCESSING,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(processingIngestion);
      const errorMessage = 'Process failed';
      const failedIngestion = {
        ...processingIngestion,
        status: IngestionStatus.FAILED,
        completedAt: new Date(),
        errorMessage,
      };
      mockRepository.save.mockResolvedValue(failedIngestion);

      const result = await service.failProcess(
        '1',
        errorMessage,
        'user1',
        UserRole.ADMIN,
      );

      expect(result.status).toEqual(IngestionStatus.FAILED);
      expect(result.errorMessage).toEqual(errorMessage);
    });
  });

  describe('remove', () => {
    it('should remove ingestion process successfully when user is owner', async () => {
      const completedIngestion = {
        ...mockIngestion,
        status: IngestionStatus.COMPLETED,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(completedIngestion);
      mockRepository.remove.mockResolvedValue(completedIngestion);

      await service.remove('1', 'user1', UserRole.VIEWER);

      expect(mockRepository.remove).toHaveBeenCalledWith(completedIngestion);
    });

    it('should throw ForbiddenException when user is not owner and not admin', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockIngestion);

      await expect(
        service.remove('1', 'user2', UserRole.VIEWER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when trying to delete running process', async () => {
      const processingIngestion = {
        ...mockIngestion,
        status: IngestionStatus.PROCESSING,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(processingIngestion);

      await expect(
        service.remove('1', 'user1', UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStats', () => {
    it('should return ingestion statistics', async () => {
      mockQueryBuilder.getCount
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(20) // pending
        .mockResolvedValueOnce(10) // processing
        .mockResolvedValueOnce(60) // completed
        .mockResolvedValueOnce(10); // failed

      mockQueryBuilder.getRawMany.mockResolvedValue([
        { ingestion_type: IngestionType.DOCUMENT_UPLOAD, count: '80' },
        { ingestion_type: IngestionType.BATCH_IMPORT, count: '20' },
      ]);

      mockQueryBuilder.getRawOne.mockResolvedValue({ avgDuration: '120.5' });

      const result = await service.getStats('user1', UserRole.VIEWER);

      expect(result).toEqual({
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
      });
    });
  });
});
