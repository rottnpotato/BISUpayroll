-- Migration: Add salary step field to salary_grades table
-- This will drop and recreate the salary_grades table with the new step field

-- Drop the existing salary_grades table
DROP TABLE IF EXISTS "salary_grades" CASCADE;

-- Recreate the salary_grades table with the step field
CREATE TABLE "salary_grades" (
    "id" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 1,
    "position" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "monthlyRate" DECIMAL(10,2) NOT NULL,
    "dailyRate" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_grades_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX "salary_grades_grade_step_position_rank_key" ON "salary_grades"("grade", "step", "position", "rank");

-- Create indexes
CREATE INDEX "salary_grades_position_idx" ON "salary_grades"("position");
CREATE INDEX "salary_grades_grade_step_idx" ON "salary_grades"("grade", "step");
CREATE INDEX "salary_grades_grade_idx" ON "salary_grades"("grade");

-- Add the salaryStep field to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'salaryStep'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "salaryStep" INTEGER;
    END IF;
END $$;

-- Success message
SELECT 'Migration completed successfully! Now run: npm run prisma:seed:salary-grades' AS message;

-- then run this command: npx tsx prisma/seed-salary-grades.ts