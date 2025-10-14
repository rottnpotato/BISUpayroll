---
description: Repository Information Overview
alwaysApply: true
---

# BISU Payroll Management System Information

## Summary
A modern, secure payroll management system built for Bohol Island State University (BISU) using Next.js, Prisma, and PostgreSQL. The system provides role-based access control with separate admin and employee dashboards, secure authentication, and comprehensive payroll management features.

## Structure
- **app/**: Next.js App Router with auth, admin, and employee sections
- **components/**: Reusable UI components including Radix UI implementations
- **contexts/**: React contexts for authentication and state management
- **hooks/**: Custom React hooks for auth, mobile detection, and notifications
- **lib/**: Utility functions for authentication, database, and payroll calculations
- **prisma/**: Database schema, migrations, and seed scripts
- **public/**: Static assets including logos and images
- **styles/**: Global CSS and styling configurations

## Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5.x with ES6 target
**Framework**: Next.js 15.2.4, React 19
**Build System**: Next.js build system
**Package Manager**: pnpm 9.x

## Dependencies
**Main Dependencies**:
- Next.js 15.2.4 (React framework)
- React 19 (UI library)
- Prisma 5.22.0 (ORM for PostgreSQL)
- jose 6.0.11 (JWT authentication)
- bcryptjs 2.4.3 (Password hashing)
- Radix UI components (UI component library)
- Tailwind CSS (Utility-first CSS framework)
- zod 3.24.1 (Schema validation)
- docxtemplater 3.44.0 (Document generation)
- libreoffice-convert 1.5.1 (PDF conversion)

**Development Dependencies**:
- TypeScript 5.x
- ESLint 9.x
- Prisma CLI
- tsx 4.19.2 (TypeScript execution)

## Build & Installation
```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm run db:generate

# Run database migrations
pnpm run db:migrate

# Seed the database
pnpm run db:seed

# Development server
pnpm run dev

# Production build
pnpm run build
pnpm run start
```

## Docker
**Dockerfile**: Uses Node.js 22 with pnpm for development
**Image**: node:22-bookworm-slim
**Configuration**: Development-focused with volume mounts for hot reloading
**Docker Compose**: Includes PostgreSQL database and application services
**Run Command**:
```bash
docker-compose up
```

## Database
**Type**: PostgreSQL
**ORM**: Prisma 5.22.0
**Schema**: Comprehensive data model for users, attendance, payroll, and system settings
**Models**: User, AttendanceRecord, PayrollRecord, PayrollResult, LeaveRequest, and more
**Migrations**: Managed through Prisma migrations

## Authentication
**Method**: JWT tokens with HTTP-only cookies
**Library**: jose for JWT operations
**Password Security**: bcryptjs with 12 salt rounds
**Token Expiration**: 1-day token lifetime

## Testing
No formal testing framework configured in the project.

## Main Entry Points
**Application**: app/layout.tsx (Root layout)
**API Routes**: app/api/ directory
**Authentication**: lib/auth.ts and contexts/auth-context.tsx
**Database**: lib/database.ts (Prisma client configuration)