# BISU Payroll Management System

A modern, secure payroll management system built for Bohol Island State University (BISU) using Next.js, Prisma, and PostgreSQL.

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Role-Based Access Control**: Separate admin and employee dashboards
- **User Management**: Add users individually or bulk import via CSV
- **CSV Bulk Import**: Import multiple employees at once with validation
- **Database-Driven**: PostgreSQL with Prisma ORM for robust data management
- **Modern UI**: Beautiful, responsive design with Tailwind CSS and Radix UI
- **Real-time Updates**: Live session management and automatic route protection
- **Type-Safe**: Full TypeScript implementation for enhanced developer experience

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with HTTP-only cookies
- **Styling**: Tailwind CSS with custom BISU branding
- **UI Components**: Radix UI with custom theme
- **Password Security**: bcryptjs for hashing
- **Form Validation**: Zod schema validation

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database server
- npm or yarn package manager

## ⚙️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd payroll-system-bisu
npm install
```

### 2. Database Setup

1. **Create PostgreSQL Database**:
   ```sql
   CREATE DATABASE bisu_payroll;
   ```

2. **Configure Environment Variables**:
   ```bash
   cp env.example .env
   ```

3. **Edit `.env` file** with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/bisu_payroll?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-here"
   NEXTAUTH_SECRET="your-nextauth-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

### 3. Database Migration & Seeding

```bash
# Generate Prisma client
npm run db:generate

# Create database tables
npm run db:migrate

# Seed with initial data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🔐 Default Credentials

After seeding, you can log in with these test accounts:

### Admin Account
- **Email**: `admin@bisu.edu.ph`
- **Password**: `password123`

### Employee Accounts
- **Email**: `juan.delacruz@bisu.edu.ph` | **Password**: `password123`
- **Email**: `maria.santos@bisu.edu.ph` | **Password**: `password123`
- **Email**: `jose.reyes@bisu.edu.ph` | **Password**: `password123`
- **Email**: `ana.garcia@bisu.edu.ph` | **Password**: `password123`
- **Email**: `carlos.martinez@bisu.edu.ph` | **Password**: `password123`

⚠️ **Important**: Change these default passwords in production!

## 📁 Project Structure

```
payroll-system-bisu/
├── app/                    # Next.js App Router
│   ├── (auth)/
│   │   └── login/         # Login page
│   ├── admin/             # Admin dashboard pages
│   ├── employee/          # Employee dashboard pages
│   └── api/auth/          # Authentication API routes
├── components/            # Reusable UI components
├── contexts/              # React contexts (Auth)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── auth.ts           # Authentication utilities
│   └── database.ts       # Prisma client configuration
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeder
└── middleware.ts         # Route protection middleware
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Route Protection**: Middleware-based route guarding
- **Role-Based Access**: Admin/Employee permission separation
- **Token Expiration**: 7-day token lifetime with auto-refresh

## 🗄️ Database Schema

### Users Table
- User authentication and profile information
- Role-based permissions (ADMIN/EMPLOYEE)
- Employment status tracking
- Emergency contact details

### Attendance Records
- Time-in/time-out tracking
- Hours worked calculation
- Late/absent status tracking

### Payroll Records
- Pay period management
- Salary calculations with overtime
- Deductions and bonuses
- Payment status tracking

### System Settings
- Configurable system parameters
- Company information
- Payroll rules and rates

## � Bulk User Import

The system supports importing multiple employees at once using CSV files.

### Quick Start

1. Navigate to **Admin > Users**
2. Click **Bulk Import** button
3. Download the CSV template
4. Fill in your employee data
5. Upload the CSV file
6. Review and import

### Documentation

- **Detailed Guide**: See [Employee CSV Import Guide](docs/EMPLOYEE_CSV_IMPORT_GUIDE.md)
- **Sample CSV**: Use [sample_employee_import.csv](docs/sample_employee_import.csv) as reference

### CSV Format

Required columns (in order):
```
firstName,lastName,email,password,department,position,status,phone,employeeId,hireDate,address,emergencyContactName,emergencyContactRelationship,emergencyContactPhone
```

**Key Points**:
- Required fields: firstName, lastName, email, password, employeeId
- Status must be: PERMANENT, TEMPORARY, or CONTRACTUAL
- Date format: YYYY-MM-DD
- Email and employeeId must be unique

## �🚀 Deployment

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="secure-random-jwt-secret"
NEXTAUTH_SECRET="secure-random-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

### Build and Deploy

```bash
npm run build
npm start
```

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with initial data

## 🔧 Development

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma`
2. **API Routes**: Add to `app/api/` directory
3. **Pages**: Add to appropriate `app/` subdirectory
4. **Components**: Add to `components/` directory
5. **Utilities**: Add to `lib/` directory

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database (development only)
npx prisma migrate reset
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database exists

2. **Authentication Not Working**:
   - Verify JWT_SECRET is set
   - Clear browser cookies
   - Check if user exists in database

3. **Build Errors**:
   - Run `npm run db:generate` after schema changes
   - Clear `.next` folder and rebuild

## 📄 License

This project is developed for Bohol Island State University - Balilihan Campus.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Developed with ❤️ for BISU Balilihan Campus** 