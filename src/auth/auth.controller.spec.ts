import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../common/enums';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginDto = { usernameOrEmail: 'testuser', password: 'password123' };
      const expectedResult = {
        access_token: 'token',
        refresh_token: 'refresh',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: UserRole.VIEWER,
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, {});

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      };
      const expectedResult = {
        access_token: 'token',
        refresh_token: 'refresh',
        user: {
          id: '1',
          username: 'newuser',
          email: 'new@example.com',
          role: UserRole.VIEWER,
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshTokenDto = { refreshToken: 'refresh_token' };
      const expectedResult = { access_token: 'new_token' };

      mockAuthService.refreshToken.mockResolvedValue(expectedResult);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(authService.refreshToken).toHaveBeenCalledWith('refresh_token');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const userId = '1';
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(userId);

      expect(authService.logout).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const user = { id: '1', username: 'testuser', role: UserRole.VIEWER };

      const result = await controller.getProfile(user);

      expect(result).toEqual(user);
    });
  });
});
