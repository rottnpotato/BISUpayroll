import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleAuditLogs = [
  {
    userId: null, // System actions
    action: 'system_start',
    entityType: 'System',
    entityId: null,
    details: 'Payroll system started successfully',
    ipAddress: '127.0.0.1',
    userAgent: 'System/Internal',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    action: 'login',
    entityType: 'Auth',
    details: 'Admin user logged in successfully',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    action: 'create',
    entityType: 'User',
    details: 'New employee John Doe was created',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000) // 20 hours ago
  },
  {
    action: 'update',
    entityType: 'User',
    details: 'Employee profile updated - salary information modified',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000) // 15 hours ago
  },
  {
    action: 'create',
    entityType: 'Attendance',
    details: 'Attendance record created for employee check-in',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
  },
  {
    action: 'process',
    entityType: 'Payroll',
    details: 'Monthly payroll processed for all active employees',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
  },
  {
    action: 'approve',
    entityType: 'Leave',
    details: 'Leave request approved for vacation leave',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
  },
  {
    action: 'export',
    entityType: 'Reports',
    details: 'Payroll report exported to PDF format',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    action: 'delete',
    entityType: 'User',
    details: 'Terminated employee record archived',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
  },
  {
    action: 'view',
    entityType: 'Reports',
    details: 'Attendance summary report accessed',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
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

    console.log(`✅ Successfully seeded ${sampleAuditLogs.length} audit log entries`)
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
