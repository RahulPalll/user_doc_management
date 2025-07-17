import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream } from 'fs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { PaginationDto } from '../common/dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, GetUser } from '../common/decorators';
import { UserRole, DocumentStatus } from '../common/enums';
import { multerConfig } from '../config/multer.config';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @ApiOperation({ summary: 'Upload and create a new document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The document file to upload',
        },
        title: {
          type: 'string',
          description: 'Document title',
        },
        description: {
          type: 'string',
          description: 'Document description',
        },
        status: {
          type: 'string',
          enum: ['draft', 'published', 'archived'],
          description: 'Document status',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Document tags',
        },
      },
      required: ['file', 'title'],
    },
  })
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @UseGuards(RolesGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file', multerConfig))
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @GetUser('sub') userId: string,
  ) {
    return this.documentsService.create(createDocumentDto, file, userId);
  }

  @ApiOperation({ summary: 'Get all documents with pagination and filtering' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: DocumentStatus,
    description: 'Filter by status',
  })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
    @Query('search') search?: string,
    @Query('status') status?: DocumentStatus,
  ) {
    return this.documentsService.findAll(
      paginationDto,
      userId,
      userRole,
      search,
      status,
    );
  }

  @ApiOperation({ summary: 'Get document statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @Get('stats')
  getStats(
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
  ) {
    return this.documentsService.getStats(userId, userRole);
  }

  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
  ) {
    return this.documentsService.findOne(id, userId, userRole);
  }

  @ApiOperation({ summary: 'Download document file' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Document or file not found' })
  @Get(':id/download')
  async downloadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const fileInfo = await this.documentsService.downloadFile(
      id,
      userId,
      userRole,
    );

    const file = createReadStream(fileInfo.path);

    res.set({
      'Content-Type': fileInfo.mimetype,
      'Content-Disposition': `attachment; filename="${fileInfo.filename}"`,
    });

    return new StreamableFile(file);
  }

  @ApiOperation({ summary: 'Update document' })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
  ) {
    return this.documentsService.update(
      id,
      updateDocumentDto,
      userId,
      userRole,
    );
  }

  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
  ) {
    return this.documentsService.remove(id, userId, userRole);
  }
}
