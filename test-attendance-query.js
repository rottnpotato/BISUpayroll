const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAttendanceQuery() {
  try {
    console.log('Testing attendance query...')
    
    const records = await prisma.attendanceRecord.findMany({
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            position: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      },
      orderBy: { date: "desc" }
    })
    
    console.log('Query successful! Records found:', records.length)
    console.log('Sample record:', JSON.stringify(records[0], null, 2))
    
  } catch (error) {
    console.error('Error details:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAttendanceQuery() 