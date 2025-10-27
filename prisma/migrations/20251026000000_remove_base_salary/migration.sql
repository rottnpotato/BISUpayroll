-- Remove baseSalary column from payroll_records
ALTER TABLE "payroll_records" DROP COLUMN IF EXISTS "baseSalary";

-- Remove baseSalary column from payroll_results
ALTER TABLE "payroll_results" DROP COLUMN IF EXISTS "baseSalary";

-- Rename baseSalary to dailyRate in payroll_roles
ALTER TABLE "payroll_roles" RENAME COLUMN "baseSalary" TO "dailyRate";

-- Update existing payroll rules to change type from 'base' to 'daily_rate'
UPDATE "payroll_rules" SET type = 'daily_rate', name = 'Daily Rate', description = 'Daily rate for employees', amount = 800 WHERE type = 'base' OR type LIKE '%salary%';

-- Comment on the change
COMMENT ON COLUMN "payroll_roles"."dailyRate" IS 'Daily rate set by admin for this role';
