import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserRole, UserStatus } from '../src/common/enums';
import { User } from '../src/database/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Application (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
          database: process.env.DB_NAME || 'test_db',
          entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema: true, // Clean database for each test run
          logging: false, // Disable SQL logging for cleaner test output
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.setGlobalPrefix('api/v1');

    await app.init();
  });

  afterAll(async () => {
    try {
      // Close the application first
      if (app) {
        await app.close();
      }

      // Give some time for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      // Silently handle cleanup errors - tests have already passed
    }
  });

  describe('Authentication (e2e)', () => {
    it('/api/v1/auth/register (POST) - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          expect(res.body.user).toHaveProperty('username', 'testuser');
          authToken = res.body.access_token;
          userId = res.body.user.id;
        });
    });

    it('/api/v1/auth/register (POST) - should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'te',
          email: 'invalid-email',
          password: 'weak',
        })
        .expect(400);
    });

    it('/api/v1/auth/login (POST) - should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          usernameOrEmail: 'testuser',
          password: 'Password123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
        });
    });

    it('/api/v1/auth/login (POST) - should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          usernameOrEmail: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('/api/v1/auth/profile (POST) - should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('username', 'testuser');
        });
    });

    it('/api/v1/auth/profile (POST) - should fail without token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/profile')
        .expect(401);
    });
  });

  describe('Users (e2e)', () => {
    beforeAll(async () => {
      // Create admin user directly in database for testing
      const userRepository: Repository<User> = app.get(
        getRepositoryToken(User),
      );

      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      const adminUser = userRepository.create({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      await userRepository.save(adminUser);

      // Login to get admin token
      const adminResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          usernameOrEmail: 'admin',
          password: 'Admin123!',
        });
      adminToken = adminResponse.body.access_token;
    });

    it('/api/v1/users (GET) - should get users list for admin', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/api/v1/users (GET) - should fail for non-admin users', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('/api/v1/users/:id (GET) - should get user by id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect(res.body).toHaveProperty('username', 'testuser');
        });
    });

    it('/api/v1/users/stats (GET) - should get user statistics for admin', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('active');
          expect(res.body).toHaveProperty('byRole');
        });
    });
  });

  describe('Documents (e2e)', () => {
    let documentId: string;

    it('/api/v1/documents (POST) - should upload document', () => {
      return request(app.getHttpServer())
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Document')
        .field('description', 'Test description')
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', 'Test Document');
          expect(res.body).toHaveProperty('filename');
          documentId = res.body.id;
        });
    });

    it('/api/v1/documents (GET) - should get documents list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/api/v1/documents/:id (GET) - should get document by id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', documentId);
          expect(res.body).toHaveProperty('title', 'Test Document');
        });
    });

    it('/api/v1/documents/stats (GET) - should get document statistics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/documents/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('draft');
          expect(res.body).toHaveProperty('published');
        });
    });

    it('/api/v1/documents/:id (PATCH) - should update document', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Document Title',
          description: 'Updated description',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', 'Updated Document Title');
        });
    });
  });

  describe('Ingestion (e2e)', () => {
    let ingestionId: string;

    it('/api/v1/ingestion (POST) - should create ingestion process', () => {
      return request(app.getHttpServer())
        .post('/api/v1/ingestion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'document_upload',
          parameters: { batchSize: 100 },
          totalItems: 100,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('type', 'document_upload');
          expect(res.body).toHaveProperty('status', 'pending');
          ingestionId = res.body.id;
        });
    });

    it('/api/v1/ingestion (GET) - should get ingestion processes list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/ingestion')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/api/v1/ingestion/:id/start (POST) - should start ingestion process', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/ingestion/${ingestionId}/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'processing');
          expect(res.body).toHaveProperty('startedAt');
        });
    });

    it('/api/v1/ingestion/stats (GET) - should get ingestion statistics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/ingestion/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('pending');
          expect(res.body).toHaveProperty('processing');
        });
    });
  });
});
