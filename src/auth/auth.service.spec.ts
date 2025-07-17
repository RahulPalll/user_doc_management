import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../database/entities';
import { UserRole, UserStatus } from '../common/enums';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

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
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };

      mockRepository.findOne.mockResolvedValue(userWithHashedPassword);
      mockRepository.update.mockResolvedValue(undefined);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('testuser', 'password123');

      expect(result).toEqual({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.VIEWER,
        status: UserStatus.ACTIVE,
        lastLoginAt: null, // The returned object still has null since update is separate
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        documents: [],
        ingestionProcesses: [],
        fullName: 'Test User',
      });
      expect(mockRepository.update).toHaveBeenCalledWith('1', {
        lastLoginAt: expect.any(Date),
      });
    });

    it('should return null when user is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };
      mockRepository.findOne.mockResolvedValue(inactiveUser);

      const result = await service.validateUser('testuser', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return tokens and user info when login is successful', async () => {
      const loginDto = { usernameOrEmail: 'testuser', password: 'password123' };
      const validatedUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.VIEWER,
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(validatedUser);
      mockJwtService.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      mockConfigService.get.mockReturnValue('secret');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        user: validatedUser,
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto = {
        usernameOrEmail: 'testuser',
        password: 'wrongpassword',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    const registerDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
    };

    it('should successfully register a new user', async () => {
      mockRepository.findOne.mockResolvedValue(null); // No existing user
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      mockConfigService.get.mockReturnValue('secret');

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword' as never);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: UserRole.VIEWER,
        },
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new access token when refresh token is valid', async () => {
      const refreshToken = 'valid_refresh_token';
      const payload = { sub: '1', username: 'testuser', role: UserRole.VIEWER };

      mockJwtService.verify.mockReturnValue(payload);
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new_access_token');
      mockConfigService.get.mockReturnValue('secret');

      const result = await service.refreshToken(refreshToken);

      expect(result).toEqual({ access_token: 'new_access_token' });
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      const refreshToken = 'invalid_refresh_token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const refreshToken = 'valid_refresh_token';
      const payload = { sub: '1', username: 'testuser', role: UserRole.VIEWER };

      mockJwtService.verify.mockReturnValue(payload);
      mockRepository.findOne.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('secret');

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
