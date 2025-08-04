-- CreateTable
CREATE TABLE "payroll_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department" TEXT,
    "position" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "baseSalary" DECIMAL(10,2),
    "overtimeEligible" BOOLEAN NOT NULL DEFAULT true,
    "nightDifferentialEligible" BOOLEAN NOT NULL DEFAULT true,
    "holidayPayEligible" BOOLEAN NOT NULL DEFAULT true,
    "gsisEligible" BOOLEAN NOT NULL DEFAULT true,
    "philHealthEligible" BOOLEAN NOT NULL DEFAULT true,
    "pagibigEligible" BOOLEAN NOT NULL DEFAULT true,
    "withholdingTaxEligible" BOOLEAN NOT NULL DEFAULT true,
    "thirteenthMonthEligible" BOOLEAN NOT NULL DEFAULT true,
    "leaveEligible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_payroll_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payrollRoleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_payroll_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_roles_name_key" ON "payroll_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_payroll_roles_userId_payrollRoleId_key" ON "user_payroll_roles"("userId", "payrollRoleId");

-- AddForeignKey
ALTER TABLE "user_payroll_roles" ADD CONSTRAINT "user_payroll_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_payroll_roles" ADD CONSTRAINT "user_payroll_roles_payrollRoleId_fkey" FOREIGN KEY ("payrollRoleId") REFERENCES "payroll_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default payroll roles based on existing positions
INSERT INTO "payroll_roles" ("id", "name", "description", "department", "position", "baseSalary", "updatedAt") VALUES
('role_1', 'Faculty - Professor', 'Senior teaching and research position', 'Faculty', 'Professor', 65000.00, CURRENT_TIMESTAMP),
('role_2', 'Faculty - Associate Professor', 'Mid-level teaching position', 'Faculty', 'Associate Professor', 55000.00, CURRENT_TIMESTAMP),
('role_3', 'Faculty - Assistant Professor', 'Entry-level teaching position', 'Faculty', 'Assistant Professor', 45000.00, CURRENT_TIMESTAMP),
('role_4', 'Faculty - Instructor', 'Teaching position', 'Faculty', 'Instructor', 35000.00, CURRENT_TIMESTAMP),
('role_5', 'IT - System Administrator', 'IT systems management', 'Information Technology', 'System Administrator', 50000.00, CURRENT_TIMESTAMP),
('role_6', 'IT - Software Developer', 'Software development', 'Information Technology', 'Software Developer', 45000.00, CURRENT_TIMESTAMP),
('role_7', 'IT - Network Specialist', 'Network administration', 'Information Technology', 'Network Specialist', 42000.00, CURRENT_TIMESTAMP),
('role_8', 'HR - HR Manager', 'Human resources management', 'Human Resources', 'HR Manager', 48000.00, CURRENT_TIMESTAMP),
('role_9', 'HR - HR Specialist', 'HR operations', 'Human Resources', 'HR Specialist', 38000.00, CURRENT_TIMESTAMP),
('role_10', 'Accounting - Senior Accountant', 'Senior accounting position', 'Accounting', 'Senior Accountant', 45000.00, CURRENT_TIMESTAMP),
('role_11', 'Accounting - Accountant', 'General accounting', 'Accounting', 'Accountant', 35000.00, CURRENT_TIMESTAMP),
('role_12', 'Accounting - Payroll Specialist', 'Payroll processing', 'Accounting', 'Payroll Specialist', 40000.00, CURRENT_TIMESTAMP),
('role_13', 'Admin - Office Manager', 'Office administration', 'Administration', 'Office Manager', 38000.00, CURRENT_TIMESTAMP),
('role_14', 'Admin - Administrative Assistant', 'Administrative support', 'Administration', 'Administrative Assistant', 28000.00, CURRENT_TIMESTAMP),
('role_15', 'Maintenance - Facilities Manager', 'Facilities management', 'Maintenance', 'Facilities Manager', 40000.00, CURRENT_TIMESTAMP),
('role_16', 'Maintenance - Maintenance Technician', 'Equipment maintenance', 'Maintenance', 'Maintenance Technician', 32000.00, CURRENT_TIMESTAMP);