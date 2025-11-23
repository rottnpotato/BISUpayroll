-- Add salary grade fields to users table
-- CreateTable
ALTER TABLE "users" ADD COLUMN "salaryGrade" INTEGER;
ALTER TABLE "users" ADD COLUMN "dailyRate" DECIMAL(10,2);

-- Create index for salary grade lookups
CREATE INDEX "users_salaryGrade_idx" ON "users"("salaryGrade");
CREATE INDEX "users_position_salaryGrade_idx" ON "users"("position", "salaryGrade");
