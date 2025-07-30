-- CreateEnum
CREATE TYPE "PayrollFileStatus" AS ENUM ('GENERATED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "payroll_files" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "payPeriodStart" TIMESTAMP(3) NOT NULL,
    "payPeriodEnd" TIMESTAMP(3) NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department" TEXT,
    "employeeCount" INTEGER NOT NULL,
    "totalGrossPay" DECIMAL(12,2) NOT NULL,
    "totalNetPay" DECIMAL(12,2) NOT NULL,
    "totalDeductions" DECIMAL(12,2) NOT NULL,
    "status" "PayrollFileStatus" NOT NULL DEFAULT 'GENERATED',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadAt" TIMESTAMP(3),
    "scheduleId" TEXT,
    "scheduleName" TEXT,
    "metadata" TEXT,
    "checksum" TEXT,

    CONSTRAINT "payroll_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payroll_files" ADD CONSTRAINT "payroll_files_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
