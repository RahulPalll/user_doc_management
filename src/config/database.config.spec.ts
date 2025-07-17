import databaseConfig from './database.config';

describe('DatabaseConfig', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.NODE_ENV;
  });

  it('should return default configuration', () => {
    const config = databaseConfig();
    
    expect(config).toEqual({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'user_document_management',
      entities: ['dist/**/*.entity{.ts,.js}'],
      migrations: ['dist/database/migrations/*{.ts,.js}'],
      synchronize: true,
      ssl: false,
      logging: false,
    });
  });

  it('should use environment variables when provided', () => {
    process.env.DB_HOST = 'db.example.com';
    process.env.DB_PORT = '5433';
    process.env.DB_USERNAME = 'myuser';
    process.env.DB_PASSWORD = 'mypassword';
    process.env.DB_NAME = 'mydatabase';
    
    const config = databaseConfig();
    
    expect(config).toEqual({
      type: 'postgres',
      host: 'db.example.com',
      port: 5433,
      username: 'myuser',
      password: 'mypassword',
      database: 'mydatabase',
      entities: ['dist/**/*.entity{.ts,.js}'],
      migrations: ['dist/database/migrations/*{.ts,.js}'],
      synchronize: true,
      ssl: false,
      logging: false,
    });
  });

  it('should enable logging in development environment', () => {
    process.env.NODE_ENV = 'development';
    
    const config = databaseConfig();
    
    expect(config.logging).toBe(true);
  });

  it('should handle string port conversion', () => {
    process.env.DB_PORT = '6543';
    
    const config = databaseConfig();
    
    expect(config.port).toBe(6543);
    expect(typeof config.port).toBe('number');
  });
});
