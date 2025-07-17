import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from '../database/entities';
import { UserRole, UserStatus } from '../common/enums';
import { PaginationDto } from '../common/dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const mockUser = {
    id: '1',
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

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    update: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.EDITOR,
    };

    it('should create a user successfully', async () => {
      mockRepository.findOne.mockResolvedValue(null); // No existing user
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword' as never);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedpassword',
        role: UserRole.EDITOR,
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should set default role to VIEWER when not provided', async () => {
      const dtoWithoutRole = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        // role intentionally omitted
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword' as never);

      await service.create(dtoWithoutRole);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dtoWithoutRole,
        password: 'hashedpassword',
        role: UserRole.VIEWER,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const paginationDto = new PaginationDto();
      paginationDto.page = 1;
      paginationDto.limit = 10;
      paginationDto.sortBy = 'createdAt';
      paginationDto.sortOrder = 'DESC';
      const mockUsers = [mockUser];
      const total = 1;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, total]);

      const result = await service.findAll(paginationDto);

      expect(result).toEqual({
        data: mockUsers,
        total,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply search filter when provided', async () => {
      const paginationDto = new PaginationDto();
      paginationDto.page = 1;
      paginationDto.limit = 10;
      const search = 'test';
      const mockUsers = [mockUser];
      const total = 1;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, total]);

      await service.findAll(paginationDto, search);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.username ILIKE :search OR user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search',
        { search: '%test%' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['documents', 'ingestionProcesses'],
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateUserDto = { firstName: 'Updated', lastName: 'Name' };

    it('should update user successfully when user updates own profile', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, ...updateUserDto };
      // Simulate the fullName getter with updated values
      Object.defineProperty(updatedUser, 'fullName', {
        get() {
          return `${this.firstName} ${this.lastName}`;
        },
        enumerable: true,
        configurable: true,
      });
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(
        '1',
        updateUserDto,
        '1',
        UserRole.VIEWER,
      );

      expect(result.firstName).toEqual(updateUserDto.firstName);
      expect(result.lastName).toEqual(updateUserDto.lastName);
      expect(result.fullName).toEqual('Updated Name');
    });

    it('should allow admin to update any user', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({ ...mockUser, ...updateUserDto });

      const result = await service.update(
        '1',
        updateUserDto,
        '2',
        UserRole.ADMIN,
      );

      expect(result).toEqual({ ...mockUser, ...updateUserDto });
    });

    it('should throw ForbiddenException when non-admin tries to update another user', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

      await expect(
        service.update('1', updateUserDto, '2', UserRole.VIEWER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when non-admin tries to change role', async () => {
      const roleUpdate = { role: UserRole.ADMIN };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

      await expect(
        service.update('1', roleUpdate, '1', UserRole.VIEWER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when email already exists', async () => {
      const emailUpdate = { email: 'existing@example.com' };
      const existingUser = {
        ...mockUser,
        id: '2',
        email: 'existing@example.com',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      mockRepository.findOne.mockResolvedValue(existingUser);

      await expect(
        service.update('1', emailUpdate, '1', UserRole.VIEWER),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'current123',
      newPassword: 'newPassword123!',
    };

    it('should change password successfully', async () => {
      const userWithPassword = {
        ...mockUser,
        password: await bcrypt.hash('current123', 12),
      };
      mockRepository.findOne.mockResolvedValue(userWithPassword);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('newhashedpassword' as never);

      await service.changePassword('1', changePasswordDto, '1');

      expect(mockRepository.update).toHaveBeenCalledWith('1', {
        password: 'newhashedpassword',
      });
    });

    it('should throw ForbiddenException when user tries to change another users password', async () => {
      await expect(
        service.changePassword('1', changePasswordDto, '2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('1', changePasswordDto, '1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove user successfully when admin', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      mockRepository.remove.mockResolvedValue(mockUser);

      await service.remove('1', UserRole.ADMIN);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw ForbiddenException when non-admin tries to delete', async () => {
      await expect(service.remove('1', UserRole.VIEWER)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      mockRepository.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // active
        .mockResolvedValueOnce(15) // inactive
        .mockResolvedValueOnce(5) // suspended
        .mockResolvedValueOnce(10) // admins
        .mockResolvedValueOnce(30) // editors
        .mockResolvedValueOnce(60); // viewers

      const result = await service.getStats();

      expect(result).toEqual({
        total: 100,
        active: 80,
        inactive: 15,
        suspended: 5,
        byRole: {
          [UserRole.ADMIN]: 10,
          [UserRole.EDITOR]: 30,
          [UserRole.VIEWER]: 60,
        },
      });
    });
  });
});
