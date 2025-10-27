-- Fix calculate_payroll_for_period to call calculate_late_deductions with correct parameters

-- Drop the existing function first
DROP FUNCTION IF EXISTS calculate_payroll_for_period(TEXT, DATE, DATE) CASCADE;

CREATE OR REPLACE FUNCTION calculate_payroll_for_period(
    p_user_id TEXT,
    p_pay_period_start DATE,
    p_pay_period_end DATE
) RETURNS TABLE (
    user_id TEXT,
    days_worked INT,
    hours_worked DECIMAL,
    overtime_hours DECIMAL,
    undertime_hours DECIMAL,
    late_hours DECIMAL,
    holiday_hours DECIMAL,
    daily_rate DECIMAL,
    hourly_rate DECIMAL,
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
    v_days_worked INT := 0;
    v_hours_worked DECIMAL := 0;
    v_overtime_hours DECIMAL := 0;
    v_undertime_hours DECIMAL := 0;
    v_late_hours DECIMAL := 0;
    v_holiday_hours DECIMAL := 0;
    v_daily_rate DECIMAL := 0;
    v_hourly_rate DECIMAL := 0;
    v_regular_pay DECIMAL := 0;
    v_overtime_pay DECIMAL := 0;
    v_holiday_pay DECIMAL := 0;
    v_allowances DECIMAL := 0;
    v_bonuses DECIMAL := 0;
    v_thirteenth_month_pay DECIMAL := 0;
    v_service_incentive_leave DECIMAL := 0;
    v_other_earnings DECIMAL := 0;
    v_total_earnings DECIMAL := 0;
    v_gross_pay DECIMAL := 0;
    v_gsis DECIMAL := 0;
    v_philhealth DECIMAL := 0;
    v_pagibig DECIMAL := 0;
    v_taxable_income DECIMAL := 0;
    v_withholding_tax DECIMAL := 0;
    v_late_deductions DECIMAL := 0;
    v_undertime_deductions DECIMAL := 0;
    v_loan_deductions DECIMAL := 0;
    v_other_deductions DECIMAL := 0;
    v_total_deductions DECIMAL := 0;
    v_net_pay DECIMAL := 0;
    v_contribution_base DECIMAL := 0;
    v_annual_taxable DECIMAL := 0;
    
    -- Settings variables
    v_overtime_rate DECIMAL := 1.25;
    v_holiday_rate DECIMAL := 2.0;
    v_late_deduction_amount DECIMAL := 1.0;
    v_late_deduction_basis TEXT := 'hourly';
    v_working_hours_per_day DECIMAL := 8.0;
BEGIN
    -- Get daily rate for the user
    SELECT COALESCE(CAST(value AS DECIMAL), 0) INTO v_daily_rate
    FROM "system_settings"
    WHERE key = CONCAT('daily_rate_', p_user_id)
    AND "isActive" = true
    LIMIT 1;

    -- If no user-specific rate, try department-based rate
    IF v_daily_rate = 0 THEN
        SELECT COALESCE(CAST(ss.value AS DECIMAL), 0) INTO v_daily_rate
        FROM "users" u
        JOIN "system_settings" ss ON ss.key = CONCAT('daily_rate_dept_', LOWER(COALESCE(u.department, 'default')))
        WHERE u.id = p_user_id
        AND ss."isActive" = true
        LIMIT 1;
    END IF;

    -- If still no rate, use default
    IF v_daily_rate = 0 THEN
        SELECT COALESCE(CAST(value AS DECIMAL), 500) INTO v_daily_rate
        FROM "system_settings"
        WHERE key = 'default_daily_rate'
        AND "isActive" = true
        LIMIT 1;
    END IF;

    -- Get working hours per day from settings
    SELECT COALESCE(CAST(value AS DECIMAL), 8.0) INTO v_working_hours_per_day
    FROM "system_settings"
    WHERE key = 'working_hours_per_day'
    AND "isActive" = true
    LIMIT 1;

    -- Calculate hourly rate
    v_hourly_rate := v_daily_rate / v_working_hours_per_day;

    -- Get overtime rate from settings
    SELECT COALESCE(CAST(value AS DECIMAL), 1.25) INTO v_overtime_rate
    FROM "system_settings"
    WHERE key = 'overtime_rate'
    AND "isActive" = true
    LIMIT 1;

    -- Get holiday rate from settings
    SELECT COALESCE(CAST(value AS DECIMAL), 2.0) INTO v_holiday_rate
    FROM "system_settings"
    WHERE key = 'holiday_rate'
    AND "isActive" = true
    LIMIT 1;

    -- Get late deduction settings
    SELECT COALESCE(CAST(value AS DECIMAL), 1.0) INTO v_late_deduction_amount
    FROM "system_settings"
    WHERE key = 'late_deduction_amount'
    AND "isActive" = true
    LIMIT 1;

    SELECT COALESCE(value, 'hourly') INTO v_late_deduction_basis
    FROM "system_settings"
    WHERE key = 'late_deduction_basis'
    AND "isActive" = true
    LIMIT 1;

    -- Calculate days worked from attendance records
    SELECT COUNT(DISTINCT date) INTO v_days_worked
    FROM "attendance_records"
    WHERE "userId" = p_user_id
    AND date >= p_pay_period_start
    AND date <= p_pay_period_end
    AND status = 'APPROVED'
    AND "isAbsent" = false;

    -- Calculate hours worked (including overtime tracking)
    SELECT 
        COALESCE(SUM(CAST("hoursWorked" AS DECIMAL)), 0),
        COALESCE(SUM(
            CASE 
                WHEN CAST("hoursWorked" AS DECIMAL) > v_working_hours_per_day 
                THEN CAST("hoursWorked" AS DECIMAL) - v_working_hours_per_day
                ELSE 0
            END
        ), 0)
    INTO v_hours_worked, v_overtime_hours
    FROM "attendance_records"
    WHERE "userId" = p_user_id
    AND date >= p_pay_period_start
    AND date <= p_pay_period_end
    AND status = 'APPROVED'
    AND "isAbsent" = false;

    -- Calculate undertime hours (if hours worked on a day is less than expected)
    SELECT COALESCE(SUM(
        CASE 
            WHEN CAST("hoursWorked" AS DECIMAL) < v_working_hours_per_day AND "isAbsent" = false
            THEN v_working_hours_per_day - CAST("hoursWorked" AS DECIMAL)
            ELSE 0
        END
    ), 0) INTO v_undertime_hours
    FROM "attendance_records"
    WHERE "userId" = p_user_id
    AND date >= p_pay_period_start
    AND date <= p_pay_period_end
    AND status = 'APPROVED';

    -- Calculate late hours from attendance records
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (
            CASE 
                WHEN "isLate" = true AND "timeIn" IS NOT NULL 
                THEN "timeIn" - DATE_TRUNC('day', "timeIn") - INTERVAL '8 hours'
                ELSE INTERVAL '0'
            END
        )) / 3600), 0) INTO v_late_hours
    FROM "attendance_records"
    WHERE "userId" = p_user_id
    AND date >= p_pay_period_start
    AND date <= p_pay_period_end
    AND status = 'APPROVED'
    AND "isLate" = true;

    -- Calculate holiday hours from holidays table
    SELECT COALESCE(SUM(v_working_hours_per_day), 0) INTO v_holiday_hours
    FROM "holidays" h
    WHERE h.date >= p_pay_period_start
    AND h.date <= p_pay_period_end
    AND EXISTS (
        SELECT 1 FROM "attendance_records" ar
        WHERE ar."userId" = p_user_id
        AND ar.date = h.date
        AND ar.status = 'APPROVED'
        AND ar."isAbsent" = false
    );

    -- Calculate regular pay: days_worked × daily_rate
    v_regular_pay := v_days_worked * v_daily_rate;

    -- Calculate overtime pay
    v_overtime_pay := v_overtime_hours * v_hourly_rate * v_overtime_rate;

    -- Calculate holiday pay
    v_holiday_pay := v_holiday_hours * v_hourly_rate * v_holiday_rate;

    -- Get allowances from payroll rules
    SELECT COALESCE(SUM(CAST(pr.amount AS DECIMAL)), 0) INTO v_allowances
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type IN ('allowance', 'fixed_allowance', 'transportation', 'meal');

    -- Get bonuses from payroll rules
    SELECT COALESCE(SUM(CAST(pr.amount AS DECIMAL)), 0) INTO v_bonuses
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type = 'bonus';

    -- Calculate total earnings
    v_total_earnings := v_regular_pay + v_overtime_pay + v_holiday_pay + v_allowances + v_bonuses;

    -- Calculate gross pay
    v_gross_pay := v_total_earnings;

    -- Calculate contribution base (for government deductions)
    v_contribution_base := v_regular_pay + v_allowances;
    
    -- Calculate government contributions with proper parameters
    v_gsis := calculate_gsis_contribution(v_contribution_base, 9.0, 0, 999999);
    v_philhealth := calculate_philhealth_contribution(v_contribution_base, 2.5, 500, 5000, 10000, 100000);
    v_pagibig := calculate_pagibig_contribution(v_contribution_base, 2.0, 100, 200, 1000, 5000);
    
    -- Calculate taxable income
    v_taxable_income := v_gross_pay - v_gsis - v_philhealth - v_pagibig;
    
    -- Calculate annual taxable for withholding tax
    v_annual_taxable := v_taxable_income * 12;
    v_withholding_tax := calculate_withholding_tax(v_annual_taxable);
    
    -- Calculate late deductions with correct parameters (5 parameters total)
    v_late_deductions := calculate_late_deductions(
        v_late_hours, 
        v_hourly_rate, 
        v_daily_rate,
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
    AND pr.type IN ('loan', 'salary_loan', 'cash_advance');

    -- Get other deductions
    SELECT COALESCE(SUM(CAST(pr.amount AS DECIMAL)), 0) INTO v_other_deductions
    FROM "payroll_rule_assignments" pra
    JOIN "payroll_rules" pr ON pra."payrollRuleId" = pr.id
    WHERE pra."userId" = p_user_id
    AND pr."isActive" = true
    AND pr.type IN ('deduction', 'other_deduction');

    -- Calculate total deductions
    v_total_deductions := v_gsis + v_philhealth + v_pagibig + v_withholding_tax + 
                          v_late_deductions + v_undertime_deductions + v_loan_deductions + v_other_deductions;

    -- Calculate net pay
    v_net_pay := v_gross_pay - v_total_deductions;

    -- Return results
    RETURN QUERY SELECT
        p_user_id,
        v_days_worked,
        v_hours_worked,
        v_overtime_hours,
        v_undertime_hours,
        v_late_hours,
        v_holiday_hours,
        v_daily_rate,
        v_hourly_rate,
        v_regular_pay,
        v_overtime_pay,
        v_holiday_pay,
        v_allowances,
        v_bonuses,
        v_thirteenth_month_pay,
        v_service_incentive_leave,
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

COMMENT ON FUNCTION calculate_payroll_for_period IS 'Calculates complete payroll for a single user within a pay period. Fixed to call calculate_late_deductions with correct parameters.';
