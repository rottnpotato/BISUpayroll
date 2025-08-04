import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleAuditLogs = [
  {
    userId: null, // System actions
    action: 'system_start',
    entityType: 'System',
    entityId: null,
    details: 'Payroll system initialized successfully',
    ipAddress: '127.0.0.1',
    userAgent: 'System/Internal',
    createdAt: new Date()
  }
]

async function seedAuditLogs() {
  try {
    console.log('🌱 Seeding audit logs...')
    
    // Get the first admin user to associate some logs with
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.log('⚠️  No admin user found. Creating logs without user association.')
    }

    // Create audit logs
    for (const logData of sampleAuditLogs) {
      // Associate some logs with the admin user (except system logs)
      const auditData = {
        ...logData,
        userId: logData.userId === null ? null : (adminUser?.id || null)
      }

      await prisma.auditLog.create({
        data: auditData
      })
    }

    console.log(`✅ Successfully seeded ${sampleAuditLogs.length} audit log entry`)
  } catch (error) {
    console.error('❌ Error seeding audit logs:', error)
  }
}

export { seedAuditLogs }

// Run if called directly
if (require.main === module) {
  seedAuditLogs()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
