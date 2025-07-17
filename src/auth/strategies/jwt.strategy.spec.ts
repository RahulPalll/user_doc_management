import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UserRole, UserStatus } from '../../common/enums';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('should return user payload when valid', async () => {
      const payload = {
        sub: '1',
        username: 'testuser',
        role: UserRole.VIEWER,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        sub: '1',
        username: 'testuser',
        role: UserRole.VIEWER,
      });
    });

    it('should throw UnauthorizedException when payload is invalid', async () => {
      const payload = null as any;

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
