import { Document } from './document.entity';
import { User } from './user.entity';
import { DocumentStatus } from '../../common/enums';

describe('Document Entity', () => {
  let document: Document;
  let user: User;

  beforeEach(() => {
    user = new User();
    user.id = '123e4567-e89b-12d3-a456-426614174000';
    user.username = 'testuser';
    user.email = 'test@example.com';

    document = new Document();
  });

  it('should create a document entity', () => {
    document.title = 'Test Document';
    document.description = 'Test description';
    document.filename = 'test.pdf';
    document.originalName = 'original-test.pdf';
    document.mimetype = 'application/pdf';
    document.size = 1024;
    document.status = DocumentStatus.DRAFT;
    document.createdBy = user;

    expect(document.title).toBe('Test Document');
    expect(document.description).toBe('Test description');
    expect(document.filename).toBe('test.pdf');
    expect(document.originalName).toBe('original-test.pdf');
    expect(document.mimetype).toBe('application/pdf');
    expect(document.size).toBe(1024);
    expect(document.status).toBe(DocumentStatus.DRAFT);
    expect(document.createdBy).toBe(user);
  });

  it('should handle metadata as JSON', () => {
    document.metadata = { type: 'report', category: 'finance' };
    
    expect(document.metadata).toEqual({ type: 'report', category: 'finance' });
  });

  it('should set default status', () => {
    expect(document.status).toBeUndefined();
    document.status = DocumentStatus.PUBLISHED;
    expect(document.status).toBe(DocumentStatus.PUBLISHED);
  });

  it('should handle file path', () => {
    document.filePath = '/uploads/documents/test.pdf';
    expect(document.filePath).toBe('/uploads/documents/test.pdf');
  });

  it('should handle created and updated timestamps', () => {
    const now = new Date();
    document.createdAt = now;
    document.updatedAt = now;

    expect(document.createdAt).toBe(now);
    expect(document.updatedAt).toBe(now);
  });

  it('should handle nullable description', () => {
    document.description = '';
    expect(document.description).toBe('');
  });

  it('should handle tags as array', () => {
    document.tags = ['important', 'financial', 'quarterly'];
    expect(document.tags).toEqual(['important', 'financial', 'quarterly']);
  });

  it('should calculate size in MB correctly', () => {
    document.size = 2097152; // 2MB in bytes
    expect(document.sizeInMB).toBe(2);
  });

  it('should handle content field', () => {
    document.content = 'This is the extracted text content';
    expect(document.content).toBe('This is the extracted text content');
  });

  it('should handle creator and updater relationships', () => {
    const updater = new User();
    updater.id = '456e7890-e12b-34c5-d678-901234567890';
    
    document.createdBy = user;
    document.createdById = user.id;
    document.updatedBy = updater;
    document.updatedById = updater.id;

    expect(document.createdBy).toBe(user);
    expect(document.createdById).toBe(user.id);
    expect(document.updatedBy).toBe(updater);
    expect(document.updatedById).toBe(updater.id);
  });
});
