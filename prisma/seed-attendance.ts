import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAttendance() {
  try {
    console.log('⚠️  Attendance seeding is disabled.')
    console.log('✅ Please import attendance data via CSV or use the attendance system.')
  } catch (error) {
    console.error('❌ Error in attendance seed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedAttendance() 