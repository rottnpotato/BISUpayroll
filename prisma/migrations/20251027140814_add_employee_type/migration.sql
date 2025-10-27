-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('TEACHING_PERSONNEL', 'NON_TEACHING_PERSONNEL', 'CASUAL', 'PLANTILLA');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "employeeType" "EmployeeType";
