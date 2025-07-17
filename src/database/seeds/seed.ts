import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DatabaseSeeder } from './database.seeder';

// Predefined seed configurations (optimized for reasonable execution time)
const SEED_CONFIGS = {
  basic: {
    users: 3,
    documents: 5,
    ingestionProcesses: 2,
  },
  medium: {
    users: 50,
    documents: 500,
    ingestionProcesses: 25,
  },
  large: {
    users: 500,
    documents: 5000,
    ingestionProcesses: 250,
  },
  // Note: Enterprise scale removed to avoid excessive execution time
  // For true enterprise scale, consider using bulk insert operations
  // or running seeds in batches during off-peak hours
};

async function runSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Get seed type from command line argument
    const seedType = process.argv[2] || 'basic';

    // Get configuration
    const config = SEED_CONFIGS[seedType];
    if (!config) {
      console.error(`❌ Invalid seed type: ${seedType}`);
      console.log('Available types: basic, medium, large');
      process.exit(1);
    }

    console.log(`🚀 Running ${seedType} seed configuration:`);
    console.log(`   Users: ${config.users}`);
    console.log(`   Documents: ${config.documents}`);
    console.log(`   Ingestion Processes: ${config.ingestionProcesses}`);
    console.log('');

    // Run seeder
    const seeder = new DatabaseSeeder(dataSource);
    await seeder.run(config);

    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Handle command line execution
if (require.main === module) {
  runSeed();
}
