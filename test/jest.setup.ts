// Jest setup for test environment
import 'reflect-metadata';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_NAME = 'test_db';
process.env.DATABASE_USERNAME = 'test_user';
process.env.DATABASE_PASSWORD = 'test_pass';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '24h';
