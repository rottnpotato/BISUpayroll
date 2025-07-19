-- AlterTable
ALTER TABLE "payroll_schedules" ADD COLUMN     "processHour" INTEGER NOT NULL DEFAULT 9,
ADD COLUMN     "processMinute" INTEGER NOT NULL DEFAULT 0;
