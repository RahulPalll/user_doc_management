import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Document, User } from '../database/entities';
import { DocumentStatus, UserRole, UserStatus } from '../common/enums';
import { PaginationDto } from '../common/dto/pagination.dto';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentRepository: Repository<Document>;

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

  const mockDocument = {
    id: '1',
    title: 'Test Document',
    description: 'Test description',
    filename: 'test-file.pdf',
    originalName: 'original.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    filePath: '/uploads/test-file.pdf',
    status: DocumentStatus.DRAFT,
    metadata: { pages: 10, author: 'Test Author' },
    content: 'Extracted text content',
    tags: ['test', 'document'],
    createdBy: mockUser,
    createdById: 'user1',
    updatedBy: null as User | null,
    updatedById: null as string | null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    get sizeInMB() {
      return Math.round((Number(this.size) / 1024 / 1024) * 100) / 100;
    },
  };

  const mockFile = {
    filename: 'test-file.pdf',
    originalname: 'original.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    path: '/uploads/test-file.pdf',
  } as Express.Multer.File;

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
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    documentRepository = module.get<Repository<Document>>(
      getRepositoryToken(Document),
    );

    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDocumentDto = {
      title: 'Test Document',
      description: 'Test description',
      status: DocumentStatus.DRAFT,
    };

    it('should create a document successfully', async () => {
      mockRepository.create.mockReturnValue(mockDocument);
      mockRepository.save.mockResolvedValue(mockDocument);

      const result = await service.create(createDocumentDto, mockFile, 'user1');

      expect(result).toEqual(mockDocument);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDocumentDto,
        filename: mockFile.filename,
        originalName: mockFile.originalname,
        mimetype: mockFile.mimetype,
        size: mockFile.size,
        filePath: mockFile.path,
        createdById: 'user1',
        status: DocumentStatus.DRAFT,
      });
    });

    it('should throw BadRequestException when no file is provided', async () => {
      await expect(
        service.create(createDocumentDto, undefined as any, 'user1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unsupported file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'image/jpeg' };

      await expect(
        service.create(
          createDocumentDto,
          invalidFile as Express.Multer.File,
          'user1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for file too large', async () => {
      const largeFile = { ...mockFile, size: 11 * 1024 * 1024 }; // 11MB

      await expect(
        service.create(
          createDocumentDto,
          largeFile as Express.Multer.File,
          'user1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated documents for admin', async () => {
      const paginationDto = new PaginationDto();
      paginationDto.page = 1;
      paginationDto.limit = 10;
      paginationDto.sortBy = 'createdAt';
      paginationDto.sortOrder = 'DESC' as const;

      const mockDocuments = [mockDocument];
      const total = 1;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        mockDocuments,
        total,
      ]);

      const result = await service.findAll(
        paginationDto,
        'user1',
        UserRole.ADMIN,
      );

      expect(result).toEqual({
        data: mockDocuments,
        total,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter documents for non-admin users', async () => {
      const paginationDto = new PaginationDto();
      paginationDto.page = 1;
      paginationDto.limit = 10;

      const mockDocuments = [mockDocument];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockDocuments, 1]);

      await service.findAll(paginationDto, 'user1', UserRole.VIEWER);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(document.createdById = :userId OR document.status = :publishedStatus)',
        { userId: 'user1', publishedStatus: DocumentStatus.PUBLISHED },
      );
    });
  });

  describe('findOne', () => {
    it('should return document when found and user has access', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockDocument);

      const result = await service.findOne('1', 'user1', UserRole.ADMIN);

      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundException when document not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.findOne('1', 'user1', UserRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDocumentDto = { title: 'Updated Title' };

    it('should update document successfully when user is owner', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument);
      const updatedDocument = {
        ...mockDocument,
        ...updateDocumentDto,
        updatedById: 'user1',
      };
      mockRepository.save.mockResolvedValue(updatedDocument);

      const result = await service.update(
        '1',
        updateDocumentDto,
        'user1',
        UserRole.VIEWER,
      );

      expect(result.title).toEqual(updateDocumentDto.title);
      expect(result.updatedById).toEqual('user1');
    });

    it('should throw ForbiddenException when user is not owner and not admin', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument);

      await expect(
        service.update('1', updateDocumentDto, 'user2', UserRole.VIEWER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when viewer tries to publish', async () => {
      const publishUpdate = { status: DocumentStatus.PUBLISHED };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument);

      await expect(
        service.update('1', publishUpdate, 'user1', UserRole.VIEWER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove document successfully when user is owner', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {});
      mockRepository.remove.mockResolvedValue(mockDocument);

      await service.remove('1', 'user1', UserRole.VIEWER);

      expect(mockFs.unlinkSync).toHaveBeenCalledWith(mockDocument.filePath);
      expect(mockRepository.remove).toHaveBeenCalledWith(mockDocument);
    });

    it('should throw ForbiddenException when user is not owner and not admin', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument);

      await expect(
        service.remove('1', 'user2', UserRole.VIEWER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('downloadFile', () => {
    it('should return file info when file exists', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument);
      mockFs.existsSync.mockReturnValue(true);

      const result = await service.downloadFile('1', 'user1', UserRole.VIEWER);

      expect(result).toEqual({
        path: mockDocument.filePath,
        filename: mockDocument.originalName,
        mimetype: mockDocument.mimetype,
      });
    });

    it('should throw NotFoundException when file does not exist on disk', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockDocument);
      mockFs.existsSync.mockReturnValue(false);

      await expect(
        service.downloadFile('1', 'user1', UserRole.VIEWER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return document statistics', async () => {
      mockQueryBuilder.getCount
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(30) // draft
        .mockResolvedValueOnce(60) // published
        .mockResolvedValueOnce(10); // archived

      mockQueryBuilder.getRawMany.mockResolvedValue([
        { document_mimetype: 'application/pdf', count: '50' },
        { document_mimetype: 'text/plain', count: '30' },
      ]);

      mockQueryBuilder.getRawOne.mockResolvedValue({ totalSize: '1048576' });

      const result = await service.getStats('user1', UserRole.VIEWER);

      expect(result).toEqual({
        total: 100,
        draft: 30,
        published: 60,
        archived: 10,
        byMimeType: {
          'application/pdf': 50,
          'text/plain': 30,
        },
        totalSize: 1048576,
      });
    });
  });
});
