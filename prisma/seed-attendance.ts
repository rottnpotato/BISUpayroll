import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAttendance() {
  try {
    // First, check if there are any users
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      take: 5
    })

    if (users.length === 0) {
      console.log('No users found. Please seed users first.')
      return
    }

    console.log(`Found ${users.length} users, creating attendance records...`)

    // Create attendance records for the last 7 days
    const attendanceRecords = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      for (const user of users) {
        // Skip some days randomly to simulate absences
        if (Math.random() < 0.1) continue

        const timeInHour = 8 + Math.floor(Math.random() * 2) // 8-9 AM
        const timeInMinute = Math.floor(Math.random() * 60)
        const timeIn = new Date(date)
        timeIn.setHours(timeInHour, timeInMinute, 0, 0)

        const timeOutHour = 17 + Math.floor(Math.random() * 2) // 5-6 PM
        const timeOutMinute = Math.floor(Math.random() * 60)
        const timeOut = new Date(date)
        timeOut.setHours(timeOutHour, timeOutMinute, 0, 0)

        const hoursWorked = (timeOut.getTime() - timeIn.getTime()) / (1000 * 60 * 60)
        const isLate = timeInHour > 8 || (timeInHour === 8 && timeInMinute > 0)

        attendanceRecords.push({
          userId: user.id,
          date: date,
          timeIn: timeIn,
          timeOut: timeOut,
          hoursWorked: hoursWorked,
          isLate: isLate,
          isAbsent: false
        })
      }
    }

    console.log(`Creating ${attendanceRecords.length} attendance records...`)

    // Use createMany for better performance
    await prisma.attendanceRecord.createMany({
      data: attendanceRecords,
      skipDuplicates: true
    })

    console.log('✅ Attendance records seeded successfully!')

  } catch (error) {
    console.error('❌ Error seeding attendance data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedAttendance() 