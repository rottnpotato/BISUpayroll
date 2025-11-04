-- =====================================================
-- FIX: Remove automatic overtime calculation from attendance
-- =====================================================
-- Issue: The stored procedure was automatically calculating overtime
-- from attendance hours > 8, but overtime should only be paid when
-- explicitly requested and approved by admin.
--
-- Changes:
-- 1. Remove automatic overtime calculation loop
-- 2. Keep only approved overload pay
-- 3. Regular pay = actual hours worked (not reduced by overtime/holiday)
-- 4. Fix gross_pay and total_earnings calculation

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
    -- NOTE: We do NOT auto-calculate overtime here
    -- Overtime/Overload must be explicitly requested and approved
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
        
        -- Calculate undertime (hours less than daily requirement)
        IF rec.hours < v_daily_hours AND NOT rec."isAbsent" THEN
            v_undertime_hours := v_undertime_hours + (v_daily_hours - rec.hours);
        END IF;
        
        -- Count late instances (not hours)
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
    
    -- Calculate overload pay from APPROVED overload records only
    SELECT * INTO overload_rec FROM calculate_overload_pay(p_user_id, p_pay_period_start, p_pay_period_end);
    v_overload_hours := overload_rec.total_hours;
    v_overload_pay := overload_rec.total_pay;
    
    -- Calculate earnings
    -- Regular pay = hours worked × hourly rate (no reduction for overtime since it's not auto-calculated)
    v_regular_pay := v_hours_worked * v_hourly_rate;
    
    -- Overtime pay = 0 (must be requested and approved separately)
    -- In the future, create OvertimeRequest model and calculate from approved requests
    v_overtime_pay := 0;
    
    -- Holiday pay calculation (if needed)
    v_holiday_pay := calculate_holiday_pay(v_holiday_hours, v_hourly_rate, 'REGULAR', v_regular_holiday_rate, v_special_holiday_rate);
    
    -- Get allowances from payroll rules
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
    
    -- Calculate total earnings and gross pay
    v_total_earnings := v_regular_pay + v_overtime_pay + v_holiday_pay + v_overload_pay + 
                       v_allowances + v_bonuses + v_thirteenth_month + v_sil + v_other_earnings;
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

COMMENT ON FUNCTION calculate_payroll_for_period IS 'Calculates complete payroll for a single user within a pay period. Overtime is NOT auto-calculated - only approved overload records are included. Regular pay is based on actual hours worked.';
