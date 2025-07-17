import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UserSeeder } from './user.seeder';
import { DocumentSeeder } from './document.seeder';

async function runSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const configService = app.get(ConfigService);

  try {
    console.log('🌱 Starting database seeding...');

    // Run seeders in order
    const userSeeder = new UserSeeder(dataSource);
    await userSeeder.run();
    console.log('✅ User seeding completed');

    const documentSeeder = new DocumentSeeder(dataSource);
    await documentSeeder.run();
    console.log('✅ Document seeding completed');

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  runSeed();
}
