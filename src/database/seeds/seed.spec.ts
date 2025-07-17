import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { DatabaseSeeder } from './database.seeder';

// Mock dependencies
jest.mock('@nestjs/core');
jest.mock('./database.seeder');

describe('Database Seeder', () => {
  let mockApp: any;
  let mockDataSource: any;
  let mockSeeder: any;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    mockDataSource = {};
    mockApp = {
      get: jest.fn().mockReturnValue(mockDataSource),
      close: jest.fn().mockResolvedValue(undefined),
    };
    mockSeeder = {
      run: jest.fn().mockResolvedValue(undefined),
    };

    (NestFactory.createApplicationContext as jest.Mock).mockResolvedValue(mockApp);
    (DatabaseSeeder as jest.Mock).mockImplementation(() => mockSeeder);

    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    // Reset argv
    process.argv = ['node', 'seed.ts'];
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should run basic seed configuration by default', async () => {
    // Import and run seed
    const seedModule = require('./seed');
    const { runSeed } = seedModule;

    await runSeed();

    expect(mockSeeder.run).toHaveBeenCalledWith({
      users: 3,
      documents: 5,
      ingestionProcesses: 2,
    });

    expect(consoleSpy).toHaveBeenCalledWith('🚀 Running basic seed configuration:');
    expect(consoleSpy).toHaveBeenCalledWith('   Users: 3');
    expect(consoleSpy).toHaveBeenCalledWith('   Documents: 5');
    expect(consoleSpy).toHaveBeenCalledWith('   Ingestion Processes: 2');
    expect(consoleSpy).toHaveBeenCalledWith('\n🎉 Database seeding completed successfully!');
    expect(mockApp.close).toHaveBeenCalled();
  });

  it('should run medium seed configuration when specified', async () => {
    process.argv = ['node', 'seed.ts', 'medium'];

    const seedModule = require('./seed');
    const { runSeed } = seedModule;

    await runSeed();

    expect(mockSeeder.run).toHaveBeenCalledWith({
      users: 50,
      documents: 500,
      ingestionProcesses: 25,
    });

    expect(consoleSpy).toHaveBeenCalledWith('🚀 Running medium seed configuration:');
  });

  it('should run large seed configuration when specified', async () => {
    process.argv = ['node', 'seed.ts', 'large'];

    const seedModule = require('./seed');
    const { runSeed } = seedModule;

    await runSeed();

    expect(mockSeeder.run).toHaveBeenCalledWith({
      users: 500,
      documents: 5000,
      ingestionProcesses: 250,
    });

    expect(consoleSpy).toHaveBeenCalledWith('🚀 Running large seed configuration:');
  });

  it('should handle invalid seed type', async () => {
    process.argv = ['node', 'seed.ts', 'invalid'];

    const seedModule = require('./seed');
    const { runSeed } = seedModule;

    try {
      await runSeed();
    } catch (error) {
      expect(error.message).toBe('process.exit');
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid seed type: invalid');
    expect(consoleSpy).toHaveBeenCalledWith('Available types: basic, medium, large');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle seeding errors', async () => {
    const error = new Error('Seeding failed');
    mockSeeder.run.mockRejectedValue(error);

    const seedModule = require('./seed');
    const { runSeed } = seedModule;

    try {
      await runSeed();
    } catch (e) {
      expect(e.message).toBe('process.exit');
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Database seeding failed:', error);
    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(mockApp.close).toHaveBeenCalled();
  });
});
