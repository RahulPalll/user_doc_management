import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { User } from '../entities/user.entity';
import { Document } from '../entities/document.entity';
import { IngestionProcess } from '../entities/ingestion-process.entity';
import { UserRole } from '../../common/enums';

export interface ValidationResult {
  isValid: boolean;
  stats: {
    users: number;
    documents: number;
    ingestionProcesses: number;
    totalRecords: number;
  };
  roleDistribution: Record<string, number>;
  errors: string[];
}

export class DataValidator {
  constructor(private dataSource: DataSource) {}

  /**
   * Quick validation of seeded data
   */
  async validateData(): Promise<ValidationResult> {
    const errors: string[] = [];
    const stats = {
      users: 0,
      documents: 0,
      ingestionProcesses: 0,
      totalRecords: 0,
    };

    try {
      // Get repositories
      const userRepo = this.dataSource.getRepository(User);
      const documentRepo = this.dataSource.getRepository(Document);
      const ingestionRepo = this.dataSource.getRepository(IngestionProcess);

      // Count records efficiently
      const [userCount, documentCount, ingestionCount] = await Promise.all([
        userRepo.count(),
        documentRepo.count(),
        ingestionRepo.count(),
      ]);

      stats.users = userCount;
      stats.documents = documentCount;
      stats.ingestionProcesses = ingestionCount;
      stats.totalRecords = userCount + documentCount + ingestionCount;

      // Validate minimum requirements
      if (userCount === 0) {
        errors.push('No users found in database');
      }

      // Get role distribution efficiently
      const roleStats = await userRepo
        .createQueryBuilder('user')
        .select('user.role', 'role')
        .addSelect('COUNT(*)', 'count')
        .groupBy('user.role')
        .getRawMany();

      const roleDistribution: Record<string, number> = {};
      roleStats.forEach(stat => {
        roleDistribution[stat.role] = parseInt(stat.count);
      });

      // Validate role distribution
      if (!roleDistribution[UserRole.ADMIN]) {
        errors.push('No admin users found');
      }

      // Validate foreign key relationships (quick sample check)
      if (documentCount > 0) {
        const documentsWithoutCreator = await documentRepo
          .createQueryBuilder('doc')
          .where('doc.created_by_id IS NULL')
          .getCount();
        if (documentsWithoutCreator > 0) {
          errors.push(`${documentsWithoutCreator} documents without creator`);
        }
      }

      if (ingestionCount > 0) {
        const processesWithoutInitiator = await ingestionRepo
          .createQueryBuilder('process')
          .where('process.initiated_by_id IS NULL')
          .getCount();
        if (processesWithoutInitiator > 0) {
          errors.push(`${processesWithoutInitiator} ingestion processes without initiator`);
        }
      }

      return {
        isValid: errors.length === 0,
        stats,
        roleDistribution,
        errors,
      };

    } catch (error) {
      errors.push(`Validation failed: ${error.message}`);
      return {
        isValid: false,
        stats,
        roleDistribution: {},
        errors,
      };
    }
  }

  /**
   * Print validation results
   */
  printResults(result: ValidationResult): void {
    console.log('\n🔍 DATA VALIDATION RESULTS');
    console.log('==========================');
    
    if (result.isValid) {
      console.log('✅ Data validation PASSED');
    } else {
      console.log('❌ Data validation FAILED');
      console.log('\nErrors:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('\n📊 Data Statistics:');
    console.log(`   👥 Users: ${result.stats.users}`);
    console.log(`   📄 Documents: ${result.stats.documents}`);
    console.log(`   ⚙️ Ingestion Processes: ${result.stats.ingestionProcesses}`);
    console.log(`   📊 Total Records: ${result.stats.totalRecords}`);

    if (Object.keys(result.roleDistribution).length > 0) {
      console.log('\n👥 Role Distribution:');
      Object.entries(result.roleDistribution).forEach(([role, count]) => {
        console.log(`   ${role}: ${count}`);
      });
    }
  }
}

/**
 * Standalone validation runner
 */
async function runValidation() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🚀 Running quick data validation...');
    const validator = new DataValidator(dataSource);
    const result = await validator.validateData();
    validator.printResults(result);
    
    if (!result.isValid) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Handle command line execution
if (require.main === module) {
  runValidation();
}

export { runValidation };
