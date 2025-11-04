-- =====================================================
-- ADD OVERLOAD TRACKING TO PAYROLL CALCULATIONS
-- =====================================================
-- This migration adds overload/overtime pay calculations
-- to the payroll system by:
-- 1. Creating overload_records table and enum
-- 2. Adding overload fields to payroll_results
-- 3. Creating a function to calculate overload pay
-- 4. Updating the main payroll calculation to include overload

-- =====================================================
-- STEP 0: Create OverloadStatus enum if it doesn't exist
-- =====================================================
DO $$ BEGIN
    CREATE TYPE "OverloadStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STEP 0b: Create overload_records table
-- =====================================================
CREATE TABLE IF NOT EXISTS "overload_records" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "hoursWorked" DECIMAL(6,2) NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "status" "OverloadStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overload_records_pkey" PRIMARY KEY ("id")
);

-- Create indexes for overload_records
CREATE INDEX IF NOT EXISTS "overload_records_userId_attendanceId_idx" ON "overload_records"("userId", "attendanceId");
CREATE INDEX IF NOT EXISTS "overload_records_userId_createdAt_idx" ON "overload_records"("userId", "createdAt");

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "overload_records" ADD CONSTRAINT "overload_records_attendanceId_fkey" 
    FOREIGN KEY ("attendanceId") REFERENCES "attendance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "overload_records" ADD CONSTRAINT "overload_records_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STEP 1: Add overload fields to payroll_results
-- =====================================================
ALTER TABLE "payroll_results" 
ADD COLUMN IF NOT EXISTS "overloadHours" DECIMAL(6, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "overloadPay" DECIMAL(10, 2) DEFAULT 0;

-- =====================================================
-- FUNCTION: Calculate overload pay from overload records
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_overload_pay(
    p_user_id TEXT,
    p_pay_period_start DATE,
    p_pay_period_end DATE
) RETURNS TABLE(
    total_hours DECIMAL,
    total_pay DECIMAL
) AS $$
DECLARE
    v_total_hours DECIMAL := 0;
    v_total_pay DECIMAL := 0;
BEGIN
    -- Aggregate approved overload records within the pay period
    SELECT 
        COALESCE(SUM(CAST("hoursWorked" AS DECIMAL)), 0),
        COALESCE(SUM(CAST("totalAmount" AS DECIMAL)), 0)
    INTO v_total_hours, v_total_pay
    FROM "overload_records" o
    JOIN "attendance_records" a ON o."attendanceId" = a.id
    WHERE o."userId" = p_user_id
    AND o."status" = 'APPROVED'
    AND a.date >= p_pay_period_start
    AND a.date <= p_pay_period_end;
    
    RETURN QUERY SELECT v_total_hours, v_total_pay;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_overload_pay IS 'Calculates total overload hours and pay for approved overload records within a pay period';

-- =====================================================
-- UPDATE: Main payroll calculation to include overload
-- =====================================================

-- Drop existing function to allow signature change
DROP FUNCTION IF EXISTS calculate_payroll_for_period(TEXT, DATE, DATE) CASCADE;

CREATE OR REPLACE FUNCTION calculate_payroll_for_period(
    p_user_id TEXT,
    p_pay_period_start DATE,
    p_pay_period_end DATE
) RETURNS TABLE(
    user_id TEXT,
    daily_rate DECIMAL,
    hourly_rate DECIMAL,
    days_worked INT,
    hours_worked DECIMAL,
    overtime_hours DECIMAL,
    undertime_hours DECIMAL,
    late_hours DECIMAL,
    holiday_hours DECIMAL,
    overload_hours DECIMAL,
    regular_pay DECIMAL,
    overtime_pay DECIMAL,
    holiday_pay DECIMAL,
    overload_pay DECIMAL,
    allowances DECIMAL,
    bonuses DECIMAL,
    thirteenth_month_pay DECIMAL,
    service_incentive_leave DECIMAL,
    other_earnings DECIMAL,
    total_earnings DECIMAL,
    gross_pay DECIMAL,
    gsis_contribution DECIMAL,
    philhealth_contribution DECIMAL,
    pagibig_contribution DECIMAL,
    taxable_income DECIMAL,
    withholding_tax DECIMAL,
    late_deductions DECIMAL,
    undertime_deductions DECIMAL,
    loan_deductions DECIMAL,
    other_deductions DECIMAL,
    total_deductions DECIMAL,
    net_pay DECIMAL
) AS $$
DECLARE
    v_daily_rate DECIMAL := 0;
    v_hourly_rate DECIMAL;
    v_days_worked INT := 0;
    v_hours_worked DECIMAL := 0;
    v_overtime_hours DECIMAL := 0;
    v_undertime_hours DECIMAL := 0;
    v_late_hours DECIMAL := 0;
    v_holiday_hours DECIMAL := 0;
    v_overload_hours DECIMAL := 0;
    v_regular_pay DECIMAL := 0;
    v_overtime_pay DECIMAL := 0;
    v_holiday_pay DECIMAL := 0;
    v_overload_pay DECIMAL := 0;
    v_allowances DECIMAL := 0;
    v_bonuses DECIMAL := 0;
    v_thirteenth_month DECIMAL := 0;
    v_sil DECIMAL := 0;
    v_other_earnings DECIMAL := 0;
    v_total_earnings DECIMAL;
    v_gross_pay DECIMAL;
    v_gsis DECIMAL;
    v_philhealth DECIMAL;
    v_pagibig DECIMAL;
    v_taxable_income DECIMAL;
    v_withholding_tax DECIMAL;
    v_late_deductions DECIMAL := 0;
    v_undertime_deductions DECIMAL := 0;
    v_loan_deductions DECIMAL := 0;
    v_other_deductions DECIMAL := 0;
    v_total_deductions DECIMAL;
    v_net_pay DECIMAL;
    v_daily_hours DECIMAL := 8;
    v_contribution_base DECIMAL;
    v_annual_taxable DECIMAL;
    
    -- Configuration variables
    v_overtime_rate1 DECIMAL := 1.25;
    v_overtime_rate2 DECIMAL := 1.5;
    v_regular_holiday_rate DECIMAL := 2.0;
    v_special_holiday_rate DECIMAL := 1.3;
    v_late_deduction_amount DECIMAL := 0;
    v_late_deduction_basis TEXT := 'fixed';
    
    -- Record variables
    rec RECORD;
    overload_rec RECORD;
BEGIN
    -- Get system configurations
    SELECT COALESCE(CAST(value AS DECIMAL), 8) INTO v_daily_hours
    FROM "system_settings" WHERE key = 'working_hours_dailyHours' AND "isActive" = true LIMIT 1;
    
    SELECT COALESCE(CAST(value AS DECIMAL), 1.25) INTO v_overtime_rate1
    FROM "system_settings" WHERE key = 'rates_overtimeRate1' AND "isActive" = true LIMIT 1;
    
    SELECT COALESCE(CAST(value AS DECIMAL), 1.5) INTO v_overtime_rate2
    FROM "system_settings" WHERE key = 'rates_overtimeRate2' AND "isActive" = true LIMIT 1;
    
    SELECT COALESCE(CAST(value AS DECIMAL), 2.0) INTO v_regular_holiday_rate
    FROM "system_settings" WHERE key = 'rates_regularHolidayRate' AND "isActive" = true LIMIT 1;
    
    SELECT COALESCE(CAST(value AS DECIMAL), 1.3) INTO v_special_holiday_rate
    FROM "system_settings" WHERE key = 'rates_specialHolidayRate' AND "isActive" = true LIMIT 1;
    
    SELECT COALESCE(CAST(value AS DECIMAL), 0) INTO v_late_deduction_amount
    FROM "system_settings" WHERE key = 'working_hours_lateDeductionAmount' AND "isActive" = true LIMIT 1;
    
    SELECT COALESCE(value, 'fixed') INTO v_late_deduction_basis
    FROM "system_settings" WHERE key = 'working_hours_lateDeductionBasis' AND "isActive" = true LIMIT 1;
    
    -- Get daily rate from payroll rules
    SELECT COALESCE(SUM(CAST(pr.amount AS DECIMAL)), 0) INTO v_daily_rate
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type = 'daily_rate';
    
    -- If no user-specific daily rate, check global rules
    IF v_daily_rate = 0 THEN
        SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) INTO v_daily_rate
        FROM "payroll_rules"
        WHERE "applyToAll" = true
        AND "isActive" = true
        AND type = 'daily_rate';
    END IF;
    
    -- Calculate hourly rate from daily rate
    v_hourly_rate := calculate_hourly_rate(v_daily_rate, v_daily_hours);
    
    -- Aggregate attendance data
    FOR rec IN
        SELECT 
            date,
            "timeIn",
            "timeOut",
            COALESCE(CAST("hoursWorked" AS DECIMAL), 0) as hours,
            "isLate",
            "isAbsent"
        FROM "attendance_records"
        WHERE "userId" = p_user_id
        AND date >= p_pay_period_start
        AND date <= p_pay_period_end
        AND "timeIn" IS NOT NULL
        AND "timeOut" IS NOT NULL
    LOOP
        v_days_worked := v_days_worked + 1;
        v_hours_worked := v_hours_worked + rec.hours;
        
        -- Calculate overtime
        IF rec.hours > v_daily_hours THEN
            v_overtime_hours := v_overtime_hours + (rec.hours - v_daily_hours);
        END IF;
        
        -- Calculate undertime
        IF rec.hours < v_daily_hours AND NOT rec."isAbsent" THEN
            v_undertime_hours := v_undertime_hours + (v_daily_hours - rec.hours);
        END IF;
        
        -- Count late hours
        IF rec."isLate" THEN
            v_late_hours := v_late_hours + 1;
        END IF;
        
        -- Check for holiday work
        IF EXISTS (
            SELECT 1 FROM "holidays"
            WHERE DATE(date) = DATE(rec.date)
        ) THEN
            v_holiday_hours := v_holiday_hours + rec.hours;
        END IF;
    END LOOP;
    
    -- Calculate overload pay from approved overload records
    SELECT * INTO overload_rec FROM calculate_overload_pay(p_user_id, p_pay_period_start, p_pay_period_end);
    v_overload_hours := overload_rec.total_hours;
    v_overload_pay := overload_rec.total_pay;
    
    -- Calculate earnings
    v_regular_pay := (v_hours_worked - v_overtime_hours - v_holiday_hours) * v_hourly_rate;
    v_overtime_pay := calculate_overtime_pay(v_overtime_hours, v_hourly_rate, v_overtime_rate1, v_overtime_rate2);
    v_holiday_pay := calculate_holiday_pay(v_holiday_hours, v_hourly_rate, 'REGULAR', v_regular_holiday_rate, v_special_holiday_rate);
    
    -- Get allowances and bonuses from payroll rules
    SELECT COALESCE(SUM(
        CASE 
            WHEN pr."isPercentage" THEN v_daily_rate * (CAST(pr.amount AS DECIMAL) / 100)
            ELSE CAST(pr.amount AS DECIMAL)
        END
    ), 0) INTO v_allowances
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type = 'allowance';
    
    -- Add global allowances
    SELECT COALESCE(v_allowances + SUM(
        CASE 
            WHEN "isPercentage" THEN v_daily_rate * (CAST(amount AS DECIMAL) / 100)
            ELSE CAST(amount AS DECIMAL)
        END
    ), v_allowances) INTO v_allowances
    FROM "payroll_rules"
    WHERE "applyToAll" = true
    AND "isActive" = true
    AND type = 'allowance';
    
    -- Get bonuses
    SELECT COALESCE(SUM(
        CASE 
            WHEN pr."isPercentage" THEN v_daily_rate * (CAST(pr.amount AS DECIMAL) / 100)
            ELSE CAST(pr.amount AS DECIMAL)
        END
    ), 0) INTO v_bonuses
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type = 'bonus';
    
    -- Add global bonuses
    SELECT COALESCE(v_bonuses + SUM(
        CASE 
            WHEN "isPercentage" THEN v_daily_rate * (CAST(amount AS DECIMAL) / 100)
            ELSE CAST(amount AS DECIMAL)
        END
    ), v_bonuses) INTO v_bonuses
    FROM "payroll_rules"
    WHERE "applyToAll" = true
    AND "isActive" = true
    AND type = 'bonus';
    
    -- Calculate total earnings including overload pay
    v_total_earnings := v_regular_pay + v_overtime_pay + v_holiday_pay + v_overload_pay + v_allowances + v_bonuses + v_thirteenth_month + v_sil + v_other_earnings;
    v_gross_pay := v_total_earnings;
    
    -- Get mandatory contributions from payroll rules (only if defined by admin)
    SELECT COALESCE(SUM(CAST(pr.amount AS DECIMAL)), 0) INTO v_gsis
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type = 'gsis';
    
    IF v_gsis = 0 THEN
        SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) INTO v_gsis
        FROM "payroll_rules"
        WHERE "applyToAll" = true
        AND "isActive" = true
        AND type = 'gsis';
    END IF;
    
    SELECT COALESCE(SUM(CAST(pr.amount AS DECIMAL)), 0) INTO v_philhealth
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type = 'philhealth';
    
    IF v_philhealth = 0 THEN
        SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) INTO v_philhealth
        FROM "payroll_rules"
        WHERE "applyToAll" = true
        AND "isActive" = true
        AND type = 'philhealth';
    END IF;
    
    SELECT COALESCE(SUM(CAST(pr.amount AS DECIMAL)), 0) INTO v_pagibig
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type = 'pagibig';
    
    IF v_pagibig = 0 THEN
        SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) INTO v_pagibig
        FROM "payroll_rules"
        WHERE "applyToAll" = true
        AND "isActive" = true
        AND type = 'pagibig';
    END IF;
    
    -- Get withholding tax from payroll rules (only if defined by admin)
    SELECT COALESCE(SUM(CAST(pr.amount AS DECIMAL)), 0) INTO v_withholding_tax
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type = 'tax';
    
    IF v_withholding_tax = 0 THEN
        SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) INTO v_withholding_tax
        FROM "payroll_rules"
        WHERE "applyToAll" = true
        AND "isActive" = true
        AND type = 'tax';
    END IF;
    
    -- Calculate taxable income for record keeping
    v_taxable_income := v_gross_pay - v_gsis - v_philhealth - v_pagibig - v_thirteenth_month - v_sil;
    
    -- Calculate deductions
    v_late_deductions := calculate_late_deductions(v_late_hours, v_hourly_rate, v_daily_rate, v_late_deduction_amount, v_late_deduction_basis);
    v_undertime_deductions := v_undertime_hours * v_hourly_rate;
    
    -- Get loan deductions from payroll rules
    SELECT COALESCE(SUM(CAST(pr.amount AS DECIMAL)), 0) INTO v_loan_deductions
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type = 'deduction';
    
    -- Add global deductions
    SELECT COALESCE(v_loan_deductions + SUM(CAST(amount AS DECIMAL)), v_loan_deductions) INTO v_loan_deductions
    FROM "payroll_rules"
    WHERE "applyToAll" = true
    AND "isActive" = true
    AND type = 'deduction';
    
    v_total_deductions := v_gsis + v_philhealth + v_pagibig + v_withholding_tax + 
                         v_late_deductions + v_undertime_deductions + v_loan_deductions + v_other_deductions;
    
    v_net_pay := GREATEST(0, v_gross_pay - v_total_deductions);
    
    -- Return calculated values including overload
    RETURN QUERY SELECT
        p_user_id,
        v_daily_rate,
        v_hourly_rate,
        v_days_worked,
        v_hours_worked,
        v_overtime_hours,
        v_undertime_hours,
        v_late_hours,
        v_holiday_hours,
        v_overload_hours,
        v_regular_pay,
        v_overtime_pay,
        v_holiday_pay,
        v_overload_pay,
        v_allowances,
        v_bonuses,
        v_thirteenth_month,
        v_sil,
        v_other_earnings,
        v_total_earnings,
        v_gross_pay,
        v_gsis,
        v_philhealth,
        v_pagibig,
        v_taxable_income,
        v_withholding_tax,
        v_late_deductions,
        v_undertime_deductions,
        v_loan_deductions,
        v_other_deductions,
        v_total_deductions,
        v_net_pay;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_payroll_for_period IS 'Calculates complete payroll for a single user within a pay period, including approved overload hours and pay';

-- =====================================================
-- UPDATE: Recalculate all payroll to handle overload
-- =====================================================

-- Drop existing function to allow signature change
DROP FUNCTION IF EXISTS recalculate_all_payroll_for_period(DATE, DATE) CASCADE;

CREATE OR REPLACE FUNCTION recalculate_all_payroll_for_period(
    p_pay_period_start DATE,
    p_pay_period_end DATE
) RETURNS TABLE(
    users_processed INT,
    users_updated INT,
    users_failed INT
) AS $$
DECLARE
    v_user_id TEXT;
    v_users_processed INT := 0;
    v_users_updated INT := 0;
    v_users_failed INT := 0;
    v_calc RECORD;
BEGIN
    -- Loop through all eligible employees
    FOR v_user_id IN
        SELECT id FROM "users"
        WHERE role = 'EMPLOYEE'
        AND status != 'INACTIVE'
    LOOP
        BEGIN
            v_users_processed := v_users_processed + 1;
            
            -- Calculate payroll
            SELECT * INTO v_calc
            FROM calculate_payroll_for_period(v_user_id, p_pay_period_start, p_pay_period_end);
            
            -- Upsert to payroll_results
            INSERT INTO "payroll_results" (
                id,
                "userId",
                "payPeriodStart",
                "payPeriodEnd",
                "dailyRate",
                "hourlyRate",
                "daysWorked",
                "hoursWorked",
                "overtimeHours",
                "undertimeHours",
                "lateHours",
                "holidayHours",
                "nightShiftHours",
                "overloadHours",
                "regularPay",
                "overtimePay",
                "holidayPay",
                "nightDifferential",
                "overloadPay",
                "allowances",
                "bonuses",
                "thirteenthMonthPay",
                "serviceIncentiveLeave",
                "otherEarnings",
                "totalEarnings",
                "grossPay",
                "gsisContribution",
                "philHealthContribution",
                "pagibigContribution",
                "taxableIncome",
                "withholdingTax",
                "lateDeductions",
                "undertimeDeductions",
                "loanDeductions",
                "otherDeductions",
                "totalDeductions",
                "netPay",
                "createdAt",
                "updatedAt"
            ) VALUES (
                gen_random_uuid()::text,
                v_calc.user_id,
                p_pay_period_start,
                p_pay_period_end,
                v_calc.daily_rate,
                v_calc.hourly_rate,
                v_calc.days_worked,
                v_calc.hours_worked,
                v_calc.overtime_hours,
                v_calc.undertime_hours,
                v_calc.late_hours,
                v_calc.holiday_hours,
                0,
                v_calc.overload_hours,
                v_calc.regular_pay,
                v_calc.overtime_pay,
                v_calc.holiday_pay,
                0,
                v_calc.overload_pay,
                v_calc.allowances,
                v_calc.bonuses,
                v_calc.thirteenth_month_pay,
                v_calc.service_incentive_leave,
                v_calc.other_earnings,
                v_calc.total_earnings,
                v_calc.gross_pay,
                v_calc.gsis_contribution,
                v_calc.philhealth_contribution,
                v_calc.pagibig_contribution,
                v_calc.taxable_income,
                v_calc.withholding_tax,
                v_calc.late_deductions,
                v_calc.undertime_deductions,
                v_calc.loan_deductions,
                v_calc.other_deductions,
                v_calc.total_deductions,
                v_calc.net_pay,
                NOW(),
                NOW()
            )
            ON CONFLICT ("userId", "payPeriodStart", "payPeriodEnd")
            DO UPDATE SET
                "dailyRate" = EXCLUDED."dailyRate",
                "hourlyRate" = EXCLUDED."hourlyRate",
                "daysWorked" = EXCLUDED."daysWorked",
                "hoursWorked" = EXCLUDED."hoursWorked",
                "overtimeHours" = EXCLUDED."overtimeHours",
                "undertimeHours" = EXCLUDED."undertimeHours",
                "lateHours" = EXCLUDED."lateHours",
                "holidayHours" = EXCLUDED."holidayHours",
                "overloadHours" = EXCLUDED."overloadHours",
                "regularPay" = EXCLUDED."regularPay",
                "overtimePay" = EXCLUDED."overtimePay",
                "holidayPay" = EXCLUDED."holidayPay",
                "overloadPay" = EXCLUDED."overloadPay",
                "allowances" = EXCLUDED."allowances",
                "bonuses" = EXCLUDED."bonuses",
                "thirteenthMonthPay" = EXCLUDED."thirteenthMonthPay",
                "serviceIncentiveLeave" = EXCLUDED."serviceIncentiveLeave",
                "otherEarnings" = EXCLUDED."otherEarnings",
                "totalEarnings" = EXCLUDED."totalEarnings",
                "grossPay" = EXCLUDED."grossPay",
                "gsisContribution" = EXCLUDED."gsisContribution",
                "philHealthContribution" = EXCLUDED."philHealthContribution",
                "pagibigContribution" = EXCLUDED."pagibigContribution",
                "taxableIncome" = EXCLUDED."taxableIncome",
                "withholdingTax" = EXCLUDED."withholdingTax",
                "lateDeductions" = EXCLUDED."lateDeductions",
                "undertimeDeductions" = EXCLUDED."undertimeDeductions",
                "loanDeductions" = EXCLUDED."loanDeductions",
                "otherDeductions" = EXCLUDED."otherDeductions",
                "totalDeductions" = EXCLUDED."totalDeductions",
                "netPay" = EXCLUDED."netPay",
                "updatedAt" = NOW();
            
            v_users_updated := v_users_updated + 1;
        EXCEPTION WHEN OTHERS THEN
            v_users_failed := v_users_failed + 1;
            RAISE WARNING 'Failed to calculate payroll for user %: %', v_user_id, SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_users_processed, v_users_updated, v_users_failed;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UPDATE: Trigger to include overload in recalculation
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_recalculate_payroll_on_attendance()
RETURNS TRIGGER AS $$
DECLARE
    v_schedule RECORD;
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Recalculate payroll on attendance insert or update
    -- (Attendance is auto-approved on import)
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND (NEW."timeIn" IS DISTINCT FROM OLD."timeIn" OR NEW."timeOut" IS DISTINCT FROM OLD."timeOut")) THEN
        -- Get active payroll schedule to determine period
        SELECT * INTO v_schedule
        FROM "payroll_schedules"
        WHERE "isActive" = true
        LIMIT 1;
        
        IF v_schedule IS NOT NULL THEN
            -- Determine pay period based on attendance date
            v_period_start := DATE_TRUNC('month', NEW.date);
            v_period_end := (DATE_TRUNC('month', NEW.date) + INTERVAL '1 month - 1 day')::DATE;
            
            -- Recalculate payroll for this user and period
            PERFORM calculate_payroll_for_period(NEW."userId", v_period_start, v_period_end);
            
            -- Update existing payroll result if it exists
            UPDATE "payroll_results" pr
            SET
                "daysWorked" = calc.days_worked,
                "hoursWorked" = calc.hours_worked,
                "overtimeHours" = calc.overtime_hours,
                "undertimeHours" = calc.undertime_hours,
                "lateHours" = calc.late_hours,
                "holidayHours" = calc.holiday_hours,
                "overloadHours" = calc.overload_hours,
                "regularPay" = calc.regular_pay,
                "overtimePay" = calc.overtime_pay,
                "holidayPay" = calc.holiday_pay,
                "overloadPay" = calc.overload_pay,
                "allowances" = calc.allowances,
                "bonuses" = calc.bonuses,
                "thirteenthMonthPay" = calc.thirteenth_month_pay,
                "serviceIncentiveLeave" = calc.service_incentive_leave,
                "otherEarnings" = calc.other_earnings,
                "totalEarnings" = calc.total_earnings,
                "grossPay" = calc.gross_pay,
                "gsisContribution" = calc.gsis_contribution,
                "philHealthContribution" = calc.philhealth_contribution,
                "pagibigContribution" = calc.pagibig_contribution,
                "taxableIncome" = calc.taxable_income,
                "withholdingTax" = calc.withholding_tax,
                "lateDeductions" = calc.late_deductions,
                "undertimeDeductions" = calc.undertime_deductions,
                "loanDeductions" = calc.loan_deductions,
                "otherDeductions" = calc.other_deductions,
                "totalDeductions" = calc.total_deductions,
                "netPay" = calc.net_pay,
                "updatedAt" = NOW()
            FROM calculate_payroll_for_period(NEW."userId", v_period_start, v_period_end) calc
            WHERE pr."userId" = NEW."userId"
            AND pr."payPeriodStart" = v_period_start
            AND pr."payPeriodEnd" = v_period_end;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_recalculate_payroll_on_attendance ON "attendance_records";
CREATE TRIGGER auto_recalculate_payroll_on_attendance
    AFTER INSERT OR UPDATE ON "attendance_records"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_payroll_on_attendance();

-- =====================================================
-- NEW TRIGGER: Auto-recalculate on overload approval
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_recalculate_payroll_on_overload()
RETURNS TRIGGER AS $$
DECLARE
    v_attendance RECORD;
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- When overload record is approved or updated
    IF NEW."status" = 'APPROVED' THEN
        -- Get the attendance record to determine the period
        SELECT date INTO v_attendance
        FROM "attendance_records"
        WHERE id = NEW."attendanceId";
        
        IF v_attendance IS NOT NULL THEN
            -- Determine pay period based on attendance date
            v_period_start := DATE_TRUNC('month', v_attendance.date);
            v_period_end := (DATE_TRUNC('month', v_attendance.date) + INTERVAL '1 month - 1 day')::DATE;
            
            -- Update existing payroll result if it exists
            UPDATE "payroll_results" pr
            SET
                "overloadHours" = calc.overload_hours,
                "overloadPay" = calc.overload_pay,
                "totalEarnings" = calc.total_earnings,
                "grossPay" = calc.gross_pay,
                "netPay" = calc.net_pay,
                "updatedAt" = NOW()
            FROM calculate_payroll_for_period(NEW."userId", v_period_start, v_period_end) calc
            WHERE pr."userId" = NEW."userId"
            AND pr."payPeriodStart" = v_period_start
            AND pr."payPeriodEnd" = v_period_end;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_recalculate_payroll_on_overload ON "overload_records";
CREATE TRIGGER auto_recalculate_payroll_on_overload
    AFTER INSERT OR UPDATE ON "overload_records"
    FOR EACH ROW
    WHEN (NEW."status" = 'APPROVED')
    EXECUTE FUNCTION trigger_recalculate_payroll_on_overload();

COMMENT ON FUNCTION trigger_recalculate_payroll_on_overload IS 'Auto-recalculates payroll when overload records are approved';
