import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const salaryGradesData = [
  // Instructors
  { grade: 12, position: "Instructor", rank: 1, monthlyRate: 32245, dailyRate: 1465.68 },
  { grade: 13, position: "Instructor", rank: 2, monthlyRate: 34421, dailyRate: 1564.59 },
  { grade: 14, position: "Instructor", rank: 3, monthlyRate: 37024, dailyRate: 1682.91 },
  
  // Assistant Professors
  { grade: 15, position: "Assistant Professor", rank: 1, monthlyRate: 40208, dailyRate: 1827.64 },
  { grade: 16, position: "Assistant Professor", rank: 2, monthlyRate: 43560, dailyRate: 1980.00 },
  { grade: 17, position: "Assistant Professor", rank: 3, monthlyRate: 47247, dailyRate: 2147.59 },
  { grade: 18, position: "Assistant Professor", rank: 4, monthlyRate: 51304, dailyRate: 2332.00 },
  
  // Associate Professors
  { grade: 19, position: "Associate Professor", rank: 1, monthlyRate: 56390, dailyRate: 2563.18 },
  { grade: 20, position: "Associate Professor", rank: 2, monthlyRate: 62967, dailyRate: 2862.14 },
  { grade: 21, position: "Associate Professor", rank: 3, monthlyRate: 70103, dailyRate: 3186.50 },
  { grade: 22, position: "Associate Professor", rank: 4, monthlyRate: 78162, dailyRate: 3552.82 },
  { grade: 23, position: "Associate Professor", rank: 5, monthlyRate: 87315, dailyRate: 3968.86 },
  
  // Professors
  { grade: 24, position: "Professor", rank: 1, monthlyRate: 98185, dailyRate: 4462.95 },
  { grade: 25, position: "Professor", rank: 2, monthlyRate: 111727, dailyRate: 5078.50 },
  { grade: 26, position: "Professor", rank: 3, monthlyRate: 126252, dailyRate: 5738.73 },
  { grade: 27, position: "Professor", rank: 4, monthlyRate: 142663, dailyRate: 6484.68 },
  { grade: 28, position: "Professor", rank: 5, monthlyRate: 160469, dailyRate: 7294.05 },
  { grade: 29, position: "Professor", rank: 6, monthlyRate: 180492, dailyRate: 8204.18 },
]

async function seedSalaryGrades() {
  console.log('🌱 Seeding salary grades...')
  
  try {
    // Clear existing salary grades
    await prisma.salaryGrade.deleteMany({})
    console.log('  ✓ Cleared existing salary grades')
    
    // Insert new salary grades
    for (const data of salaryGradesData) {
      const description = `${data.position} ${data.rank} - Salary Grade ${data.grade} - ₱${data.monthlyRate.toLocaleString('en-US')}/month`
      
      await prisma.salaryGrade.create({
        data: {
          grade: data.grade,
          position: data.position,
          rank: data.rank,
          monthlyRate: data.monthlyRate,
          dailyRate: data.dailyRate,
          description,
          isActive: true,
          effectiveDate: new Date(),
        },
      })
      
      console.log(`  ✓ Created: ${description}`)
    }
    
    console.log(`\n✅ Successfully seeded ${salaryGradesData.length} salary grades`)
  } catch (error) {
    console.error('❌ Error seeding salary grades:', error)
    throw error
  }
}

async function main() {
  await seedSalaryGrades()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
