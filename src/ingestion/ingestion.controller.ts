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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { CreateIngestionDto, UpdateIngestionDto } from './dto';
import { PaginationDto } from '../common/dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, GetUser } from '../common/decorators';
import { UserRole, IngestionStatus, IngestionType } from '../common/enums';

@ApiTags('Ingestion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @ApiOperation({ summary: 'Create a new ingestion process' })
  @ApiResponse({
    status: 201,
    description: 'Ingestion process created successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(RolesGuard)
  @Post()
  create(
    @Body() createIngestionDto: CreateIngestionDto,
    @GetUser('sub') userId: string,
  ) {
    return this.ingestionService.create(createIngestionDto, userId);
  }

  @ApiOperation({
    summary: 'Get all ingestion processes with pagination and filtering',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: IngestionStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: IngestionType,
    description: 'Filter by type',
  })
  @ApiResponse({
    status: 200,
    description: 'Ingestion processes retrieved successfully',
  })
  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
    @Query('status') status?: IngestionStatus,
    @Query('type') type?: IngestionType,
  ) {
    return this.ingestionService.findAll(
      paginationDto,
      userId,
      userRole,
      status,
      type,
    );
  }

  @ApiOperation({ summary: 'Get ingestion statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @Get('stats')
  getStats(
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
  ) {
    return this.ingestionService.getStats(userId, userRole);
  }

  @ApiOperation({ summary: 'Get ingestion process by ID' })
  @ApiResponse({
    status: 200,
    description: 'Ingestion process retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Ingestion process not found' })
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
  ) {
    return this.ingestionService.findOne(id, userId, userRole);
  }

  @ApiOperation({ summary: 'Start an ingestion process' })
  @ApiResponse({
    status: 200,
    description: 'Ingestion process started successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid process status' })
  @Post(':id/start')
  startProcess(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
  ) {
    return this.ingestionService.startProcess(id, userId, userRole);
  }

  @ApiOperation({ summary: 'Complete an ingestion process' })
  @ApiResponse({
    status: 200,
    description: 'Ingestion process completed successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(RolesGuard)
  @Post(':id/complete')
  completeProcess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('result') result: Record<string, any>,
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
  ) {
    return this.ingestionService.completeProcess(id, result, userId, userRole);
  }

  @ApiOperation({ summary: 'Mark an ingestion process as failed' })
  @ApiResponse({
    status: 200,
    description: 'Ingestion process marked as failed',
  })
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(RolesGuard)
  @Post(':id/fail')
  failProcess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('errorMessage') errorMessage: string,
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
  ) {
    return this.ingestionService.failProcess(
      id,
      errorMessage,
      userId,
      userRole,
    );
  }

  @ApiOperation({ summary: 'Update ingestion process' })
  @ApiResponse({
    status: 200,
    description: 'Ingestion process updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ingestion process not found' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIngestionDto: UpdateIngestionDto,
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
  ) {
    return this.ingestionService.update(
      id,
      updateIngestionDto,
      userId,
      userRole,
    );
  }

  @ApiOperation({ summary: 'Delete ingestion process' })
  @ApiResponse({
    status: 200,
    description: 'Ingestion process deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ingestion process not found' })
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('sub') userId: string,
    @GetUser('role') userRole: UserRole,
  ) {
    return this.ingestionService.remove(id, userId, userRole);
  }
}
