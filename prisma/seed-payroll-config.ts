import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPayrollConfiguration() {
  console.log('🌱 Seeding payroll configuration...')

  // Seed system settings for payroll configuration
  const payrollSettings = [
    // Working Hours Configuration
    { key: 'working_hours_dailyHours', value: '8' },
    { key: 'working_hours_weeklyHours', value: '40' },
    { key: 'working_hours_lateGraceMinutes', value: '15' },
    { key: 'working_hours_lateDeductionBasis', value: 'fixed' },
    { key: 'working_hours_lateDeductionAmount', value: '50' },

    // Rates Configuration
    { key: 'rates_overtimeRate1', value: '1.25' },
    { key: 'rates_overtimeRate2', value: '1.5' },
    { key: 'rates_nightDifferential', value: '0.10' },
    { key: 'rates_regularHolidayRate', value: '2' },
    { key: 'rates_specialHolidayRate', value: '1.3' },
    { key: 'rates_currency', value: 'PHP' },

    // Leave Benefits Configuration
    { key: 'leave_benefits_vacationLeave', value: '15' },
    { key: 'leave_benefits_sickLeave', value: '15' },
    { key: 'leave_benefits_serviceIncentiveLeave', value: '5' },
    { key: 'leave_benefits_maternityLeave', value: '105' },
    { key: 'leave_benefits_paternityLeave', value: '7' },
  ]

  for (const setting of payrollSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    })
  }

  console.log('✅ System settings seeded')

  // Seed standard payroll rules
  const payrollRules = [
    {
      name: 'Basic Salary',
      type: 'base',
      amount: 25000,
      isPercentage: false,
      isActive: true,
      description: 'Base monthly salary for government employees',
      applyToAll: true
    },
    {
      name: 'SSS Contribution',
      type: 'deduction',
      amount: 580,
      isPercentage: false,
      isActive: true,
      description: 'Social Security System contribution',
      applyToAll: true
    },
    {
      name: 'PhilHealth Contribution',
      type: 'deduction',
      amount: 1.5,
      isPercentage: true,
      isActive: true,
      description: 'Philippine Health Insurance Corporation contribution (1.5% of gross pay)',
      applyToAll: true
    },
    {
      name: 'Pag-IBIG Contribution',
      type: 'deduction',
      amount: 100,
      isPercentage: false,
      isActive: true,
      description: 'Home Development Mutual Fund contribution',
      applyToAll: true
    },
    {
      name: 'Withholding Tax',
      type: 'deduction',
      amount: 8,
      isPercentage: true,
      isActive: true,
      description: 'Income tax withholding (8% of gross pay)',
      applyToAll: true
    },
    {
      name: 'Transportation Allowance',
      type: 'allowance',
      amount: 2000,
      isPercentage: false,
      isActive: true,
      description: 'Monthly transportation allowance',
      applyToAll: true
    },
    {
      name: 'Performance Bonus',
      type: 'bonus',
      amount: 5,
      isPercentage: true,
      isActive: false,
      description: 'Performance-based bonus (5% of gross pay)',
      applyToAll: false
    }
  ]

  for (const rule of payrollRules) {
    await prisma.payrollRule.upsert({
      where: { name: rule.name },
      update: rule,
      create: rule
    })
  }

  console.log('✅ Payroll rules seeded')

  // Seed Philippine holidays for 2025
  const holidays2025 = [
    { name: "New Year's Day", date: new Date('2025-01-01'), type: 'REGULAR' as const, isRecurring: true },
    { name: "Maundy Thursday", date: new Date('2025-04-17'), type: 'REGULAR' as const, isRecurring: false },
    { name: "Good Friday", date: new Date('2025-04-18'), type: 'REGULAR' as const, isRecurring: false },
    { name: "Araw ng Kagitingan", date: new Date('2025-04-09'), type: 'REGULAR' as const, isRecurring: true },
    { name: "Labor Day", date: new Date('2025-05-01'), type: 'REGULAR' as const, isRecurring: true },
    { name: "Independence Day", date: new Date('2025-06-12'), type: 'REGULAR' as const, isRecurring: true },
    { name: "National Heroes Day", date: new Date('2025-08-25'), type: 'REGULAR' as const, isRecurring: true },
    { name: "Bonifacio Day", date: new Date('2025-11-30'), type: 'REGULAR' as const, isRecurring: true },
    { name: "Rizal Day", date: new Date('2025-12-30'), type: 'REGULAR' as const, isRecurring: true },
    { name: "Christmas Day", date: new Date('2025-12-25'), type: 'REGULAR' as const, isRecurring: true },
    
    // Special Non-Working Holidays
    { name: "Black Saturday", date: new Date('2025-04-19'), type: 'SPECIAL' as const, isRecurring: false },
    { name: "Ninoy Aquino Day", date: new Date('2025-08-21'), type: 'SPECIAL' as const, isRecurring: true },
    { name: "All Saints' Day", date: new Date('2025-11-01'), type: 'SPECIAL' as const, isRecurring: true },
    { name: "Christmas Eve", date: new Date('2025-12-24'), type: 'SPECIAL' as const, isRecurring: true },
    { name: "New Year's Eve", date: new Date('2025-12-31'), type: 'SPECIAL' as const, isRecurring: true },
  ]

  for (const holiday of holidays2025) {
    await prisma.holiday.upsert({
      where: { 
        name_date: {
          name: holiday.name,
          date: holiday.date
        }
      },
      update: holiday,
      create: holiday
    })
  }

  console.log('✅ Holidays seeded')

  // Create a sample payroll schedule
  await prisma.payrollSchedule.upsert({
    where: { name: 'Bi-monthly Payroll' },
    update: {
      days: [15, 30],
      isActive: true
    },
    create: {
      name: 'Bi-monthly Payroll',
      days: [15, 30],
      isActive: true
    }
  })

  console.log('✅ Payroll schedule seeded')
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
