/*
  Warnings:

  - You are about to drop the column `processHour` on the `payroll_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `processMinute` on the `payroll_schedules` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payroll_records" ADD COLUMN     "employeeSignedAt" TIMESTAMP(3),
ADD COLUMN     "generatedAt" TIMESTAMP(3),
ADD COLUMN     "isEmployeeSigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isGenerated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payroll_schedules" DROP COLUMN "processHour",
DROP COLUMN "processMinute",
ADD COLUMN     "cutoffDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "cutoffType" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "payrollReleaseDay" INTEGER;
