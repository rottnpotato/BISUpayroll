import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPayrollConfiguration() {
  console.log('🌱 Seeding payroll configuration...')
  console.log('⚠️  No default payroll data will be seeded.')
  console.log('✅ Please configure payroll settings, rules, holidays, and schedules via the admin dashboard.')
}

async function main() {
  try {
    await seedPayrollConfiguration()
    console.log('🎉 Payroll configuration seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding payroll configuration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

export default main
