import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Salary grades following the 2024 SSL (Salary Standardization Law)
// Each position with rank maps to exactly one salary grade
const salaryGradesData = [
  // Non-Teaching Staff: Administrative Aides (Salary Grade 1-6)
  { grade: 1, position: "Administrative Aide 1", rank: 1, monthlyRate: 14061, dailyRate: 639.14 },
  { grade: 2, position: "Administrative Aide 2", rank: 2, monthlyRate: 14925, dailyRate: 678.41 },
  { grade: 3, position: "Administrative Aide 3", rank: 3, monthlyRate: 15852, dailyRate: 720.55 },
  { grade: 4, position: "Administrative Aide 4", rank: 4, monthlyRate: 16833, dailyRate: 765.14 },
  { grade: 5, position: "Administrative Aide 5", rank: 5, monthlyRate: 17866, dailyRate: 812.09 },
  { grade: 6, position: "Administrative Aide 6", rank: 6, monthlyRate: 18957, dailyRate: 861.68 },
  
  // Non-Teaching Staff: Administrative Assistants (Salary Grade 7-8)
  { grade: 7, position: "Administrative Assistant 1", rank: 1, monthlyRate: 20110, dailyRate: 914.09 },
  { grade: 8, position: "Administrative Assistant 2", rank: 2, monthlyRate: 21448, dailyRate: 974.91 },
  
  // Non-Teaching Staff: Administrative Officers (Salary Grade 10, 11, 14, 15, 18)
  { grade: 10, position: "Administrative Officer 1", rank: 1, monthlyRate: 25586, dailyRate: 1163.00 },
  { grade: 11, position: "Administrative Officer 2", rank: 2, monthlyRate: 30024, dailyRate: 1364.73 },
  { grade: 14, position: "Administrative Officer 3", rank: 3, monthlyRate: 37024, dailyRate: 1682.91 },
  { grade: 15, position: "Administrative Officer 4", rank: 4, monthlyRate: 40208, dailyRate: 1827.64 },
  { grade: 18, position: "Administrative Officer 5", rank: 5, monthlyRate: 51304, dailyRate: 2332.00 },
  
  // Teaching Personnel: Instructors (Salary Grade 12-14)
  { grade: 12, position: "Instructor 1", rank: 1, monthlyRate: 32245, dailyRate: 1465.68 },
  { grade: 13, position: "Instructor 2", rank: 2, monthlyRate: 34421, dailyRate: 1564.59 },
  { grade: 14, position: "Instructor 3", rank: 3, monthlyRate: 37024, dailyRate: 1682.91 },
  
  // Teaching Personnel: Assistant Professors (Salary Grade 15-18)
  { grade: 15, position: "Assistant Professor 1", rank: 1, monthlyRate: 40208, dailyRate: 1827.64 },
  { grade: 16, position: "Assistant Professor 2", rank: 2, monthlyRate: 43560, dailyRate: 1980.00 },
  { grade: 17, position: "Assistant Professor 3", rank: 3, monthlyRate: 47247, dailyRate: 2147.59 },
  { grade: 18, position: "Assistant Professor 4", rank: 4, monthlyRate: 51304, dailyRate: 2332.00 },
  
  // Teaching Personnel: Associate Professors (Salary Grade 19-23)
  { grade: 19, position: "Associate Professor 1", rank: 1, monthlyRate: 56390, dailyRate: 2563.18 },
  { grade: 20, position: "Associate Professor 2", rank: 2, monthlyRate: 62967, dailyRate: 2862.14 },
  { grade: 21, position: "Associate Professor 3", rank: 3, monthlyRate: 70103, dailyRate: 3186.50 },
  { grade: 22, position: "Associate Professor 4", rank: 4, monthlyRate: 78162, dailyRate: 3552.82 },
  { grade: 23, position: "Associate Professor 5", rank: 5, monthlyRate: 87315, dailyRate: 3968.86 },
  
  // Teaching Personnel: Professors (Salary Grade 24-29)
  { grade: 24, position: "Professor 1", rank: 1, monthlyRate: 98185, dailyRate: 4462.95 },
  { grade: 25, position: "Professor 2", rank: 2, monthlyRate: 111727, dailyRate: 5078.50 },
  { grade: 26, position: "Professor 3", rank: 3, monthlyRate: 126252, dailyRate: 5738.73 },
  { grade: 27, position: "Professor 4", rank: 4, monthlyRate: 142663, dailyRate: 6484.68 },
  { grade: 28, position: "Professor 5", rank: 5, monthlyRate: 160469, dailyRate: 7294.05 },
  { grade: 29, position: "Professor 6", rank: 6, monthlyRate: 180492, dailyRate: 8204.18 },
]

async function seedSalaryGrades() {
  console.log('🌱 Seeding salary grades...')
  
  try {
    // Clear existing salary grades
    await prisma.salaryGrade.deleteMany({})
    console.log('  ✓ Cleared existing salary grades')
    
    // Insert new salary grades
    for (const data of salaryGradesData) {
      const positionLabel = `${data.position} ${data.rank}`
      const description = `${positionLabel} (Salary Grade ${data.grade}) - ₱${data.monthlyRate.toLocaleString()}/month`
      
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
