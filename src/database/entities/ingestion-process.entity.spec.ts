import { IngestionProcess } from './ingestion-process.entity';
import { User } from './user.entity';
import { IngestionStatus, IngestionType, UserRole } from '../../common/enums';

describe('IngestionProcess Entity', () => {
  let ingestionProcess: IngestionProcess;
  let user: User;

  beforeEach(() => {
    user = new User();
    user.id = '123e4567-e89b-12d3-a456-426614174000';
    user.username = 'testuser';
    user.email = 'test@example.com';
    user.role = UserRole.EDITOR;

    ingestionProcess = new IngestionProcess();
  });

  it('should create an ingestion process entity', () => {
    ingestionProcess.type = IngestionType.DOCUMENT_UPLOAD;
    ingestionProcess.status = IngestionStatus.PENDING;
    ingestionProcess.parameters = { source: 'test' };
    ingestionProcess.initiatedBy = user;
    ingestionProcess.totalItems = 100;
    ingestionProcess.processedItems = 0;

    expect(ingestionProcess.type).toBe(IngestionType.DOCUMENT_UPLOAD);
    expect(ingestionProcess.status).toBe(IngestionStatus.PENDING);
    expect(ingestionProcess.parameters).toEqual({ source: 'test' });
    expect(ingestionProcess.initiatedBy).toBe(user);
    expect(ingestionProcess.totalItems).toBe(100);
    expect(ingestionProcess.processedItems).toBe(0);
  });

  it('should handle all ingestion types', () => {
    ingestionProcess.type = IngestionType.BATCH_IMPORT;
    expect(ingestionProcess.type).toBe(IngestionType.BATCH_IMPORT);

    ingestionProcess.type = IngestionType.API_SYNC;
    expect(ingestionProcess.type).toBe(IngestionType.API_SYNC);
  });

  it('should handle all statuses', () => {
    ingestionProcess.status = IngestionStatus.PROCESSING;
    expect(ingestionProcess.status).toBe(IngestionStatus.PROCESSING);

    ingestionProcess.status = IngestionStatus.COMPLETED;
    expect(ingestionProcess.status).toBe(IngestionStatus.COMPLETED);

    ingestionProcess.status = IngestionStatus.FAILED;
    expect(ingestionProcess.status).toBe(IngestionStatus.FAILED);
  });

  it('should handle timestamps', () => {
    const now = new Date();
    ingestionProcess.startedAt = now;
    ingestionProcess.completedAt = now;
    ingestionProcess.createdAt = now;
    ingestionProcess.updatedAt = now;

    expect(ingestionProcess.startedAt).toBe(now);
    expect(ingestionProcess.completedAt).toBe(now);
    expect(ingestionProcess.createdAt).toBe(now);
    expect(ingestionProcess.updatedAt).toBe(now);
  });

  it('should handle optional fields', () => {
    ingestionProcess.result = { success: true };
    ingestionProcess.errorMessage = 'Test error';
    ingestionProcess.failedItems = 5;

    expect(ingestionProcess.result).toEqual({ success: true });
    expect(ingestionProcess.errorMessage).toBe('Test error');
    expect(ingestionProcess.failedItems).toBe(5);
  });

  it('should calculate progress correctly', () => {
    ingestionProcess.totalItems = 100;
    ingestionProcess.processedItems = 50;

    expect(ingestionProcess.progress).toBe(50);
  });

  it('should handle duration calculation', () => {
    const startTime = new Date('2023-01-01T10:00:00Z');
    const endTime = new Date('2023-01-01T10:02:00Z');
    
    ingestionProcess.startedAt = startTime;
    ingestionProcess.completedAt = endTime;
    
    expect(ingestionProcess.duration).toBe(120); // 2 minutes
  });
});
