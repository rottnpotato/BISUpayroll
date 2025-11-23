-- Fix payroll calculation rules to support percentage-based deductions and standardize contribution sources
-- This migration updates the calculate_payroll_for_period function to:
-- 1. Correctly handle percentage-based Allowances and Bonuses (based on Regular Pay)
-- 2. Correctly handle percentage-based Deductions (based on Gross Pay)
-- 3. Enforce a singular source for Mandatory Contributions (GSIS, PhilHealth, Pag-IBIG, Tax) via their specific functions/tables
-- 4. Fix withholding tax calculation: Gross Annual Income = daily_rate * 22 * 12, then subtract contributions and non-taxable benefits

-- FUNCTION: Calculate withholding tax based on Philippine Tax Brackets
-- =====================================================
DROP FUNCTION IF EXISTS calculate_withholding_tax(DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS calculate_withholding_tax(DECIMAL) CASCADE;

CREATE OR REPLACE FUNCTION calculate_withholding_tax(
    p_daily_rate DECIMAL,
    p_gsis DECIMAL DEFAULT 0,
    p_philhealth DECIMAL DEFAULT 0,
    p_pagibig DECIMAL DEFAULT 0,
    p_thirteenth_month DECIMAL DEFAULT 0,
    p_sil DECIMAL DEFAULT 0
) RETURNS DECIMAL AS $$
DECLARE
    v_gross_annual_income DECIMAL;
    v_monthly_contributions DECIMAL;
    v_monthly_non_taxable DECIMAL;
    v_annual_contributions DECIMAL;
    v_annual_non_taxable DECIMAL;
    v_net_taxable_income DECIMAL;
    v_annual_tax DECIMAL := 0;
    v_monthly_tax DECIMAL := 0;
BEGIN
    -- Calculate Gross Annual Income = base pay * 22 (days/month) * 12 (months/year)
    v_gross_annual_income := p_daily_rate * 22 * 12;
    
    -- Calculate annual mandatory contributions
    v_monthly_contributions := p_gsis + p_philhealth + p_pagibig;
    v_annual_contributions := v_monthly_contributions * 12;
    
    -- Calculate annual non-taxable benefits
    v_monthly_non_taxable := p_thirteenth_month + p_sil;
    v_annual_non_taxable := v_monthly_non_taxable * 12;
    
    -- Net Taxable Income = Gross Annual Income - Mandatory Contributions - Non-Taxable Benefits
    v_net_taxable_income := v_gross_annual_income - v_annual_contributions - v_annual_non_taxable;
    
    -- Apply Philippine Tax Brackets (2025)
    IF v_net_taxable_income <= 250000 THEN
        v_annual_tax := 0;
    ELSIF v_net_taxable_income <= 400000 THEN
        v_annual_tax := (v_net_taxable_income - 250000) * 0.15;
    ELSIF v_net_taxable_income <= 800000 THEN
        v_annual_tax := 22500 + ((v_net_taxable_income - 400000) * 0.20);
    ELSIF v_net_taxable_income <= 2000000 THEN
        v_annual_tax := 102500 + ((v_net_taxable_income - 800000) * 0.25);
    ELSIF v_net_taxable_income <= 8000000 THEN
        v_annual_tax := 402500 + ((v_net_taxable_income - 2000000) * 0.30);
    ELSE
        v_annual_tax := 2202500 + ((v_net_taxable_income - 8000000) * 0.35);
    END IF;
    
    -- Convert annual tax to monthly
    v_monthly_tax := v_annual_tax / 12;
    
    RETURN ROUND(v_monthly_tax, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS calculate_payroll_for_period(text,date,date) CASCADE;

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
    v_gsis DECIMAL := 0;
    v_philhealth DECIMAL := 0;
    v_pagibig DECIMAL := 0;
    v_taxable_income DECIMAL;
    v_withholding_tax DECIMAL := 0;
    v_late_deductions DECIMAL := 0;
    v_undertime_deductions DECIMAL := 0;
    v_loan_deductions DECIMAL := 0;
    v_other_deductions DECIMAL := 0;
    v_total_deductions DECIMAL;
    v_net_pay DECIMAL;
    v_daily_hours DECIMAL := 8;
    v_monthly_salary_basis DECIMAL;
    
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
    
    -- Calculate Monthly Salary Basis (Estimated as Daily Rate * 22 days)
    -- This is used for contribution bracket lookups
    v_monthly_salary_basis := v_daily_rate * 22;

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
            SELECT 1 FROM "holidays" h
            WHERE DATE(h.date) = DATE(rec.date)
        ) THEN
            v_holiday_hours := v_holiday_hours + rec.hours;
        END IF;
    END LOOP;
    
    -- Calculate earnings
    v_regular_pay := (v_hours_worked - v_overtime_hours - v_holiday_hours) * v_hourly_rate;
    v_overtime_pay := calculate_overtime_pay(v_overtime_hours, v_hourly_rate, v_overtime_rate1, v_overtime_rate2);
    v_holiday_pay := calculate_holiday_pay(v_holiday_hours, v_hourly_rate, 'REGULAR', v_regular_holiday_rate, v_special_holiday_rate);
    
    -- Get allowances from payroll rules
    -- FIX: Handle percentage based allowances (based on Regular Pay)
    SELECT COALESCE(SUM(
        CASE 
            WHEN pr."isPercentage" THEN v_regular_pay * (CAST(pr.amount AS DECIMAL) / 100)
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
            WHEN "isPercentage" THEN v_regular_pay * (CAST(amount AS DECIMAL) / 100)
            ELSE CAST(amount AS DECIMAL)
        END
    ), v_allowances) INTO v_allowances
    FROM "payroll_rules"
    WHERE "applyToAll" = true
    AND "isActive" = true
    AND type = 'allowance';
    
    -- Get bonuses
    -- FIX: Handle percentage based bonuses (based on Regular Pay)
    SELECT COALESCE(SUM(
        CASE 
            WHEN pr."isPercentage" THEN v_regular_pay * (CAST(pr.amount AS DECIMAL) / 100)
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
            WHEN "isPercentage" THEN v_regular_pay * (CAST(amount AS DECIMAL) / 100)
            ELSE CAST(amount AS DECIMAL)
        END
    ), v_bonuses) INTO v_bonuses
    FROM "payroll_rules"
    WHERE "applyToAll" = true
    AND "isActive" = true
    AND type = 'bonus';
    
    v_total_earnings := v_regular_pay + v_overtime_pay + v_holiday_pay + v_allowances + v_bonuses + v_thirteenth_month + v_sil + v_other_earnings;
    v_gross_pay := v_total_earnings;
    
    -- Calculate Mandatory Contributions based on Monthly Salary Basis
    -- SINGULAR SOURCE: Always use the specific functions for these contributions
    v_gsis := calculate_gsis_contribution(v_monthly_salary_basis);
    v_philhealth := calculate_philhealth_contribution(v_monthly_salary_basis);
    v_pagibig := calculate_pagibig_contribution(v_monthly_salary_basis);
    
    -- Calculate taxable income (for display purposes)
    v_taxable_income := v_gross_pay - v_gsis - v_philhealth - v_pagibig - v_thirteenth_month - v_sil;
    
    -- Calculate Withholding Tax using the correct formula:
    -- Gross Annual Income = daily_rate * 22 * 12
    -- Net Taxable Income = Gross Annual Income - Annual Contributions - Non-Taxable Benefits
    v_withholding_tax := calculate_withholding_tax(
        v_daily_rate,
        v_gsis,
        v_philhealth,
        v_pagibig,
        v_thirteenth_month,
        v_sil
    );
    
    -- Calculate deductions
    v_late_deductions := calculate_late_deductions(v_late_hours, v_hourly_rate, v_daily_rate, v_late_deduction_amount, v_late_deduction_basis);
    v_undertime_deductions := v_undertime_hours * v_hourly_rate;
    
    -- Get loan/other deductions from payroll rules
    -- FIX: Handle percentage based deductions (based on Gross Pay)
    -- EXCLUDE: Mandatory contributions to avoid double counting
    SELECT COALESCE(SUM(
        CASE 
            WHEN pr."isPercentage" THEN v_gross_pay * (CAST(pr.amount AS DECIMAL) / 100)
            ELSE CAST(pr.amount AS DECIMAL)
        END
    ), 0) INTO v_loan_deductions
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type = 'deduction'
    AND pr.name NOT ILIKE '%GSIS%' 
    AND pr.name NOT ILIKE '%PhilHealth%' 
    AND pr.name NOT ILIKE '%Pag-IBIG%'
    AND pr.name NOT ILIKE '%Tax%';
    
    -- Add global deductions
    SELECT COALESCE(v_loan_deductions + SUM(
        CASE 
            WHEN "isPercentage" THEN v_gross_pay * (CAST(amount AS DECIMAL) / 100)
            ELSE CAST(amount AS DECIMAL)
        END
    ), v_loan_deductions) INTO v_loan_deductions
    FROM "payroll_rules"
    WHERE "applyToAll" = true
    AND "isActive" = true
    AND type = 'deduction'
    AND name NOT ILIKE '%GSIS%' 
    AND name NOT ILIKE '%PhilHealth%' 
    AND name NOT ILIKE '%Pag-IBIG%'
    AND name NOT ILIKE '%Tax%';
    
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
