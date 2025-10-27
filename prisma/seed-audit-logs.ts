import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleAuditLogs: any[] = []

async function seedAuditLogs() {
  try {
    console.log('⚠️  Audit log seeding is disabled.')
    console.log('✅ Audit logs will be generated automatically by system events.')
  } catch (error) {
    console.error('❌ Error in audit log seed:', error)
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
