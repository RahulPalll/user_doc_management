import appConfig from './app.config';

describe('AppConfig', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.API_PREFIX;
    delete process.env.CORS_ORIGINS;
    delete process.env.MAX_FILE_SIZE;
    delete process.env.ALLOWED_FILE_TYPES;
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.API_PREFIX;
    delete process.env.CORS_ORIGINS;
    delete process.env.MAX_FILE_SIZE;
    delete process.env.ALLOWED_FILE_TYPES;
  });

  it('should return default configuration', () => {
    const config = appConfig();
    
    expect(config).toEqual({
      port: 3000,
      environment: 'development',
      apiPrefix: 'api/v1',
      corsOrigins: ['http://localhost:3000'],
      maxFileSize: 10485760, // 10MB
      allowedFileTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
      ],
    });
  });

  it('should use environment variables when provided', () => {
    process.env.NODE_ENV = 'production';
    process.env.PORT = '8080';
    process.env.API_PREFIX = 'v2/api';
    process.env.CORS_ORIGINS = 'https://example.com,https://app.example.com';
    process.env.MAX_FILE_SIZE = '20971520'; // 20MB
    process.env.ALLOWED_FILE_TYPES = 'application/pdf,text/plain';
    
    const config = appConfig();
    
    expect(config).toEqual({
      port: 8080,
      environment: 'production',
      apiPrefix: 'v2/api',
      corsOrigins: ['https://example.com', 'https://app.example.com'],
      maxFileSize: 20971520,
      allowedFileTypes: ['application/pdf', 'text/plain'],
    });
  });

  it('should handle string port conversion', () => {
    process.env.PORT = '9000';
    
    const config = appConfig();
    
    expect(config.port).toBe(9000);
    expect(typeof config.port).toBe('number');
  });

  it('should handle invalid port gracefully', () => {
    process.env.PORT = 'invalid';
    
    const config = appConfig();
    
    expect(config.port).toBeNaN();
  });
});
