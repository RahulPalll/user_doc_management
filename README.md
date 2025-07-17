# 🚀 Document Management & RAG-based Q&A System

> **Enterprise-grade NestJS backend with comprehensive document management, user authentication, and intelligent processing workflows**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-007ACC?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0+-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-200/200_Passing-4CAF50?style=for-the-badge&logo=jest)](#testing)
[![Coverage](https://img.shields.io/badge/Coverage-72.29%25-green?style=for-the-badge)](#testing)

## 📋 Table of Contents
- [🎯 Overview](#-overview)
- [⚡ Quick Start](#-quick-start)
- [🏗️ Architecture](#️-architecture)
- [🔌 API Endpoints](#-api-endpoints)
- [🧪 Testing](#-testing)
- [🗄️ Database](#️-database)
- [🚀 Deployment](#-deployment)
- [📊 Performance](#-performance)

## 🎯 Overview

A **production-ready NestJS backend** designed for document management and RAG-based Q&A applications. Features robust authentication, role-based access control, comprehensive document processing, and scalable architecture patterns.

### ✨ Key Features

- **🔐 Advanced Authentication**: JWT with refresh tokens + role-based permissions (Admin/Editor/Viewer)
- **📄 Document Management**: Upload, storage, metadata extraction, and secure access control
- **⚙️ Process Orchestration**: Intelligent ingestion workflows with real-time status tracking
- **👥 User Administration**: Complete user lifecycle management with advanced permissions
- **🏥 System Monitoring**: Health checks, metrics, and diagnostic endpoints
- **📖 Interactive Documentation**: Auto-generated Swagger/OpenAPI with live testing

## ⚡ Quick Start

### 🐳 Docker Setup (Recommended)
```bash
# Clone and start all services
git clone <repository-url>
cd JKT_assignment
docker-compose up -d

# Verify deployment
curl http://localhost:3000/api/v1/health
```

### 🔧 Local Development
```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env  # Configure your database credentials

# 3. Start development server
npm run start:dev

# 4. Seed sample data (optional)
npm run seed:medium  # Creates 50 users, 500 documents, 25 processes
```

### 🎯 Access Points
- **API Base**: `http://localhost:3000/api/v1`
- **Documentation**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/api/v1/health`

## 🏗️ Architecture

### 📁 Project Structure
```
src/
├── 🔐 auth/           # JWT authentication & role-based authorization
├── 👥 users/          # User management with CRUD operations
├── 📄 documents/      # Document upload, storage & metadata
├── ⚙️ ingestion/      # Process workflows & status tracking
├── 🏥 health/         # System monitoring & diagnostics
├── 🔧 common/         # Shared utilities, guards & decorators
├── 🗄️ database/       # TypeORM entities, migrations & seeds
└── ⚙️ config/         # Application configuration modules
```

### 🛠️ Technology Stack

<div align="center">

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | NestJS + TypeScript | Scalable, type-safe backend architecture |
| **Database** | PostgreSQL + TypeORM | Robust persistence with ORM abstractions |
| **Authentication** | JWT + Passport | Stateless authentication with role-based access |
| **Validation** | class-validator | Request validation & data transformation |
| **Documentation** | Swagger/OpenAPI | Auto-generated interactive API docs |
| **Testing** | Jest | Comprehensive unit & integration testing |
| **Containerization** | Docker + Docker Compose | Consistent deployment environments |

</div>

### 🔄 Core Workflows

```mermaid
graph LR
    A[Client Request] --> B[Auth Guard]
    B --> C[Role Guard] 
    C --> D[Controller]
    D --> E[Service Layer]
    E --> F[Database]
    F --> G[Response]
    
    style B fill:#ff6b6b
    style C fill:#4ecdc4
    style D fill:#45b7d1
    style E fill:#96ceb4
    style F fill:#feca57
```

## 🔌 API Endpoints

### 🔐 Authentication Flow
```bash
# 1. Register new user
POST /api/v1/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

# 2. Login & obtain tokens
POST /api/v1/auth/login
{
  "usernameOrEmail": "john_doe",
  "password": "SecurePass123!"
}
# Response: { access_token, refresh_token, user }

# 3. Access protected resources
Authorization: Bearer <access_token>
```

### 📊 Endpoint Overview

<details>
<summary><strong>🔐 Authentication Module</strong></summary>

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/v1/auth/register` | User registration | Public |
| `POST` | `/api/v1/auth/login` | User authentication | Public |
| `GET` | `/api/v1/auth/profile` | User profile data | JWT Required |
| `POST` | `/api/v1/auth/refresh` | Token refresh | Refresh Token |

</details>

<details>
<summary><strong>👥 User Management</strong></summary>

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/v1/users` | List all users | Admin Only |
| `GET` | `/api/v1/users/:id` | Get user details | JWT + Owner/Admin |
| `PATCH` | `/api/v1/users/:id` | Update user | JWT + Owner/Admin |
| `GET` | `/api/v1/users/stats` | User statistics | Admin Only |

</details>

<details>
<summary><strong>📄 Document Management</strong></summary>

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/v1/documents` | Upload document | JWT Required |
| `GET` | `/api/v1/documents` | List documents | JWT Required |
| `GET` | `/api/v1/documents/:id` | Get document | JWT + Access Control |
| `PATCH` | `/api/v1/documents/:id` | Update metadata | JWT + Owner/Admin |
| `GET` | `/api/v1/documents/stats` | Document statistics | Admin Only |

</details>

<details>
<summary><strong>⚙️ Process Management</strong></summary>

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/v1/ingestion` | Create process | JWT Required |
| `GET` | `/api/v1/ingestion` | List processes | JWT Required |
| `POST` | `/api/v1/ingestion/:id/start` | Start process | JWT + Owner/Admin |
| `GET` | `/api/v1/ingestion/stats` | Process statistics | Admin Only |

</details>

### 🛡️ Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **🔴 Admin** | Full system access • User management • All CRUD operations • System statistics |
| **🟡 Editor** | Document management • Process workflows • Own profile management |
| **🟢 Viewer** | Read-only document access • Own profile viewing • Basic system usage |

## 🧪 Testing

### 🎯 Test Results Summary

<div align="center">

| Test Type | Results | Coverage |
|-----------|---------|----------|
| **Unit Tests** | ✅ 181/181 Passing | 72.29% |
| **E2E Tests** | ✅ 19/19 Passing | All Endpoints |
| **Integration** | ✅ 27/27 Suites | All Modules |
| **Total** | ✅ 200/200 Passing | Production Ready |

</div>

### 🚀 Running Tests
```bash
# Full test suite
npm run test              # Unit tests (181 tests)
npm run test:e2e          # E2E integration (19 tests)
npm run test:cov          # Coverage report (72.29%)

# Specific test types
npm test -- --testPathPattern="controller"  # Controller tests
npm test -- --testPathPattern="service"     # Service tests
npm test -- --watch                         # Watch mode
```

### 📊 Coverage Breakdown
- **Authentication & Security**: 97.67% (JWT, Guards, Strategies)
- **Document Management**: 92.72% (Upload, Storage, Metadata)
- **User Management**: 94.73% (CRUD, Roles, Permissions)
- **Process Workflows**: 71.52% (Ingestion, Status Tracking)
- **System Health**: 100% (Monitoring, Diagnostics)

### ✅ Test Categories
- **🔐 Security Tests**: Authentication flows, role validation, unauthorized access
- **📄 Business Logic**: Document processing, user operations, workflow management
- **🔗 Integration**: Database operations, API endpoints, service interactions
- **⚡ Performance**: Response times, concurrent operations, error handling

## 🗄️ Database

### 📊 Entity Design
```sql
-- Core Entities with Optimized Relationships
Users (
  id UUID PRIMARY KEY,
  username VARCHAR UNIQUE,
  email VARCHAR UNIQUE,
  role UserRole (ADMIN|EDITOR|VIEWER),
  status UserStatus (ACTIVE|INACTIVE|SUSPENDED),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

Documents (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  filename VARCHAR NOT NULL,
  metadata JSONB,
  created_by_id UUID REFERENCES Users(id),
  created_at TIMESTAMP
);

IngestionProcesses (
  id UUID PRIMARY KEY,
  type ProcessType,
  status ProcessStatus (PENDING|RUNNING|COMPLETED|FAILED),
  initiated_by_id UUID REFERENCES Users(id),
  created_at TIMESTAMP
);
```

### 🎲 Data Seeding
```bash
# Available seeding configurations
npm run seed:basic     # 3 users, 5 documents, 2 processes
npm run seed:medium    # 50 users, 500 documents, 25 processes  
npm run seed:large     # 500 users, 5000 documents, 250 processes
```

### 🔧 Features
- **UUID Primary Keys**: Distributed-system ready identifiers
- **JSON Metadata**: Flexible document properties storage
- **Enum Constraints**: Data consistency for roles and statuses
- **Optimized Indexes**: Performance for common query patterns
- **Foreign Key Relations**: Referential integrity across entities

## 🚀 Deployment

### 🐳 Docker Production
```bash
# Build and deploy
docker-compose up -d

# Scale services (if needed)
docker-compose up -d --scale app=3

# Health check
curl http://localhost:3000/api/v1/health
```

### ⚙️ Environment Configuration
```env
# Core Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DB_NAME=document_management

# JWT Security
JWT_SECRET=your-super-secure-256-bit-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10MB
ALLOWED_FILE_TYPES=pdf,doc,docx,txt
```

### 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start:prod` | Production server |
| `npm run build` | Build for production |
| `npm run start:dev` | Development with hot reload |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Start Docker containers |
| `npm run seed:medium` | Populate with test data |

## 📊 Performance

### ⚡ Metrics & Benchmarks

<div align="center">

| Metric | Performance | Target |
|--------|-------------|--------|
| **Response Time** | < 100ms | ✅ Achieved |
| **Memory Usage** | < 256MB | ✅ Efficient |
| **Database Queries** | Optimized | ✅ Indexed |
| **Concurrent Users** | 100+ | ✅ Scalable |
| **Test Success Rate** | 100% | ✅ Reliable |

</div>

### 🔧 Optimizations
- **Connection Pooling**: PostgreSQL connection management
- **Query Optimization**: TypeORM with proper indexing
- **Caching Strategy**: In-memory caching for frequent operations
- **Compression**: GZIP response compression
- **Security**: Rate limiting and request validation

### 📈 Scalability Features
- **Stateless Design**: JWT-based authentication
- **Database Optimization**: Indexed queries and pagination
- **Modular Architecture**: Independent service scaling
- **Docker Ready**: Containerized deployment
- **Health Monitoring**: Real-time system diagnostics

---

<div align="center">

**🚀 Built with NestJS, TypeScript, and PostgreSQL for enterprise-grade performance and reliability**

[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg?style=for-the-badge)](https://nestjs.com/)
[![Production Ready](https://img.shields.io/badge/Production-Ready-green.svg?style=for-the-badge)](https://github.com)

</div>
