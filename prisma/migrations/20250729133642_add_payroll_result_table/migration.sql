-- CreateEnum
CREATE TYPE "PayrollResultStatus" AS ENUM ('GENERATED', 'APPROVED', 'REJECTED', 'PAID');

-- CreateTable
CREATE TABLE "payroll_results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payrollScheduleId" TEXT,
    "payPeriodStart" TIMESTAMP(3) NOT NULL,
    "payPeriodEnd" TIMESTAMP(3) NOT NULL,
    "baseSalary" DECIMAL(10,2) NOT NULL,
    "dailyRate" DECIMAL(10,2) NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "daysWorked" INTEGER NOT NULL DEFAULT 0,
    "hoursWorked" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "overtimeHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "undertimeHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "lateHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "holidayHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "nightShiftHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "regularPay" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "overtimePay" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "holidayPay" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "nightDifferential" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "allowances" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bonuses" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "thirteenthMonthPay" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "serviceIncentiveLeave" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "otherEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "grossPay" DECIMAL(10,2) NOT NULL,
    "gsisContribution" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "philHealthContribution" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pagibigContribution" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxableIncome" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "withholdingTax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lateDeductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "undertimeDeductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "loanDeductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalEarnings" DECIMAL(10,2) NOT NULL,
    "totalDeductions" DECIMAL(10,2) NOT NULL,
    "netPay" DECIMAL(10,2) NOT NULL,
    "status" "PayrollResultStatus" NOT NULL DEFAULT 'GENERATED',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "appliedRules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_results_userId_payPeriodStart_payPeriodEnd_key" ON "payroll_results"("userId", "payPeriodStart", "payPeriodEnd");

-- AddForeignKey
ALTER TABLE "payroll_results" ADD CONSTRAINT "payroll_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_results" ADD CONSTRAINT "payroll_results_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
