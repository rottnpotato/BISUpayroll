/*
  Warnings:

  - You are about to drop the column `employeeSignedAt` on the `payroll_records` table. All the data in the column will be lost.
  - You are about to drop the column `isEmployeeSigned` on the `payroll_records` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payroll_records" DROP COLUMN "employeeSignedAt",
DROP COLUMN "isEmployeeSigned";
