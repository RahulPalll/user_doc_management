import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentStatus, UserRole, UserStatus } from '../common/enums';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { PaginationDto } from '../common/dto';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: DocumentsService;

  const mockUser = {
    id: 'user1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.VIEWER,
    status: UserStatus.ACTIVE,
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
    metadata: { pages: 10 },
    content: 'Extracted text',
    tags: ['test'],
    createdBy: mockUser,
    createdById: 'user1',
    updatedBy: null,
    updatedById: null,
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

  const mockDocumentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStats: jest.fn(),
    downloadFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get<DocumentsService>(DocumentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a document', async () => {
      const createDocumentDto: CreateDocumentDto = {
        title: 'Test Document',
        description: 'Test description',
        status: DocumentStatus.DRAFT,
      };

      mockDocumentsService.create.mockResolvedValue(mockDocument);

      const result = await controller.create(
        createDocumentDto,
        mockFile,
        'user1',
      );

      expect(result).toEqual(mockDocument);
      expect(service.create).toHaveBeenCalledWith(
        createDocumentDto,
        mockFile,
        'user1',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated documents', async () => {
      const paginationDto = new PaginationDto();
      paginationDto.page = 1;
      paginationDto.limit = 10;
      const mockResult = {
        data: [mockDocument],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockDocumentsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        paginationDto,
        'user1',
        UserRole.VIEWER,
        'search',
      );

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(
        paginationDto,
        'user1',
        UserRole.VIEWER,
        'search',
        undefined,
      );
    });
  });

  describe('findOne', () => {
    it('should return a document', async () => {
      mockDocumentsService.findOne.mockResolvedValue(mockDocument);

      const result = await controller.findOne('1', 'user1', UserRole.VIEWER);

      expect(result).toEqual(mockDocument);
      expect(service.findOne).toHaveBeenCalledWith(
        '1',
        'user1',
        UserRole.VIEWER,
      );
    });
  });

  describe('update', () => {
    it('should update a document', async () => {
      const updateDocumentDto: UpdateDocumentDto = { title: 'Updated Title' };
      const updatedDocument = { ...mockDocument, title: 'Updated Title' };

      mockDocumentsService.update.mockResolvedValue(updatedDocument);

      const result = await controller.update(
        '1',
        updateDocumentDto,
        'user1',
        UserRole.EDITOR,
      );

      expect(result).toEqual(updatedDocument);
      expect(service.update).toHaveBeenCalledWith(
        '1',
        updateDocumentDto,
        'user1',
        UserRole.EDITOR,
      );
    });
  });

  describe('remove', () => {
    it('should remove a document', async () => {
      mockDocumentsService.remove.mockResolvedValue(undefined);

      await controller.remove('1', 'user1', UserRole.ADMIN);

      expect(service.remove).toHaveBeenCalledWith('1', 'user1', UserRole.ADMIN);
    });
  });

  describe('getStats', () => {
    it('should return document statistics', async () => {
      const mockStats = {
        total: 100,
        draft: 30,
        published: 60,
        archived: 10,
        totalSize: 1024000,
        averageSize: 10240,
      };

      mockDocumentsService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats('user1', UserRole.ADMIN);

      expect(result).toEqual(mockStats);
      expect(service.getStats).toHaveBeenCalledWith('user1', UserRole.ADMIN);
    });
  });
});
