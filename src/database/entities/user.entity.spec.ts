import { User } from './user.entity';
import { Document } from './document.entity';
import { IngestionProcess } from './ingestion-process.entity';
import { UserRole, UserStatus } from '../../common/enums';

describe('User Entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
  });

  it('should create a user entity', () => {
    user.username = 'testuser';
    user.email = 'test@example.com';
    user.firstName = 'Test';
    user.lastName = 'User';
    user.role = UserRole.EDITOR;

    expect(user.username).toBe('testuser');
    expect(user.email).toBe('test@example.com');
    expect(user.firstName).toBe('Test');
    expect(user.lastName).toBe('User');
    expect(user.role).toBe(UserRole.EDITOR);
  });

  it('should handle password field', () => {
    user.password = 'hashedpassword';
    expect(user.password).toBe('hashedpassword');
  });

  it('should handle status field', () => {
    user.status = UserStatus.ACTIVE;
    expect(user.status).toBe(UserStatus.ACTIVE);

    user.status = UserStatus.INACTIVE;
    expect(user.status).toBe(UserStatus.INACTIVE);

    user.status = UserStatus.SUSPENDED;
    expect(user.status).toBe(UserStatus.SUSPENDED);
  });

  it('should handle timestamps', () => {
    const now = new Date();
    user.createdAt = now;
    user.updatedAt = now;
    user.lastLoginAt = now;

    expect(user.createdAt).toBe(now);
    expect(user.updatedAt).toBe(now);
    expect(user.lastLoginAt).toBe(now);
  });

  it('should handle null lastLoginAt', () => {
    user.lastLoginAt = null;
    expect(user.lastLoginAt).toBeNull();
  });

  it('should handle entity relationships', () => {
    const documents: Document[] = [];
    const ingestionProcesses: IngestionProcess[] = [];

    user.documents = documents;
    user.ingestionProcesses = ingestionProcesses;

    expect(user.documents).toBe(documents);
    expect(user.ingestionProcesses).toBe(ingestionProcesses);
  });

  it('should handle default role', () => {
    // Test that default role can be set
    user.role = UserRole.VIEWER;
    expect(user.role).toBe(UserRole.VIEWER);
  });

  it('should handle all user roles', () => {
    user.role = UserRole.ADMIN;
    expect(user.role).toBe(UserRole.ADMIN);

    user.role = UserRole.EDITOR;
    expect(user.role).toBe(UserRole.EDITOR);

    user.role = UserRole.VIEWER;
    expect(user.role).toBe(UserRole.VIEWER);
  });

  it('should generate full name correctly', () => {
    user.firstName = 'John';
    user.lastName = 'Doe';

    expect(user.fullName).toBe('John Doe');
  });
});
