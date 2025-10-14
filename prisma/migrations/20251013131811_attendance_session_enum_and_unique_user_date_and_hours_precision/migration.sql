/*
  Warnings:

  - The values [ACTIVE,TERMINATED] on the enum `EmploymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[biometricNo]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AttendancePunchType" AS ENUM ('IN', 'OUT');

-- AlterEnum
BEGIN;
CREATE TYPE "EmploymentStatus_new" AS ENUM ('PERMANENT', 'TEMPORARY', 'CONTRACTUAL', 'INACTIVE');
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "EmploymentStatus_new" USING ("status"::text::"EmploymentStatus_new");
ALTER TYPE "EmploymentStatus" RENAME TO "EmploymentStatus_old";
ALTER TYPE "EmploymentStatus_new" RENAME TO "EmploymentStatus";
DROP TYPE "EmploymentStatus_old";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'CONTRACTUAL';
COMMIT;

-- DropIndex
DROP INDEX "configuration_scopes_applicationType_idx";

-- DropIndex
DROP INDEX "configuration_scopes_settingsId_idx";

-- DropIndex
DROP INDEX "configuration_scopes_targetId_idx";

-- DropIndex
DROP INDEX "contribution_brackets_contributionType_idx";

-- DropIndex
DROP INDEX "contribution_brackets_salaryRange_idx";

-- DropIndex
DROP INDEX "tax_bracket_configs_salaryRange_idx";

-- DropIndex
DROP INDEX "tax_bracket_configs_source_idx";

-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "afternoonTimeIn" TIMESTAMP(3),
ADD COLUMN     "afternoonTimeOut" TIMESTAMP(3),
ADD COLUMN     "earlyOutReason" TEXT,
ADD COLUMN     "importBatchId" TEXT,
ADD COLUMN     "isEarlyOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "morningTimeIn" TIMESTAMP(3),
ADD COLUMN     "morningTimeOut" TIMESTAMP(3),
ADD COLUMN     "totalSessions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "biometricNo" TEXT,
ALTER COLUMN "status" SET DEFAULT 'CONTRACTUAL';

-- CreateTable
CREATE TABLE "attendance_import_batches" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "checksum" TEXT,
    "summary" TEXT,
    "notes" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_punches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "type" "AttendancePunchType" NOT NULL,
    "rawStatus" TEXT,
    "department" TEXT,
    "locationId" TEXT,
    "rawName" TEXT,
    "importBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_punches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_import_batches_checksum_key" ON "attendance_import_batches"("checksum");

-- CreateIndex
CREATE INDEX "attendance_punches_userId_timestamp_idx" ON "attendance_punches"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_punches_userId_timestamp_type_key" ON "attendance_punches"("userId", "timestamp", "type");

-- CreateIndex
CREATE INDEX "attendance_records_userId_date_idx" ON "attendance_records"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "users_biometricNo_key" ON "users"("biometricNo");

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "attendance_import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_import_batches" ADD CONSTRAINT "attendance_import_batches_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_punches" ADD CONSTRAINT "attendance_punches_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "attendance_import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
