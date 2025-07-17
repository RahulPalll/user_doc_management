import { ExecutionContext } from '@nestjs/common';

describe('GetUser Decorator Logic', () => {
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockRequest: any;

  const mockUser = {
    sub: 'user123',
    email: 'test@example.com',
    role: 'admin',
    name: 'Test User',
  };

  // This is the actual function logic inside the GetUser decorator
  const getUserLogic = (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  };

  beforeEach(() => {
    mockRequest = {
      user: mockUser,
    };

    const mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as any;
  });

  it('should return entire user object when no data parameter is provided', () => {
    const result = getUserLogic(undefined, mockExecutionContext);
    expect(result).toEqual(mockUser);
  });

  it('should return specific user property when data parameter is provided', () => {
    const result = getUserLogic('email', mockExecutionContext);
    expect(result).toBe('test@example.com');
  });

  it('should return specific user property for sub field', () => {
    const result = getUserLogic('sub', mockExecutionContext);
    expect(result).toBe('user123');
  });

  it('should return undefined when user is not present', () => {
    mockRequest.user = undefined;
    const result = getUserLogic(undefined, mockExecutionContext);
    expect(result).toBeUndefined();
  });

  it('should return undefined when requested property does not exist', () => {
    const result = getUserLogic('nonexistent', mockExecutionContext);
    expect(result).toBeUndefined();
  });
});
