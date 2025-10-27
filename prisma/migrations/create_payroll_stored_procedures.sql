-- =====================================================
-- PAYROLL CALCULATION STORED PROCEDURES & TRIGGERS
-- =====================================================
-- This migration creates stored procedures to calculate
-- payroll at the database level and triggers to auto-update
-- when attendance or configurations change.

-- =====================================================
-- FUNCTION: Calculate hourly rate from daily rate
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_hourly_rate(
    p_daily_rate DECIMAL,
    p_daily_hours DECIMAL DEFAULT 8
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(p_daily_rate / p_daily_hours, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNCTION: Calculate overtime pay
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_overtime_pay(
    p_overtime_hours DECIMAL,
    p_hourly_rate DECIMAL,
    p_rate1 DECIMAL DEFAULT 1.25,
    p_rate2 DECIMAL DEFAULT 1.5
) RETURNS DECIMAL AS $$
DECLARE
    v_first_hours DECIMAL;
    v_second_hours DECIMAL;
BEGIN
    IF p_overtime_hours <= 0 THEN
        RETURN 0;
    END IF;
    
    v_first_hours := LEAST(p_overtime_hours, 2);
    v_second_hours := GREATEST(0, p_overtime_hours - 2);
    
    RETURN ROUND(
        (v_first_hours * p_hourly_rate * p_rate1) + 
        (v_second_hours * p_hourly_rate * p_rate2),
        2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNCTION: Calculate holiday pay
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_holiday_pay(
    p_holiday_hours DECIMAL,
    p_hourly_rate DECIMAL,
    p_holiday_type TEXT DEFAULT 'REGULAR',
    p_regular_rate DECIMAL DEFAULT 2.0,
    p_special_rate DECIMAL DEFAULT 1.3
) RETURNS DECIMAL AS $$
DECLARE
    v_rate DECIMAL;
BEGIN
    IF p_holiday_hours <= 0 THEN
        RETURN 0;
    END IF;
    
    v_rate := CASE 
        WHEN p_holiday_type = 'REGULAR' THEN p_regular_rate
        ELSE p_special_rate
    END;
    
    RETURN ROUND(p_holiday_hours * p_hourly_rate * (v_rate - 1), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNCTION: Calculate late deductions
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_late_deductions(
    p_late_hours DECIMAL,
    p_hourly_rate DECIMAL DEFAULT 0,
    p_daily_rate DECIMAL DEFAULT 0,
    p_deduction_amount DECIMAL DEFAULT 0,
    p_deduction_basis TEXT DEFAULT 'fixed'
) RETURNS DECIMAL AS $$
BEGIN
    IF p_late_hours <= 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND(
        CASE p_deduction_basis
            WHEN 'fixed' THEN p_late_hours * p_deduction_amount
            WHEN 'hourly' THEN p_late_hours * p_hourly_rate * p_deduction_amount
            WHEN 'daily' THEN p_late_hours * p_daily_rate * p_deduction_amount
            WHEN 'per_minute' THEN (p_late_hours * 60) * (p_hourly_rate / 60) * p_deduction_amount
            ELSE 0
        END,
        2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNCTION: Calculate GSIS contribution
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_gsis_contribution(
    p_salary_base DECIMAL,
    p_employee_rate DECIMAL DEFAULT 9.0,
    p_min_salary DECIMAL DEFAULT 0,
    p_max_salary DECIMAL DEFAULT 999999
) RETURNS DECIMAL AS $$
DECLARE
    v_contribution_base DECIMAL;
BEGIN
    v_contribution_base := GREATEST(p_min_salary, LEAST(p_max_salary, p_salary_base));
    RETURN ROUND(v_contribution_base * (p_employee_rate / 100), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNCTION: Calculate PhilHealth contribution
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_philhealth_contribution(
    p_salary_base DECIMAL,
    p_employee_rate DECIMAL DEFAULT 2.5,
    p_min_contribution DECIMAL DEFAULT 500,
    p_max_contribution DECIMAL DEFAULT 5000,
    p_min_salary DECIMAL DEFAULT 10000,
    p_max_salary DECIMAL DEFAULT 100000
) RETURNS DECIMAL AS $$
DECLARE
    v_contribution DECIMAL;
    v_contribution_base DECIMAL;
BEGIN
    IF p_salary_base < p_min_salary THEN
        RETURN p_min_contribution;
    END IF;
    
    v_contribution_base := LEAST(p_max_salary, p_salary_base);
    v_contribution := v_contribution_base * (p_employee_rate / 100);
    
    RETURN ROUND(GREATEST(p_min_contribution, LEAST(p_max_contribution, v_contribution)), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNCTION: Calculate Pag-IBIG contribution
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_pagibig_contribution(
    p_salary_base DECIMAL,
    p_employee_rate DECIMAL DEFAULT 2.0,
    p_min_contribution DECIMAL DEFAULT 100,
    p_max_contribution DECIMAL DEFAULT 200,
    p_min_salary DECIMAL DEFAULT 1000,
    p_max_salary DECIMAL DEFAULT 5000
) RETURNS DECIMAL AS $$
DECLARE
    v_contribution DECIMAL;
    v_contribution_base DECIMAL;
BEGIN
    IF p_salary_base < p_min_salary THEN
        RETURN p_min_contribution;
    END IF;
    
    v_contribution_base := LEAST(p_max_salary, p_salary_base);
    v_contribution := v_contribution_base * (p_employee_rate / 100);
    
    RETURN ROUND(GREATEST(p_min_contribution, LEAST(p_max_contribution, v_contribution)), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNCTION: Calculate withholding tax (simplified)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_withholding_tax(
    p_annual_taxable_income DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_monthly_tax DECIMAL := 0;
BEGIN
    -- Philippine Tax Brackets (2025)
    -- Simplified calculation - actual brackets should be in tax_bracket_configs table
    IF p_annual_taxable_income <= 250000 THEN
        v_monthly_tax := 0;
    ELSIF p_annual_taxable_income <= 400000 THEN
        v_monthly_tax := ((p_annual_taxable_income - 250000) * 0.15) / 12;
    ELSIF p_annual_taxable_income <= 800000 THEN
        v_monthly_tax := (22500 + ((p_annual_taxable_income - 400000) * 0.20)) / 12;
    ELSIF p_annual_taxable_income <= 2000000 THEN
        v_monthly_tax := (102500 + ((p_annual_taxable_income - 800000) * 0.25)) / 12;
    ELSIF p_annual_taxable_income <= 8000000 THEN
        v_monthly_tax := (402500 + ((p_annual_taxable_income - 2000000) * 0.30)) / 12;
    ELSE
        v_monthly_tax := (2202500 + ((p_annual_taxable_income - 8000000) * 0.35)) / 12;
    END IF;
    
    RETURN ROUND(v_monthly_tax, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- MAIN STORED PROCEDURE: Calculate Complete Payroll
-- =====================================================
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
    regular_pay DECIMAL,
    overtime_pay DECIMAL,
    holiday_pay DECIMAL,
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
    v_regular_pay DECIMAL := 0;
    v_overtime_pay DECIMAL := 0;
    v_holiday_pay DECIMAL := 0;
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
    
    v_total_earnings := v_regular_pay + v_overtime_pay + v_holiday_pay + v_allowances + v_bonuses + v_thirteenth_month + v_sil + v_other_earnings;
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
    
    -- Return calculated values
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
        v_regular_pay,
        v_overtime_pay,
        v_holiday_pay,
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

-- =====================================================
-- PROCEDURE: Recalculate all payroll for a period
-- =====================================================
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
                "regularPay",
                "overtimePay",
                "holidayPay",
                "nightDifferential",
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
                v_calc.regular_pay,
                v_calc.overtime_pay,
                v_calc.holiday_pay,
                0,
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
                "regularPay" = EXCLUDED."regularPay",
                "overtimePay" = EXCLUDED."overtimePay",
                "holidayPay" = EXCLUDED."holidayPay",
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
-- TRIGGER: Auto-recalculate on attendance import/update
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
                "regularPay" = calc.regular_pay,
                "overtimePay" = calc.overtime_pay,
                "holidayPay" = calc.holiday_pay,
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
-- TRIGGER: Auto-recalculate on config changes
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_recalculate_payroll_on_config_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If configuration affects payroll calculations, mark for recalculation
    IF NEW.key LIKE 'rates_%' OR NEW.key LIKE 'working_hours_%' THEN
        -- Note: Full recalculation should be done via scheduled job
        -- This just logs the need for recalculation
        RAISE NOTICE 'Payroll configuration changed: %. Payroll recalculation recommended.', NEW.key;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_recalculate_payroll_on_config ON "system_settings";
CREATE TRIGGER auto_recalculate_payroll_on_config
    AFTER UPDATE ON "system_settings"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_payroll_on_config_change();

-- =====================================================
-- TRIGGER: Auto-recalculate on payroll rule changes
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_recalculate_payroll_on_rule_change()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT;
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Get current month period
    v_period_start := DATE_TRUNC('month', CURRENT_DATE);
    v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    
    -- If rule applies to all users
    IF NEW."applyToAll" = true THEN
        -- Mark all users for recalculation (should be done via background job)
        RAISE NOTICE 'Global payroll rule changed: %. All payroll recalculation recommended.', NEW.name;
    ELSE
        -- Recalculate for users with this rule assignment
        FOR v_user_id IN
            SELECT "userId" FROM "payroll_rule_assignments"
            WHERE "payrollRuleId" = NEW.id
        LOOP
            -- Update existing payroll results
            UPDATE "payroll_results" pr
            SET
                "dailyRate" = calc.daily_rate,
                "hourlyRate" = calc.hourly_rate,
                "allowances" = calc.allowances,
                "bonuses" = calc.bonuses,
                "loanDeductions" = calc.loan_deductions,
                "otherDeductions" = calc.other_deductions,
                "totalEarnings" = calc.total_earnings,
                "grossPay" = calc.gross_pay,
                "totalDeductions" = calc.total_deductions,
                "netPay" = calc.net_pay,
                "updatedAt" = NOW()
            FROM calculate_payroll_for_period(v_user_id, v_period_start, v_period_end) calc
            WHERE pr."userId" = v_user_id
            AND pr."payPeriodStart" = v_period_start
            AND pr."payPeriodEnd" = v_period_end;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_recalculate_payroll_on_rule ON "payroll_rules";
CREATE TRIGGER auto_recalculate_payroll_on_rule
    AFTER INSERT OR UPDATE ON "payroll_rules"
    FOR EACH ROW
    WHEN (NEW."isActive" = true)
    EXECUTE FUNCTION trigger_recalculate_payroll_on_rule_change();

-- =====================================================
-- Helper: Get current month payroll summary
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_month_payroll_summary()
RETURNS TABLE(
    total_employees INT,
    total_gross_pay DECIMAL,
    total_net_pay DECIMAL,
    total_deductions DECIMAL,
    avg_net_pay DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INT as total_employees,
        COALESCE(SUM("grossPay"), 0) as total_gross_pay,
        COALESCE(SUM("netPay"), 0) as total_net_pay,
        COALESCE(SUM("totalDeductions"), 0) as total_deductions,
        COALESCE(AVG("netPay"), 0) as avg_net_pay
    FROM "payroll_results"
    WHERE "payPeriodStart" = DATE_TRUNC('month', CURRENT_DATE)
    AND "payPeriodEnd" = (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION calculate_payroll_for_period IS 'Calculates complete payroll for a single user within a pay period';
COMMENT ON FUNCTION recalculate_all_payroll_for_period IS 'Recalculates payroll for all eligible employees in a pay period';
COMMENT ON FUNCTION trigger_recalculate_payroll_on_attendance IS 'Auto-recalculates payroll when attendance is imported or updated';
COMMENT ON FUNCTION trigger_recalculate_payroll_on_config_change IS 'Triggers payroll recalculation when system configs change';
COMMENT ON FUNCTION trigger_recalculate_payroll_on_rule_change IS 'Triggers payroll recalculation when payroll rules change';
