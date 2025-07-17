import jwtConfig from './jwt.config';

describe('JwtConfig', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_REFRESH_EXPIRES_IN;
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_REFRESH_EXPIRES_IN;
  });

  it('should return default configuration', () => {
    const config = jwtConfig();
    
    expect(config).toEqual({
      secret: 'your-super-secret-jwt-key-change-in-production',
      expiresIn: '24h',
      refreshSecret: 'your-refresh-secret-key',
      refreshExpiresIn: '7d',
    });
  });

  it('should use environment variables when provided', () => {
    process.env.JWT_SECRET = 'my-super-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.JWT_REFRESH_SECRET = 'my-refresh-secret';
    process.env.JWT_REFRESH_EXPIRES_IN = '30d';
    
    const config = jwtConfig();
    
    expect(config).toEqual({
      secret: 'my-super-secret',
      expiresIn: '1h',
      refreshSecret: 'my-refresh-secret',
      refreshExpiresIn: '30d',
    });
  });

  it('should handle empty string environment variables', () => {
    process.env.JWT_SECRET = '';
    process.env.JWT_EXPIRES_IN = '';
    
    const config = jwtConfig();
    
    expect(config.secret).toBe('your-super-secret-jwt-key-change-in-production'); // fallback to default
    expect(config.expiresIn).toBe('24h'); // fallback to default
  });
});
