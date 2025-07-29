-- AlterTable
ALTER TABLE "payroll_schedules" ADD COLUMN     "processingDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
