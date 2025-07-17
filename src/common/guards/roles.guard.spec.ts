import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../enums';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const mockExecutionContext = (user: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as any as ExecutionContext;

  it('should allow access when no roles are required', () => {
    const context = mockExecutionContext({ role: UserRole.VIEWER });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow access when user has required role', () => {
    const context = mockExecutionContext({ role: UserRole.ADMIN });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    const context = mockExecutionContext({ role: UserRole.VIEWER });
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access when user is not authenticated', () => {
    const context = mockExecutionContext(null);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });
});
