// Simple test script to debug the attendance API
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAttendanceAPI() {
  try {
    console.log('Testing database connection...')
    
    // Test basic user query
    const users = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      take: 1
    })
    console.log('Found users:', users.length)
    
    if (users.length === 0) {
      console.log('No employees found in database')
      return
    }
    
    const testUser = users[0]
    console.log('Test user:', testUser.firstName, testUser.lastName)
    
    // Test system settings
    console.log('\nTesting system settings...')
    const systemConfigs = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: [
            'working_hours_dailyHours',
            'working_hours_lateGraceMinutes'
          ]
        }
      }
    })
    console.log('System configs found:', systemConfigs)
    
    // Test attendance record query
    console.log('\nTesting attendance record query...')
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)
    
    const attendanceRecord = await prisma.attendanceRecord.findFirst({
      where: {
        userId: testUser.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })
    console.log('Today\'s attendance record:', attendanceRecord)
    
    // Test holiday query
    console.log('\nTesting holiday query...')
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)
    
    const todayHoliday = await prisma.holiday.findFirst({
      where: {
        date: {
          gte: today,
          lte: endOfToday
        }
      }
    })
    console.log('Today\'s holiday:', todayHoliday)
    
    console.log('\nAll tests completed successfully!')
    
  } catch (error) {
    console.error('Error in test:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
  } finally {
    await prisma.$disconnect()
  }
}

testAttendanceAPI()
