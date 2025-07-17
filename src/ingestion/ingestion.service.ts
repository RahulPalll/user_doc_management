import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngestionProcess } from '../database/entities';
import { CreateIngestionDto, UpdateIngestionDto } from './dto';
import { PaginationDto } from '../common/dto';
import { PaginationResult } from '../common/interfaces';
import { IngestionStatus, IngestionType, UserRole } from '../common/enums';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(IngestionProcess)
    private ingestionRepository: Repository<IngestionProcess>,
  ) {}

  async create(
    createIngestionDto: CreateIngestionDto,
    userId: string,
  ): Promise<IngestionProcess> {
    const ingestion = this.ingestionRepository.create({
      ...createIngestionDto,
      initiatedById: userId,
      status: IngestionStatus.PENDING,
    });

    return this.ingestionRepository.save(ingestion);
  }

  async findAll(
    paginationDto: PaginationDto,
    userId: string,
    userRole: UserRole,
    status?: IngestionStatus,
    type?: IngestionType,
  ): Promise<PaginationResult<IngestionProcess>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.ingestionRepository
      .createQueryBuilder('ingestion')
      .leftJoinAndSelect('ingestion.initiatedBy', 'initiatedBy');

    // Non-admin users can only see their own ingestion processes
    if (userRole !== UserRole.ADMIN) {
      queryBuilder.where('ingestion.initiatedById = :userId', { userId });
    }

    if (status) {
      queryBuilder.andWhere('ingestion.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('ingestion.type = :type', { type });
    }

    const [ingestions, total] = await queryBuilder
      .orderBy(`ingestion.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: ingestions,
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
  ): Promise<IngestionProcess> {
    const queryBuilder = this.ingestionRepository
      .createQueryBuilder('ingestion')
      .leftJoinAndSelect('ingestion.initiatedBy', 'initiatedBy')
      .where('ingestion.id = :id', { id });

    // Non-admin users can only see their own ingestion processes
    if (userRole !== UserRole.ADMIN) {
      queryBuilder.andWhere('ingestion.initiatedById = :userId', { userId });
    }

    const ingestion = await queryBuilder.getOne();

    if (!ingestion) {
      throw new NotFoundException('Ingestion process not found');
    }

    return ingestion;
  }

  async update(
    id: string,
    updateIngestionDto: UpdateIngestionDto,
    userId: string,
    userRole: UserRole,
  ): Promise<IngestionProcess> {
    const ingestion = await this.findOne(id, userId, userRole);

    // Check permissions - only owner or admin can update
    if (ingestion.initiatedById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You can only update your own ingestion processes',
      );
    }

    Object.assign(ingestion, updateIngestionDto);
    return this.ingestionRepository.save(ingestion);
  }

  async startProcess(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<IngestionProcess> {
    const ingestion = await this.findOne(id, userId, userRole);

    if (ingestion.status !== IngestionStatus.PENDING) {
      throw new BadRequestException(
        'Ingestion process is not in pending status',
      );
    }

    // Check permissions
    if (ingestion.initiatedById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You can only start your own ingestion processes',
      );
    }

    ingestion.status = IngestionStatus.PROCESSING;
    ingestion.startedAt = new Date();

    const updatedIngestion = await this.ingestionRepository.save(ingestion);

    // Here you would trigger the actual ingestion process
    // This could be a microservice call, queue job, etc.
    this.processIngestion(updatedIngestion);

    return updatedIngestion;
  }

  async completeProcess(
    id: string,
    result: Record<string, any>,
    userId: string,
    userRole: UserRole,
  ): Promise<IngestionProcess> {
    const ingestion = await this.findOne(id, userId, userRole);

    if (ingestion.status !== IngestionStatus.PROCESSING) {
      throw new BadRequestException(
        'Ingestion process is not in processing status',
      );
    }

    ingestion.status = IngestionStatus.COMPLETED;
    ingestion.completedAt = new Date();
    ingestion.result = result;

    return this.ingestionRepository.save(ingestion);
  }

  async failProcess(
    id: string,
    errorMessage: string,
    userId: string,
    userRole: UserRole,
  ): Promise<IngestionProcess> {
    const ingestion = await this.findOne(id, userId, userRole);

    if (ingestion.status !== IngestionStatus.PROCESSING) {
      throw new BadRequestException(
        'Ingestion process is not in processing status',
      );
    }

    ingestion.status = IngestionStatus.FAILED;
    ingestion.completedAt = new Date();
    ingestion.errorMessage = errorMessage;

    return this.ingestionRepository.save(ingestion);
  }

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const ingestion = await this.findOne(id, userId, userRole);

    // Check permissions - only owner or admin can delete
    if (ingestion.initiatedById !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You can only delete your own ingestion processes',
      );
    }

    // Cannot delete running processes
    if (ingestion.status === IngestionStatus.PROCESSING) {
      throw new BadRequestException(
        'Cannot delete a running ingestion process',
      );
    }

    await this.ingestionRepository.remove(ingestion);
  }

  async getStats(
    userId?: string,
    userRole?: UserRole,
  ): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    byType: Record<IngestionType, number>;
    averageDuration: number;
  }> {
    const queryBuilder =
      this.ingestionRepository.createQueryBuilder('ingestion');

    // If not admin, only count user's processes
    if (userRole !== UserRole.ADMIN && userId) {
      queryBuilder.where('ingestion.initiatedById = :userId', { userId });
    }

    const [total, pending, processing, completed, failed] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .clone()
        .andWhere('ingestion.status = :status', {
          status: IngestionStatus.PENDING,
        })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('ingestion.status = :status', {
          status: IngestionStatus.PROCESSING,
        })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('ingestion.status = :status', {
          status: IngestionStatus.COMPLETED,
        })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('ingestion.status = :status', {
          status: IngestionStatus.FAILED,
        })
        .getCount(),
    ]);

    // Get type distribution
    const typeStats = await queryBuilder
      .select('ingestion.type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ingestion.type')
      .getRawMany();

    const byType = typeStats.reduce((acc, stat) => {
      acc[stat.ingestion_type] = parseInt(stat.count);
      return acc;
    }, {});

    // Get average duration for completed processes
    const durationResult = await queryBuilder
      .select(
        'AVG(EXTRACT(EPOCH FROM (ingestion.completedAt - ingestion.startedAt)))',
        'avgDuration',
      )
      .where(
        'ingestion.status = :status AND ingestion.startedAt IS NOT NULL AND ingestion.completedAt IS NOT NULL',
        {
          status: IngestionStatus.COMPLETED,
        },
      )
      .getRawOne();

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      byType,
      averageDuration: durationResult?.avgDuration
        ? parseFloat(durationResult.avgDuration)
        : 0,
    };
  }

  // Private method to simulate ingestion processing
  private async processIngestion(ingestion: IngestionProcess): Promise<void> {
    // This is a simulation - in a real app, this would trigger actual processing
    const timeout = setTimeout(async () => {
      try {
        // Simulate processing time
        const processingTime = Math.random() * 2000 + 1000; // Reduced time for tests: 1-3 seconds

        // Update progress periodically
        const updateInterval = setInterval(async () => {
          try {
            if (ingestion.totalItems > 0) {
              const updatedIngestion = await this.ingestionRepository.findOne({
                where: { id: ingestion.id },
              });
              if (updatedIngestion) {
                updatedIngestion.processedItems = Math.min(
                  updatedIngestion.processedItems +
                    Math.floor(Math.random() * 10),
                  updatedIngestion.totalItems,
                );
                // Check if repository is still available
                if (this.ingestionRepository) {
                  await this.ingestionRepository.save(updatedIngestion);
                }
              }
            }
          } catch (error) {
            // Silently handle errors during testing
            clearInterval(updateInterval);
          }
        }, 500); // Reduced interval for faster tests

        // Complete after processing time
        setTimeout(async () => {
          try {
            clearInterval(updateInterval);

            const finalIngestion = await this.ingestionRepository.findOne({
              where: { id: ingestion.id },
            });
            if (finalIngestion) {
              finalIngestion.status = IngestionStatus.COMPLETED;
              finalIngestion.completedAt = new Date();
              finalIngestion.processedItems = finalIngestion.totalItems;
              finalIngestion.result = {
                success: true,
                message: 'Ingestion completed successfully',
                processedItems: finalIngestion.totalItems,
              };

              // Check if repository is still available
              if (this.ingestionRepository) {
                await this.ingestionRepository.save(finalIngestion);
              }
            }
          } catch (error) {
            // Handle cleanup errors gracefully
            clearInterval(updateInterval);
          }
        }, processingTime);
      } catch (error) {
        try {
          const errorIngestion = await this.ingestionRepository.findOne({
            where: { id: ingestion.id },
          });
          if (errorIngestion) {
            errorIngestion.status = IngestionStatus.FAILED;
            errorIngestion.completedAt = new Date();
            errorIngestion.errorMessage =
              error.message || 'Unknown error occurred';
            if (this.ingestionRepository) {
              await this.ingestionRepository.save(errorIngestion);
            }
          }
        } catch (saveError) {
          // Silently handle save errors during cleanup
        }
      }
    }, 100); // Start processing after short delay
  }

  // Method to cleanup async operations (useful for testing)
  async cleanup(): Promise<void> {
    // This method can be used to clean up any running processes
    // In a real application, you might want to cancel running jobs
  }
}
