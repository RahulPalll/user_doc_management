import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto';
import { PaginationDto } from '../common/dto';
import { PaginationResult } from '../common/interfaces';
import { UserRole, UserStatus } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.VIEWER,
    });

    return this.userRepository.save(user);
  }

  async findAll(
    paginationDto: PaginationDto,
    search?: string,
  ): Promise<PaginationResult<User>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        'user.username ILIKE :search OR user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await queryBuilder
      .orderBy(`user.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['documents', 'ingestionProcesses'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
    currentUserRole: UserRole,
  ): Promise<User> {
    const user = await this.findOne(id);

    // Check permissions
    if (currentUserId !== id && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Only admins can change roles and status
    if (
      (updateUserDto.role || updateUserDto.status) &&
      currentUserRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only admins can change user roles and status',
      );
    }

    // Check if email is being changed and already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
    currentUserId: string,
  ): Promise<void> {
    if (currentUserId !== id) {
      throw new ForbiddenException('You can only change your own password');
    }

    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds,
    );

    await this.userRepository.update(id, { password: hashedPassword });
  }

  async remove(id: string, currentUserRole: UserRole): Promise<void> {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete users');
    }

    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    byRole: Record<UserRole, number>;
  }> {
    const [total, active, inactive, suspended] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.userRepository.count({ where: { status: UserStatus.INACTIVE } }),
      this.userRepository.count({ where: { status: UserStatus.SUSPENDED } }),
    ]);

    const [admins, editors, viewers] = await Promise.all([
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
      this.userRepository.count({ where: { role: UserRole.EDITOR } }),
      this.userRepository.count({ where: { role: UserRole.VIEWER } }),
    ]);

    return {
      total,
      active,
      inactive,
      suspended,
      byRole: {
        [UserRole.ADMIN]: admins,
        [UserRole.EDITOR]: editors,
        [UserRole.VIEWER]: viewers,
      },
    };
  }
}
