import { PrismaClient, Role, EmploymentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Hash the default password
  const defaultPassword = 'password123'
  const hashedPassword = await bcrypt.hash(defaultPassword, 12)

  // Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bisu.edu.ph' },
    update: {},
    create: {
      email: 'admin@bisu.edu.ph',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.ADMIN,
      status: EmploymentStatus.ACTIVE,
      employeeId: 'ADMIN001',
      department: 'Information Technology',
      position: 'System Administrator',
      hireDate: new Date('2024-01-01'),
      salary: 50000.00,
      phone: '+63 38 123 4567',
      address: 'BISU Balilihan Campus, Balilihan, Bohol',
      emergencyContactName: 'IT Department Head',
      emergencyContactRelationship: 'Supervisor',
      emergencyContactPhone: '+63 38 123 4568',
    },
  })

  // Create Sample Employee Users
  const employees = [
    {
      email: 'juan.delacruz@bisu.edu.ph',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      employeeId: 'EMP001',
      department: 'Faculty',
      position: 'Assistant Professor',
      salary: 35000.00,
    },
    {
      email: 'maria.santos@bisu.edu.ph',
      firstName: 'Maria',
      lastName: 'Santos',
      employeeId: 'EMP002',
      department: 'Administration',
      position: 'Administrative Assistant',
      salary: 25000.00,
    },
    {
      email: 'jose.reyes@bisu.edu.ph',
      firstName: 'Jose',
      lastName: 'Reyes',
      employeeId: 'EMP003',
      department: 'Faculty',
      position: 'Associate Professor',
      salary: 40000.00,
    },
    {
      email: 'ana.garcia@bisu.edu.ph',
      firstName: 'Ana',
      lastName: 'Garcia',
      employeeId: 'EMP004',
      department: 'Human Resources',
      position: 'HR Specialist',
      salary: 30000.00,
    },
    {
      email: 'carlos.martinez@bisu.edu.ph',
      firstName: 'Carlos',
      lastName: 'Martinez',
      employeeId: 'EMP005',
      department: 'Maintenance',
      position: 'Facilities Manager',
      salary: 28000.00,
    },
  ]

  for (const employee of employees) {
    await prisma.user.upsert({
      where: { email: employee.email },
      update: {},
      create: {
        email: employee.email,
        password: hashedPassword,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: Role.EMPLOYEE,
        status: EmploymentStatus.ACTIVE,
        employeeId: employee.employeeId,
        department: employee.department,
        position: employee.position,
        hireDate: new Date('2024-01-15'),
        salary: employee.salary,
        phone: '+63 912 345 6789',
        address: 'Balilihan, Bohol',
        emergencyContactName: 'Emergency Contact',
        emergencyContactRelationship: 'Family',
        emergencyContactPhone: '+63 912 345 6790',
      },
    })
  }

  // Create System Settings
  const systemSettings = [
    { key: 'company_name', value: 'Bohol Island State University' },
    { key: 'system_title', value: 'BISU Payroll Management System' },
    { key: 'admin_email', value: 'admin@bisu.edu.ph' },
    { key: 'contact_number', value: '+63 38 123 4567' },
    { key: 'system_address', value: 'CPG North Avenue, Tagbilaran City, Bohol' },
    { key: 'system_active', value: 'true' },
    { key: 'currency', value: 'PHP' },
    { key: 'working_hours_per_day', value: '8' },
    { key: 'overtime_rate_multiplier', value: '1.25' },
  ]

  for (const setting of systemSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  console.log('✅ Database seeding completed successfully!')
  console.log('📋 Default credentials created:')
  console.log('   👤 Admin: admin@bisu.edu.ph / password123')
  console.log('   👤 Employee: juan.delacruz@bisu.edu.ph / password123')
  console.log('   👤 Employee: maria.santos@bisu.edu.ph / password123')
  console.log('   👤 Employee: jose.reyes@bisu.edu.ph / password123')
  console.log('   👤 Employee: ana.garcia@bisu.edu.ph / password123')
  console.log('   👤 Employee: carlos.martinez@bisu.edu.ph / password123')
  console.log('')
  console.log('🔑 All users have the default password: password123')
  console.log('⚠️  Please change these passwords in production!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  }) 