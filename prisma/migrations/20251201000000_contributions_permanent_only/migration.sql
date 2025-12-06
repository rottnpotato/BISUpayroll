-- Update calculate_late_deductions to handle minutes for per_minute basis
CREATE OR REPLACE FUNCTION calculate_late_deductions(
    p_late_minutes DECIMAL,
    p_hourly_rate DECIMAL DEFAULT 0,
    p_daily_rate DECIMAL DEFAULT 0,
    p_deduction_amount DECIMAL DEFAULT 0,
    p_deduction_basis TEXT DEFAULT 'fixed'
) RETURNS DECIMAL AS $$
BEGIN
    IF p_late_minutes <= 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND(
        CASE p_deduction_basis
            WHEN 'fixed' THEN p_late_minutes * p_deduction_amount
            WHEN 'hourly' THEN p_late_minutes * p_hourly_rate * p_deduction_amount
            WHEN 'daily' THEN p_late_minutes * p_daily_rate * p_deduction_amount
            WHEN 'per_minute' THEN p_late_minutes * (p_hourly_rate / 60)
            ELSE 0
        END,
        2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_late_deductions IS 'Calculates late deductions. For per_minute basis, uses (hourly_rate / 60) * late_minutes.';

DROP FUNCTION IF EXISTS calculate_payroll_for_period(TEXT, DATE, DATE) CASCADE;

CREATE OR REPLACE FUNCTION calculate_payroll_for_period(
    p_user_id TEXT,
    p_pay_period_start DATE,
    p_pay_period_end DATE
)
RETURNS TABLE (
    user_id TEXT,
    daily_rate DECIMAL,
    hourly_rate DECIMAL,
    days_worked INTEGER,
    hours_worked DECIMAL,
    overtime_hours DECIMAL,
    undertime_minutes DECIMAL,
    late_minutes DECIMAL,
    holiday_hours DECIMAL,
    night_shift_hours DECIMAL,
    overload_hours DECIMAL,
    regular_pay DECIMAL,
    overtime_pay DECIMAL,
    holiday_pay DECIMAL,
    night_differential DECIMAL,
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
    v_hourly_rate DECIMAL := 0;
    v_days_worked INTEGER := 0;
    v_hours_worked DECIMAL := 0;
    v_overtime_hours DECIMAL := 0;
    v_undertime_minutes DECIMAL := 0;
    v_late_minutes DECIMAL := 0;
    v_holiday_hours DECIMAL := 0;
    v_night_shift_hours DECIMAL := 0;
    v_overload_hours DECIMAL := 0;
    v_regular_pay DECIMAL := 0;
    v_overtime_pay DECIMAL := 0;
    v_holiday_pay DECIMAL := 0;
    v_night_differential DECIMAL := 0;
    v_overload_pay DECIMAL := 0;
    v_allowances DECIMAL := 0;
    v_bonuses DECIMAL := 0;
    v_thirteenth_month_pay DECIMAL := 0;
    v_service_incentive_leave DECIMAL := 0;
    v_other_earnings DECIMAL := 0;
    v_total_earnings DECIMAL := 0;
    v_gross_pay DECIMAL := 0;
    v_gsis_contribution DECIMAL := 0;
    v_philhealth_contribution DECIMAL := 0;
    v_pagibig_contribution DECIMAL := 0;
    v_taxable_income DECIMAL := 0;
    v_withholding_tax DECIMAL := 0;
    v_late_deductions DECIMAL := 0;
    v_undertime_deductions DECIMAL := 0;
    v_loan_deductions DECIMAL := 0;
    v_other_deductions DECIMAL := 0;
    v_total_deductions DECIMAL := 0;
    v_net_pay DECIMAL := 0;
    v_daily_hours DECIMAL := 8;
    v_monthly_salary_basis DECIMAL := 0;
    v_overtime_rate_1 DECIMAL := 1.25;
    v_overtime_rate_2 DECIMAL := 1.5;
    v_regular_holiday_rate DECIMAL := 2.0;
    v_special_holiday_rate DECIMAL := 1.3;
    v_late_deduction_amount DECIMAL := 0;
    v_late_deduction_basis TEXT := 'hourly';
    v_employment_status TEXT := '';
    v_taxable_regular_pay DECIMAL := 0;
BEGIN
    -- Get user's employment status
    SELECT COALESCE(status::TEXT, 'CONTRACTUAL') INTO v_employment_status
    FROM "users"
    WHERE id = p_user_id;

    -- 1. Get daily rate - FIRST check user profile, then fall back to payroll rules
    SELECT COALESCE("dailyRate", 0) INTO v_daily_rate
    FROM "users"
    WHERE id = p_user_id;
    
    -- If no user daily rate, get from payroll_rules assigned to user
    IF v_daily_rate = 0 OR v_daily_rate IS NULL THEN
        SELECT COALESCE(SUM(CAST(pr.amount AS DECIMAL)), 0) INTO v_daily_rate
        FROM "payroll_rules" pr
        INNER JOIN "payroll_rule_assignments" pra ON pr.id = pra."payrollRuleId"
        WHERE pra."userId" = p_user_id
            AND pr."isActive" = true
            AND pr.type = 'daily_rate';
    END IF;
    
    -- If still no rate, get from global payroll_rules
    IF v_daily_rate = 0 OR v_daily_rate IS NULL THEN
        SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) INTO v_daily_rate
        FROM "payroll_rules"
        WHERE "isActive" = true
            AND type = 'daily_rate'
            AND "applyToAll" = true;
    END IF;
    
    -- Calculate hourly rate
    v_hourly_rate := calculate_hourly_rate(v_daily_rate, v_daily_hours);
    
    -- Monthly salary basis for contributions (daily_rate * 22 working days)
    v_monthly_salary_basis := v_daily_rate * 22;
    
    -- 2. Get attendance data
    SELECT 
        COALESCE(COUNT(DISTINCT date), 0),
        COALESCE(SUM("hoursWorked"), 0)
    INTO v_days_worked, v_hours_worked
    FROM "attendance_records"
    WHERE "userId" = p_user_id
        AND date BETWEEN p_pay_period_start AND p_pay_period_end
        AND status = 'APPROVED';
    
    -- 3. Get approved overtime
    SELECT COALESCE(SUM("hoursWorked"), 0) INTO v_overtime_hours
    FROM "overtime_requests"
    WHERE "userId" = p_user_id
        AND "startTime"::date BETWEEN p_pay_period_start AND p_pay_period_end
        AND status = 'APPROVED';
    
    -- 4. Get approved overload
    SELECT COALESCE(SUM("hoursWorked"), 0) INTO v_overload_hours
    FROM "overload_records"
    WHERE "userId" = p_user_id
        AND "startTime"::date BETWEEN p_pay_period_start AND p_pay_period_end
        AND status = 'APPROVED';
    
    -- 5. Get late minutes and undertime minutes from attendance records
    -- These are already calculated and stored in the attendance_records table
    -- by the attendance import process using employee-specific schedules
    SELECT 
        COALESCE(SUM(COALESCE(ar."lateMinutes", 0)), 0),
        COALESCE(SUM(COALESCE(ar."undertimeMinutes", 0)), 0)
    INTO v_late_minutes, v_undertime_minutes
    FROM "attendance_records" ar
    WHERE ar."userId" = p_user_id
        AND ar.date BETWEEN p_pay_period_start AND p_pay_period_end
        AND ar.status = 'APPROVED'
        AND ar."isAbsent" = false;
    
    -- 6. Get payroll rule configuration
    SELECT 
        COALESCE(MAX(CASE WHEN type = 'late_deduction_amount' THEN CAST(amount AS DECIMAL) END), 0),
        COALESCE(MAX(CASE WHEN type = 'late_deduction_basis' THEN description END), 'hourly')
    INTO v_late_deduction_amount, v_late_deduction_basis
    FROM "payroll_rules"
    WHERE "isActive" = true;
    
    -- 7. Calculate earnings
    -- Regular pay = days_worked * daily_rate (not hours-based)
    v_regular_pay := v_days_worked * v_daily_rate;
    
    -- Overtime pay (approved overtime requests)
    v_overtime_pay := calculate_overtime_pay(v_overtime_hours, v_hourly_rate, v_overtime_rate_1, v_overtime_rate_2);
    
    -- Overload pay (approved overload records)
    v_overload_pay := v_overload_hours * v_hourly_rate * 1.25;
    
    -- Apply earnings rules (allowances, bonuses, etc.)
    SELECT 
        COALESCE(SUM(CASE WHEN earnings_calc.type = 'allowance' THEN earnings_calc.calculated_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN earnings_calc.type = 'bonus' THEN earnings_calc.calculated_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN earnings_calc.type = 'thirteenth_month' THEN earnings_calc.calculated_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN earnings_calc.type = 'leave_benefit' THEN earnings_calc.calculated_amount ELSE 0 END), 0)
    INTO v_allowances, v_bonuses, v_thirteenth_month_pay, v_service_incentive_leave
    FROM (
        SELECT 
            pr.type,
            CASE 
                WHEN pr."isPercentage" = true THEN 
                    (v_daily_rate * 22) * (CAST(pr.amount AS DECIMAL) / 100)
                ELSE 
                    CAST(pr.amount AS DECIMAL)
            END AS calculated_amount
        FROM "payroll_rules" pr
        LEFT JOIN "payroll_rule_assignments" pra ON pr.id = pra."payrollRuleId"
        WHERE pr."isActive" = true
            AND pr.type IN ('bonus', 'allowance', 'additional', 'thirteenth_month', 'leave_benefit')
            AND (pr."applyToAll" = true OR pra."userId" = p_user_id)
    ) AS earnings_calc;
    
    -- Total earnings
    v_total_earnings := v_regular_pay + v_overtime_pay + v_overload_pay + v_allowances + v_bonuses + 
                        v_thirteenth_month_pay + v_service_incentive_leave + v_other_earnings;
    v_gross_pay := v_total_earnings;
    
    -- 8. Calculate deductions
    -- Government contributions (GSIS, PhilHealth, Pag-IBIG) - ONLY for PERMANENT employees
    IF v_employment_status = 'PERMANENT' THEN
        v_gsis_contribution := calculate_gsis_contribution(v_monthly_salary_basis);
        v_philhealth_contribution := calculate_philhealth_contribution(v_monthly_salary_basis);
        v_pagibig_contribution := calculate_pagibig_contribution(v_monthly_salary_basis);
    ELSE
        -- Non-permanent employees do not have government contributions
        v_gsis_contribution := 0;
        v_philhealth_contribution := 0;
        v_pagibig_contribution := 0;
    END IF;
    
    -- Late deductions (minutes * hourly_rate / 60)
    v_late_deductions := calculate_late_deductions(v_late_minutes, v_hourly_rate, v_daily_rate, v_late_deduction_amount, v_late_deduction_basis);
    
    -- Undertime deductions (minutes * hourly_rate / 60)
    v_undertime_deductions := v_undertime_minutes * (v_hourly_rate / 60);
    
    -- Calculate taxable regular pay (regular pay only, after late/undertime deductions)
    -- This is used for annualization to avoid over-taxing irregular overtime/bonuses
    v_taxable_regular_pay := GREATEST(0, v_regular_pay - v_late_deductions - v_undertime_deductions);
    
    -- Taxable income
    v_taxable_income := v_gross_pay - v_gsis_contribution - v_philhealth_contribution - 
                        v_pagibig_contribution - v_thirteenth_month_pay - v_service_incentive_leave;
    
    -- Withholding tax (based on regular pay after late/undertime, not total gross)
    -- This ensures tax is calculated on base salary only, not irregular overtime/bonuses
    v_withholding_tax := calculate_withholding_tax(
        v_taxable_regular_pay,
        v_gsis_contribution,
        v_philhealth_contribution,
        v_pagibig_contribution,
        v_thirteenth_month_pay,
        v_service_incentive_leave
    );
    
    -- Apply deduction rules (loans, etc.)
    SELECT COALESCE(SUM(deduction_calc.calculated_amount), 0) INTO v_loan_deductions
    FROM (
        SELECT 
            CASE 
                WHEN pr."isPercentage" = true THEN 
                    v_gross_pay * (CAST(pr.amount AS DECIMAL) / 100)
                ELSE 
                    CAST(pr.amount AS DECIMAL)
            END AS calculated_amount
        FROM "payroll_rules" pr
        LEFT JOIN "payroll_rule_assignments" pra ON pr.id = pra."payrollRuleId"
        WHERE pr."isActive" = true
            AND pr.type = 'deduction'
            AND (pr."applyToAll" = true OR pra."userId" = p_user_id)
    ) AS deduction_calc;
    
    -- Total deductions
    v_total_deductions := v_gsis_contribution + v_philhealth_contribution + v_pagibig_contribution + 
                          v_withholding_tax + v_late_deductions + v_undertime_deductions + 
                          v_loan_deductions + v_other_deductions;
    
    -- Net pay
    v_net_pay := GREATEST(0, v_gross_pay - v_total_deductions);
    
    -- Return results
    RETURN QUERY SELECT
        p_user_id,
        v_daily_rate,
        v_hourly_rate,
        v_days_worked,
        v_hours_worked,
        v_overtime_hours,
        v_undertime_minutes,
        v_late_minutes,
        v_holiday_hours,
        v_night_shift_hours,
        v_overload_hours,
        v_regular_pay,
        v_overtime_pay,
        v_holiday_pay,
        v_night_differential,
        v_overload_pay,
        v_allowances,
        v_bonuses,
        v_thirteenth_month_pay,
        v_service_incentive_leave,
        v_other_earnings,
        v_total_earnings,
        v_gross_pay,
        v_gsis_contribution,
        v_philhealth_contribution,
        v_pagibig_contribution,
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

COMMENT ON FUNCTION calculate_payroll_for_period IS 'Calculates complete payroll. Government contributions (GSIS, PhilHealth, Pag-IBIG) are ONLY applied to PERMANENT employees. Late deductions = (hourly_rate / 60) * late_minutes. Regular pay = days_worked × daily_rate.';

