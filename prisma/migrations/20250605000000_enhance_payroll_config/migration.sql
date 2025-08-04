-- CreateEnum for ApplicationType
CREATE TYPE "ApplicationType" AS ENUM ('ALL', 'DEPARTMENT', 'INDIVIDUAL', 'ROLE', 'POSITION');

-- CreateEnum for SettingsDataType
CREATE TYPE "SettingsDataType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DECIMAL');

-- Enhance SystemSettings table
ALTER TABLE "system_settings" ADD COLUMN "description" TEXT;
ALTER TABLE "system_settings" ADD COLUMN "category" TEXT;
ALTER TABLE "system_settings" ADD COLUMN "dataType" "SettingsDataType" NOT NULL DEFAULT 'STRING';
ALTER TABLE "system_settings" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Create ConfigurationScope table
CREATE TABLE "configuration_scopes" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "applicationType" "ApplicationType" NOT NULL DEFAULT 'ALL',
    "targetId" TEXT,
    "targetName" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuration_scopes_pkey" PRIMARY KEY ("id")
);

-- Create ContributionBracket table
CREATE TABLE "contribution_brackets" (
    "id" TEXT NOT NULL,
    "contributionType" TEXT NOT NULL,
    "salaryMin" DECIMAL(12,2) NOT NULL,
    "salaryMax" DECIMAL(12,2) NOT NULL,
    "employeeRate" DECIMAL(5,4) NOT NULL,
    "employerRate" DECIMAL(5,4) NOT NULL,
    "minContribution" DECIMAL(10,2),
    "maxContribution" DECIMAL(10,2),
    "description" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contribution_brackets_pkey" PRIMARY KEY ("id")
);

-- Create TaxBracketConfig table
CREATE TABLE "tax_bracket_configs" (
    "id" TEXT NOT NULL,
    "salaryMin" DECIMAL(12,2) NOT NULL,
    "salaryMax" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,4) NOT NULL,
    "fixedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "apiReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_bracket_configs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "configuration_scopes" ADD CONSTRAINT "configuration_scopes_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "system_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX "configuration_scopes_settingsId_idx" ON "configuration_scopes"("settingsId");
CREATE INDEX "configuration_scopes_applicationType_idx" ON "configuration_scopes"("applicationType");
CREATE INDEX "configuration_scopes_targetId_idx" ON "configuration_scopes"("targetId");
CREATE INDEX "contribution_brackets_contributionType_idx" ON "contribution_brackets"("contributionType");
CREATE INDEX "contribution_brackets_salaryRange_idx" ON "contribution_brackets"("salaryMin", "salaryMax");
CREATE INDEX "tax_bracket_configs_salaryRange_idx" ON "tax_bracket_configs"("salaryMin", "salaryMax");
CREATE INDEX "tax_bracket_configs_source_idx" ON "tax_bracket_configs"("source");

-- Insert default tax bracket configurations
INSERT INTO "tax_bracket_configs" ("id", "salaryMin", "salaryMax", "taxRate", "description", "source", "updatedAt") VALUES
('tax_bracket_1', 0, 20833, 0.00, '₱0 - ₱250,000 annually', 'manual', CURRENT_TIMESTAMP),
('tax_bracket_2', 20834, 33333, 0.20, '₱250,001 - ₱400,000 annually', 'manual', CURRENT_TIMESTAMP),
('tax_bracket_3', 33334, 66667, 0.25, '₱400,001 - ₱800,000 annually', 'manual', CURRENT_TIMESTAMP),
('tax_bracket_4', 66668, 166667, 0.30, '₱800,001 - ₱2,000,000 annually', 'manual', CURRENT_TIMESTAMP),
('tax_bracket_5', 166668, 666667, 0.32, '₱2,000,001 - ₱8,000,000 annually', 'manual', CURRENT_TIMESTAMP),
('tax_bracket_6', 666668, 999999999, 0.35, 'Above ₱8,000,000 annually', 'manual', CURRENT_TIMESTAMP);

-- Insert default contribution brackets for GSIS
INSERT INTO "contribution_brackets" ("id", "contributionType", "salaryMin", "salaryMax", "employeeRate", "employerRate", "description", "updatedAt") VALUES
('gsis_bracket_1', 'gsis', 5000, 100000, 0.09, 0.12, 'Standard GSIS contribution bracket', CURRENT_TIMESTAMP);

-- Insert default contribution brackets for PhilHealth
INSERT INTO "contribution_brackets" ("id", "contributionType", "salaryMin", "salaryMax", "employeeRate", "employerRate", "minContribution", "maxContribution", "description", "updatedAt") VALUES
('philhealth_bracket_1', 'philhealth', 8000, 70000, 0.0275, 0.0275, 200, 1750, 'Standard PhilHealth contribution bracket', CURRENT_TIMESTAMP);

-- Insert default contribution brackets for Pag-IBIG
INSERT INTO "contribution_brackets" ("id", "contributionType", "salaryMin", "salaryMax", "employeeRate", "employerRate", "minContribution", "maxContribution", "description", "updatedAt") VALUES
('pagibig_bracket_1', 'pagibig', 1200, 10000, 0.02, 0.02, 24, 200, 'Standard Pag-IBIG contribution bracket', CURRENT_TIMESTAMP);

-- Update existing system settings to include category and data type
UPDATE "system_settings" SET "category" = 'payroll', "dataType" = 'NUMBER' WHERE "key" LIKE 'working_hours_%' AND "value" ~ '^[0-9]+\.?[0-9]*$';
UPDATE "system_settings" SET "category" = 'payroll', "dataType" = 'NUMBER' WHERE "key" LIKE 'rates_%' AND "value" ~ '^[0-9]+\.?[0-9]*$';
UPDATE "system_settings" SET "category" = 'payroll', "dataType" = 'NUMBER' WHERE "key" LIKE 'leave_benefits_%' AND "value" ~ '^[0-9]+\.?[0-9]*$';
UPDATE "system_settings" SET "category" = 'payroll', "dataType" = 'STRING' WHERE "key" LIKE '%currency%' OR "key" LIKE '%basis%';
UPDATE "system_settings" SET "category" = 'payroll', "dataType" = 'BOOLEAN' WHERE "value" IN ('true', 'false');