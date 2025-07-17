import { UserRole, UserStatus, DocumentStatus, IngestionStatus } from './index';

describe('Enums', () => {
  describe('UserRole', () => {
    it('should have correct role values', () => {
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.EDITOR).toBe('editor');
      expect(UserRole.VIEWER).toBe('viewer');
    });

    it('should contain all expected roles', () => {
      const roles = Object.values(UserRole);
      expect(roles).toHaveLength(3);
      expect(roles).toContain('admin');
      expect(roles).toContain('editor');
      expect(roles).toContain('viewer');
    });
  });

  describe('UserStatus', () => {
    it('should have correct status values', () => {
      expect(UserStatus.ACTIVE).toBe('active');
      expect(UserStatus.INACTIVE).toBe('inactive');
      expect(UserStatus.SUSPENDED).toBe('suspended');
    });

    it('should contain all expected statuses', () => {
      const statuses = Object.values(UserStatus);
      expect(statuses).toHaveLength(3);
      expect(statuses).toContain('active');
      expect(statuses).toContain('inactive');
      expect(statuses).toContain('suspended');
    });
  });

  describe('DocumentStatus', () => {
    it('should have correct status values', () => {
      expect(DocumentStatus.DRAFT).toBe('draft');
      expect(DocumentStatus.PUBLISHED).toBe('published');
      expect(DocumentStatus.ARCHIVED).toBe('archived');
    });

    it('should contain all expected statuses', () => {
      const statuses = Object.values(DocumentStatus);
      expect(statuses).toHaveLength(3);
      expect(statuses).toContain('draft');
      expect(statuses).toContain('published');
      expect(statuses).toContain('archived');
    });
  });

  describe('IngestionStatus', () => {
    it('should have correct status values', () => {
      expect(IngestionStatus.PENDING).toBe('pending');
      expect(IngestionStatus.PROCESSING).toBe('processing');
      expect(IngestionStatus.COMPLETED).toBe('completed');
      expect(IngestionStatus.FAILED).toBe('failed');
    });

    it('should contain all expected statuses', () => {
      const statuses = Object.values(IngestionStatus);
      expect(statuses).toHaveLength(4);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('processing');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('failed');
    });
  });
});
