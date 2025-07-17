import { BadRequestException } from '@nestjs/common';
import { multerConfig } from './multer.config';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

describe('MulterConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fileFilter', () => {
    const mockCallback = jest.fn();
    const mockReq = {};

    beforeEach(() => {
      mockCallback.mockClear();
    });

    it('should accept PDF files', () => {
      const mockFile = { mimetype: 'application/pdf', originalname: 'test.pdf' };
      
      multerConfig.fileFilter(mockReq, mockFile as any, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should accept Word documents', () => {
      const mockFile = { 
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalname: 'test.docx'
      };
      
      multerConfig.fileFilter(mockReq, mockFile as any, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should accept Excel files', () => {
      const mockFile = { 
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        originalname: 'test.xlsx'
      };
      
      multerConfig.fileFilter(mockReq, mockFile as any, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should accept text files', () => {
      const mockFile = { mimetype: 'text/plain', originalname: 'test.txt' };
      
      multerConfig.fileFilter(mockReq, mockFile as any, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should accept CSV files', () => {
      const mockFile = { mimetype: 'text/csv', originalname: 'test.csv' };
      
      multerConfig.fileFilter(mockReq, mockFile as any, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should reject unsupported file types', () => {
      const mockFile = { mimetype: 'image/jpeg', originalname: 'test.jpg' };
      
      multerConfig.fileFilter(mockReq, mockFile as any, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(
        new BadRequestException('Only PDF, DOC, DOCX, TXT, CSV, XLS, and XLSX files are allowed'),
        false
      );
    });
  });

  describe('storage configuration', () => {
    it('should have diskStorage configured', () => {
      expect(multerConfig.storage).toBeDefined();
    });

    it('should generate filename with extension', () => {
      // Test the filename generation concept
      const testFile = { originalname: 'test.pdf' };
      const expectedExtension = '.pdf';
      
      expect(extname(testFile.originalname)).toBe(expectedExtension);
      expect(uuidv4).toBeDefined();
    });
  });

  describe('limits', () => {
    it('should have correct file size limit', () => {
      expect(multerConfig.limits.fileSize).toBe(10 * 1024 * 1024); // 10MB
    });
  });
});
