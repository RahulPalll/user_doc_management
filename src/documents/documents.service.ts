import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../database/entities';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { PaginationDto } from '../common/dto';
import { PaginationResult } from '../common/interfaces';
import { DocumentStatus, UserRole } from '../common/enums';
import * as fs from 'fs';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<Document> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not supported');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size too large. Maximum size is 10MB',
      );
    }

    const document = this.documentRepository.create({
      ...createDocumentDto,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      filePath: file.path,
      createdById: userId,
      status: createDocumentDto.status || DocumentStatus.DRAFT,
    });

    return this.documentRepository.save(document);
  }

  async findAll(
    paginationDto: PaginationDto,
    userId: string,
    userRole: UserRole,
    search?: string,
    status?: DocumentStatus,
  ): Promise<PaginationResult<Document>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.createdBy', 'createdBy');

    // Non-admin users can only see their own documents or published documents
    if (userRole !== UserRole.ADMIN) {
      queryBuilder.where(
        '(document.createdById = :userId OR document.status = :publishedStatus)',
        { userId, publishedStatus: DocumentStatus.PUBLISHED },
      );
    }

    if (search) {
      queryBuilder.andWhere(
        '(document.title ILIKE :search OR document.description ILIKE :search OR document.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('document.status = :status', { status });
    }

    const [documents, total] = await queryBuilder
      .orderBy(`document.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: documents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<Document> {
    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.createdBy', 'createdBy')
      .where('document.id = :id', { id });

    // Non-admin users can only see their own documents or published documents
    if (userRole !== UserRole.ADMIN) {
      queryBuilder.andWhere(
        '(document.createdById = :userId OR document.status = :publishedStatus)',
        { userId, publishedStatus: DocumentStatus.PUBLISHED },
      );
    }

    const document = await queryBuilder.getOne();

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Document> {
    const document = await this.findOne(id, userId, userRole);

    // Check permissions - only owner or admin can update
    if (document.createdById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own documents');
    }

    // Only editors and admins can publish documents
    if (
      updateDocumentDto.status === DocumentStatus.PUBLISHED &&
      userRole === UserRole.VIEWER
    ) {
      throw new ForbiddenException('Viewers cannot publish documents');
    }

    Object.assign(document, updateDocumentDto);
    document.updatedById = userId;

    return this.documentRepository.save(document);
  }

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const document = await this.findOne(id, userId, userRole);

    // Check permissions - only owner or admin can delete
    if (document.createdById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own documents');
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    await this.documentRepository.remove(document);
  }

  async downloadFile(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<{
    path: string;
    filename: string;
    mimetype: string;
  }> {
    const document = await this.findOne(id, userId, userRole);

    if (!fs.existsSync(document.filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    return {
      path: document.filePath,
      filename: document.originalName,
      mimetype: document.mimetype,
    };
  }

  async getStats(
    userId?: string,
    userRole?: UserRole,
  ): Promise<{
    total: number;
    draft: number;
    published: number;
    archived: number;
    byMimeType: Record<string, number>;
    totalSize: number;
  }> {
    const queryBuilder = this.documentRepository.createQueryBuilder('document');

    // If not admin, only count user's documents
    if (userRole !== UserRole.ADMIN && userId) {
      queryBuilder.where('document.createdById = :userId', { userId });
    }

    const [total, draft, published, archived] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .clone()
        .andWhere('document.status = :status', { status: DocumentStatus.DRAFT })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('document.status = :status', {
          status: DocumentStatus.PUBLISHED,
        })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('document.status = :status', {
          status: DocumentStatus.ARCHIVED,
        })
        .getCount(),
    ]);

    // Get MIME type distribution
    const mimeTypeStats = await queryBuilder
      .select('document.mimetype')
      .addSelect('COUNT(*)', 'count')
      .groupBy('document.mimetype')
      .getRawMany();

    const byMimeType: Record<string, number> = mimeTypeStats.reduce(
      (acc, stat) => {
        acc[stat.document_mimetype as string] = parseInt(
          stat.count as string,
          10,
        );
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get total size
    const sizeResult = await queryBuilder
      .select('SUM(document.size)', 'totalSize')
      .getRawOne();

    return {
      total,
      draft,
      published,
      archived,
      byMimeType,
      totalSize: parseInt(sizeResult?.totalSize as string, 10) || 0,
    };
  }
}
