# TurboVets - Secure Task Management System

A comprehensive, secure task management system built with **NX monorepo**, featuring **Role-Based Access Control (RBAC)**, **JWT authentication**, and **organization-wide task visibility**.

## 🏗️ Architecture Overview

### NX Monorepo Structure
```
turbovets/
├── apps/
│   ├── api/                 # NestJS Backend API
│   ├── dashboard/           # Angular Frontend
│   ├── api-e2e/            # API End-to-End Tests
│   └── dashboard-e2e/      # Dashboard E2E Tests
├── libs/
│   ├── auth/               # Shared RBAC logic & decorators
│   └── data/               # Shared TypeScript interfaces & DTOs
└── dist/                   # Built applications
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL (optional, SQLite used by default)

### Installation & Setup

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd turbovets
npm install
```

2. **Environment Configuration**
Create `.env` file in the root directory:
```env
# Database
DATABASE_URL=sqlite:./data/database.sqlite

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m

# API Configuration
API_PORT=3000
API_HOST=localhost

# Frontend Configuration
NG_APP_API_URL=http://localhost:3000
```

3. **Start Development Servers**
```bash
# Start both API and Dashboard concurrently
npm run dev

# Or start individually:
npm run start:api      # Backend on http://localhost:3000
npm run start:dashboard # Frontend on http://localhost:4200
```

## 🔐 Access Control Implementation

### Role-Based Access Control (RBAC)

#### Role Hierarchy
```
Owner (Highest)
├── Can access everything
├── Can delete any task
├── Can move tasks between departments
└── Can view all audit logs

Admin
├── Can edit all tasks
├── Cannot delete tasks (except own)
├── Can view department audit logs
└── Can manage department tasks

Viewer
├── Can edit personal tasks they created
├── Can view all tasks (organization-wide)
├── Cannot delete tasks (except own personal)
└── Limited audit log access
```

### JWT Authentication Flow
1. **Login**: User provides credentials
2. **Token Generation**: JWT access token (15min) + refresh token (7 days)
3. **Request Authorization**: Bearer token in Authorization header
4. **Token Validation**: JWT strategy validates and extracts user info
5. **Role Checking**: Guards verify permissions for each endpoint

## 📡 API Documentation

### Authentication Endpoints

#### POST `/auth/login`
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

#### POST `/auth/register`
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123"
}
```

### Task Management Endpoints

#### GET `/tasks`
**Headers:** `Authorization: Bearer <token>`

#### POST `/tasks`
```json
{
  "title": "New Task",
  "description": "Task description",
  "priority": "medium",
  "status": "to-do",
  "category": "work",
  "department": "Engineering"
}
```

#### PUT `/tasks/:id`
#### DELETE `/tasks/:id`
#### POST `/tasks/bulk/delete`
#### POST `/tasks/bulk-update-status`

### Audit Log Endpoints

#### GET `/audit-log`
**Headers:** `Authorization: Bearer <token>` (Owner/Admin only)

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run API tests only
npm run test:api

# Run Dashboard tests only
npm run test:dashboard

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## 🎨 Frontend Features

### Task Management Dashboard
- **Organization-wide Task View**: All authenticated users can see all tasks
- **Real-time Updates**: Automatic task refresh every minute
- **Advanced Filtering**: By status, priority, category, department
- **Bulk Operations**: Bulk delete and status updates
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Authentication UI
- **Login/Register Forms**: Clean, accessible forms
- **JWT Token Management**: Automatic token refresh
- **Route Protection**: Authenticated routes only

### State Management (NgRx)
- **Actions**: Task CRUD, filtering, sorting
- **Reducers**: State management for tasks and auth
- **Effects**: API communication and side effects
- **Selectors**: Efficient data selection

## 🔧 Development

### Available Scripts
```bash
npm run dev              # Start both API and Dashboard
npm run start:api        # Start API server only
npm run start:dashboard  # Start Dashboard only
npm run build            # Build all applications
npm run lint             # Lint all code
```

## 🚀 Production Deployment

### Environment Variables
```env
# Production Database
DATABASE_URL=postgresql://user:password@prod-db:5432/turbovets

# Secure JWT Secret
JWT_SECRET=your-production-secret-key-here

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
```

### Build for Production
```bash
npm run build:production
```

## 🔮 Future Considerations

### Advanced Features
- **Role Delegation**: Temporary role assignment
- **Advanced Permissions**: Granular permission system
- **Multi-tenancy**: Support for multiple organizations
- **Real-time Collaboration**: WebSocket-based live updates

### Security Enhancements
- **JWT Refresh Tokens**: Secure token renewal
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API request throttling
- **RBAC Caching**: Redis-based permission caching

---

**Built with ❤️ using NX, NestJS, Angular, and TypeScript**
