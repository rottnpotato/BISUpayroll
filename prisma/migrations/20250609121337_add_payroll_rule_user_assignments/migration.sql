-- AlterTable
ALTER TABLE "payroll_rules" ADD COLUMN     "applyToAll" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "payroll_rule_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payrollRuleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_rule_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_rule_assignments_userId_payrollRuleId_key" ON "payroll_rule_assignments"("userId", "payrollRuleId");

-- AddForeignKey
ALTER TABLE "payroll_rule_assignments" ADD CONSTRAINT "payroll_rule_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_rule_assignments" ADD CONSTRAINT "payroll_rule_assignments_payrollRuleId_fkey" FOREIGN KEY ("payrollRuleId") REFERENCES "payroll_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
