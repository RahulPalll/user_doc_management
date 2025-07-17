import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Document } from '../entities/document.entity';
import { IngestionProcess } from '../entities/ingestion-process.entity';
import { UserRole, UserStatus, IngestionType, IngestionStatus } from '../../common/enums';

export interface SeedOptions {
  users: number;
  documents: number;
  ingestionProcesses: number;
}

export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  /**
   * Seed database with configurable data amounts
   * @param options - Configuration for data generation
   */
  async run(options: SeedOptions): Promise<void> {
    console.log('🌱 Starting database seeding...');
    const startTime = Date.now();

    try {
      // Clear existing data in correct order (handle foreign keys)
      await this.clearTables();
      
      // Generate data
      await this.generateUsers(options.users);
      await this.generateDocuments(options.documents);
      await this.generateIngestionProcesses(options.ingestionProcesses);

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      console.log(`✅ Database seeding completed in ${duration.toFixed(2)}s`);
      
      // Show statistics
      await this.showStatistics();
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Clear all tables in correct order to handle foreign key constraints
   */
  private async clearTables(): Promise<void> {
    console.log('🧹 Clearing existing data...');
    await this.dataSource.query('TRUNCATE TABLE "ingestion_processes" CASCADE');
    await this.dataSource.query('TRUNCATE TABLE "documents" CASCADE');
    await this.dataSource.query('TRUNCATE TABLE "users" CASCADE');
  }

  /**
   * Generate users with realistic distribution
   */
  private async generateUsers(count: number): Promise<void> {
    console.log(`👥 Generating ${count} users...`);
    const userRepository = this.dataSource.getRepository(User);

    if (count <= 10) {
      // Small dataset: create specific test users
      await this.createBasicTestUsers(userRepository);
      return;
    }

    // Large dataset: generate with realistic distribution
    const roleDistribution = {
      [UserRole.ADMIN]: Math.max(1, Math.floor(count * 0.05)), // At least 1 admin
      [UserRole.EDITOR]: Math.floor(count * 0.20),
      [UserRole.VIEWER]: Math.floor(count * 0.75),
    };

    const users: User[] = [];
    const batchSize = 500;
    let userIndex = 0;

    // Sample data for realistic generation
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

    // Generate users for each role
    for (const [role, roleCount] of Object.entries(roleDistribution)) {
      console.log(`  Creating ${roleCount} ${role} users...`);
      
      for (let i = 0; i < roleCount; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${userIndex}`;
        const email = `${username}@example.com`;
        
        const user = userRepository.create({
          username,
          email,
          password: await bcrypt.hash('Password123!', 12),
          firstName,
          lastName,
          role: role as UserRole,
          status: UserStatus.ACTIVE,
        });

        users.push(user);
        userIndex++;

        // Save in batches for performance
        if (users.length >= batchSize) {
          await userRepository.save(users);
          users.length = 0; // Clear array
          console.log(`    Saved batch (${userIndex}/${count})`);
        }
      }
    }

    // Save remaining users
    if (users.length > 0) {
      await userRepository.save(users);
    }

    console.log(`✅ Created ${userIndex} users`);
  }

  /**
   * Create basic test users for development
   */
  private async createBasicTestUsers(userRepository: any): Promise<void> {
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('Admin123!', 12),
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
      },
      {
        username: 'editor',
        email: 'editor@example.com',
        password: await bcrypt.hash('Editor123!', 12),
        firstName: 'Content',
        lastName: 'Editor',
        role: UserRole.EDITOR,
      },
      {
        username: 'viewer',
        email: 'viewer@example.com',
        password: await bcrypt.hash('Viewer123!', 12),
        firstName: 'Content',
        lastName: 'Viewer',
        role: UserRole.VIEWER,
      },
    ];

    for (const userData of testUsers) {
      const user = userRepository.create({
        ...userData,
        status: UserStatus.ACTIVE,
      });
      await userRepository.save(user);
    }

    console.log('✅ Created 3 basic test users');
  }

  /**
   * Generate documents with realistic characteristics
   */
  private async generateDocuments(count: number): Promise<void> {
    if (count === 0) return;
    
    console.log(`📄 Generating ${count} documents...`);
    const documentRepository = this.dataSource.getRepository(Document);
    const userRepository = this.dataSource.getRepository(User);

    // Get users to assign as document creators
    const users = await userRepository.find();
    if (users.length === 0) {
      console.log('⚠️ No users found, skipping document generation');
      return;
    }

    const documents: Document[] = [];
    const batchSize = 1000;
    
    // Sample document data
    const fileTypes = [
      { ext: 'pdf', mime: 'application/pdf', sizeRange: [100, 5000] },
      { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeRange: [50, 2000] },
      { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', sizeRange: [30, 1500] },
      { ext: 'txt', mime: 'text/plain', sizeRange: [1, 100] },
      { ext: 'jpg', mime: 'image/jpeg', sizeRange: [500, 8000] },
      { ext: 'png', mime: 'image/png', sizeRange: [200, 5000] },
    ];

    const documentTitles = [
      'Annual Report', 'Project Proposal', 'Meeting Notes', 'User Manual', 'Technical Specification',
      'Budget Analysis', 'Marketing Plan', 'Research Data', 'Training Material', 'Policy Document'
    ];

    for (let i = 0; i < count; i++) {
      const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
      const title = documentTitles[Math.floor(Math.random() * documentTitles.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const size = Math.floor(Math.random() * (fileType.sizeRange[1] - fileType.sizeRange[0])) + fileType.sizeRange[0];
      
      const document = documentRepository.create({
        title: `${title} ${i + 1}`,
        filename: `document_${i + 1}.${fileType.ext}`,
        originalName: `${title.toLowerCase().replace(/\s+/g, '_')}_${i + 1}.${fileType.ext}`,
        mimetype: fileType.mime,
        size: size * 1024, // Convert to bytes
        filePath: `/uploads/documents/document_${i + 1}.${fileType.ext}`,
        content: `Sample content for ${title} ${i + 1}`,
        createdBy: user,
      });

      documents.push(document);

      // Save in batches
      if (documents.length >= batchSize) {
        await documentRepository.save(documents);
        documents.length = 0;
        console.log(`    Saved batch (${i + 1}/${count})`);
      }
    }

    // Save remaining documents
    if (documents.length > 0) {
      await documentRepository.save(documents);
    }

    console.log(`✅ Created ${count} documents`);
  }

  /**
   * Generate ingestion processes
   */
  private async generateIngestionProcesses(count: number): Promise<void> {
    if (count === 0) return;
    
    console.log(`⚙️ Generating ${count} ingestion processes...`);
    const ingestionRepository = this.dataSource.getRepository(IngestionProcess);
    const userRepository = this.dataSource.getRepository(User);

    const users = await userRepository.find({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.EDITOR }]
    });

    if (users.length === 0) {
      console.log('⚠️ No admin/editor users found, skipping ingestion generation');
      return;
    }

    const processes: IngestionProcess[] = [];
    const batchSize = 500;
    const types = Object.values(IngestionType);
    const statuses = Object.values(IngestionStatus);

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const totalItems = Math.floor(Math.random() * 1000) + 100;
      const processedItems = status === IngestionStatus.COMPLETED ? totalItems : Math.floor(Math.random() * totalItems);

      const process = ingestionRepository.create({
        type,
        status,
        totalItems,
        processedItems,
        failedItems: Math.floor(Math.random() * 10),
        parameters: {
          batchSize: 100,
          source: 'automated_generation',
        },
        initiatedBy: user,
        startedAt: status !== IngestionStatus.PENDING ? new Date() : null,
        completedAt: status === IngestionStatus.COMPLETED ? new Date() : null,
      });

      processes.push(process);

      // Save in batches
      if (processes.length >= batchSize) {
        await ingestionRepository.save(processes);
        processes.length = 0;
        console.log(`    Saved batch (${i + 1}/${count})`);
      }
    }

    // Save remaining processes
    if (processes.length > 0) {
      await ingestionRepository.save(processes);
    }

    console.log(`✅ Created ${count} ingestion processes`);
  }

  /**
   * Display statistics after seeding
   */
  async showStatistics(): Promise<void> {
    console.log('\n📊 Database Statistics:');
    console.log('========================');
    
    const userCount = await this.dataSource.getRepository(User).count();
    const documentCount = await this.dataSource.getRepository(Document).count();
    const ingestionCount = await this.dataSource.getRepository(IngestionProcess).count();
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`📄 Documents: ${documentCount}`);
    console.log(`⚙️ Ingestion Processes: ${ingestionCount}`);
    console.log(`📊 Total Records: ${userCount + documentCount + ingestionCount}`);
    
    // Role distribution
    const roleStats = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();
      
    console.log('\n👥 User Role Distribution:');
    roleStats.forEach(stat => {
      console.log(`   ${stat.role}: ${stat.count}`);
    });
  }
}
