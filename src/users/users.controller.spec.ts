import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole, UserStatus } from '../common/enums';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto';
import { PaginationDto } from '../common/dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
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

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    changePassword: jest.fn(),
    remove: jest.fn(),
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.EDITOR,
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const paginationDto = new PaginationDto();
      paginationDto.page = 1;
      paginationDto.limit = 10;
      const mockResult = {
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockUsersService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(paginationDto, 'search');

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(paginationDto, 'search');
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = { firstName: 'Updated' };
      const updatedUser = { ...mockUser, firstName: 'Updated' };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(
        '1',
        updateUserDto,
        'user1',
        UserRole.ADMIN,
      );

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(
        '1',
        updateUserDto,
        'user1',
        UserRole.ADMIN,
      );
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'current',
        newPassword: 'NewPassword123!',
      };

      mockUsersService.changePassword.mockResolvedValue(undefined);

      await controller.changePassword('1', changePasswordDto, 'user1');

      expect(service.changePassword).toHaveBeenCalledWith(
        '1',
        changePasswordDto,
        'user1',
      );
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('1', UserRole.ADMIN);

      expect(service.remove).toHaveBeenCalledWith('1', UserRole.ADMIN);
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        total: 100,
        active: 90,
        inactive: 10,
        byRole: {
          [UserRole.ADMIN]: 5,
          [UserRole.EDITOR]: 30,
          [UserRole.VIEWER]: 65,
        },
      };

      mockUsersService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(result).toEqual(mockStats);
      expect(service.getStats).toHaveBeenCalled();
    });
  });
});
