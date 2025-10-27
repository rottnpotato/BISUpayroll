-- Fix regular pay calculation to be based on days worked instead of hours
-- This ensures monthly salary is: (days worked × daily rate) + additional earnings - deductions

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
    -- FIXED: Use days worked instead of hours for base pay calculation
    v_regular_pay := v_days_worked * v_daily_rate;
    v_overtime_pay := calculate_overtime_pay(v_overtime_hours, v_hourly_rate, v_overtime_rate1, v_overtime_rate2);
    v_holiday_pay := calculate_holiday_pay(v_holiday_hours, v_hourly_rate, 'REGULAR', v_regular_holiday_rate, v_special_holiday_rate);
    
    -- Get allowances and bonuses from payroll rules
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
    
    -- Calculate totals
    v_total_earnings := v_regular_pay + v_overtime_pay + v_holiday_pay + v_allowances + v_bonuses;
    v_gross_pay := v_total_earnings;
    
    -- Calculate contribution base (for government deductions)
    v_contribution_base := v_regular_pay + v_allowances;
    
    -- Calculate government contributions
    v_gsis := calculate_gsis_contribution(v_contribution_base);
    v_philhealth := calculate_philhealth_contribution(v_contribution_base);
    v_pagibig := calculate_pagibig_contribution(v_contribution_base);
    
    -- Calculate taxable income
    v_taxable_income := v_gross_pay - v_gsis - v_philhealth - v_pagibig;
    
    -- Calculate annual taxable for withholding tax
    v_annual_taxable := v_taxable_income * 12;
    v_withholding_tax := calculate_withholding_tax(v_annual_taxable) / 12;
    
    -- Calculate late deductions
    v_late_deductions := calculate_late_deductions(
        v_late_hours::INT, 
        v_hourly_rate, 
        v_late_deduction_amount, 
        v_late_deduction_basis
    );
    
    -- Calculate undertime deductions
    v_undertime_deductions := v_undertime_hours * v_hourly_rate;
    
    -- Get loan deductions from payroll rules
    SELECT COALESCE(SUM(CAST(pr.amount AS DECIMAL)), 0) INTO v_loan_deductions
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type = 'deduction'
    AND LOWER(pr.name) LIKE '%loan%';
    
    -- Add global loan deductions
    SELECT COALESCE(v_loan_deductions + SUM(CAST(amount AS DECIMAL)), v_loan_deductions) 
    INTO v_loan_deductions
    FROM "payroll_rules"
    WHERE "applyToAll" = true
    AND "isActive" = true
    AND type = 'deduction'
    AND LOWER(name) LIKE '%loan%';
    
    -- Get other deductions from payroll rules (excluding government and loan deductions)
    SELECT COALESCE(SUM(
        CASE 
            WHEN pr."isPercentage" THEN v_gross_pay * (CAST(pr.amount AS DECIMAL) / 100)
            ELSE CAST(pr.amount AS DECIMAL)
        END
    ), 0) INTO v_other_deductions
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type = 'deduction'
    AND LOWER(pr.name) NOT LIKE '%loan%'
    AND LOWER(pr.name) NOT LIKE '%sss%'
    AND LOWER(pr.name) NOT LIKE '%gsis%'
    AND LOWER(pr.name) NOT LIKE '%philhealth%'
    AND LOWER(pr.name) NOT LIKE '%pag%ibig%'
    AND LOWER(pr.name) NOT LIKE '%tax%';
    
    -- Add global other deductions
    SELECT COALESCE(v_other_deductions + SUM(
        CASE 
            WHEN "isPercentage" THEN v_gross_pay * (CAST(amount AS DECIMAL) / 100)
            ELSE CAST(amount AS DECIMAL)
        END
    ), v_other_deductions) INTO v_other_deductions
    FROM "payroll_rules"
    WHERE "applyToAll" = true
    AND "isActive" = true
    AND type = 'deduction'
    AND LOWER(name) NOT LIKE '%loan%'
    AND LOWER(name) NOT LIKE '%sss%'
    AND LOWER(name) NOT LIKE '%gsis%'
    AND LOWER(name) NOT LIKE '%philhealth%'
    AND LOWER(name) NOT LIKE '%pag%ibig%'
    AND LOWER(name) NOT LIKE '%tax%';
    
    -- Calculate total deductions
    v_total_deductions := v_gsis + v_philhealth + v_pagibig + v_withholding_tax + 
                         v_late_deductions + v_undertime_deductions + v_loan_deductions + v_other_deductions;
    
    -- Calculate net pay
    v_net_pay := v_gross_pay - v_total_deductions;
    
    -- Return results
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

COMMENT ON FUNCTION calculate_payroll_for_period IS 'Calculates complete payroll for a single user within a pay period. Base pay now calculated as days_worked × daily_rate for accurate monthly salary computation.';
