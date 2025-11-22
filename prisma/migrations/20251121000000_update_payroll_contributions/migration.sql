-- Update GSIS Contribution Function to use configuration tables
CREATE OR REPLACE FUNCTION calculate_gsis_contribution(
    p_salary_base DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_contribution DECIMAL := 0;
    v_bracket RECORD;
BEGIN
    -- Try to find a matching bracket
    SELECT * INTO v_bracket
    FROM "contribution_brackets"
    WHERE "contributionType" = 'gsis'
    AND "isActive" = true
    AND p_salary_base >= "salaryMin"
    AND p_salary_base <= "salaryMax"
    ORDER BY priority DESC, "salaryMin" DESC
    LIMIT 1;

    IF v_bracket IS NOT NULL THEN
        -- Assuming rate is stored as decimal (e.g. 0.09 for 9%)
        v_contribution := p_salary_base * v_bracket."employeeRate";
        
        -- Apply min/max contribution limits if they exist
        IF v_bracket."minContribution" IS NOT NULL THEN
            v_contribution := GREATEST(v_contribution, v_bracket."minContribution");
        END IF;
        
        IF v_bracket."maxContribution" IS NOT NULL THEN
            v_contribution := LEAST(v_contribution, v_bracket."maxContribution");
        END IF;
    END IF;

    RETURN ROUND(v_contribution, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Update PhilHealth Contribution Function to use configuration tables
CREATE OR REPLACE FUNCTION calculate_philhealth_contribution(
    p_salary_base DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_contribution DECIMAL := 0;
    v_bracket RECORD;
BEGIN
    -- Try to find a matching bracket
    SELECT * INTO v_bracket
    FROM "contribution_brackets"
    WHERE "contributionType" = 'philhealth'
    AND "isActive" = true
    AND p_salary_base >= "salaryMin"
    AND p_salary_base <= "salaryMax"
    ORDER BY priority DESC, "salaryMin" DESC
    LIMIT 1;

    IF v_bracket IS NOT NULL THEN
        v_contribution := p_salary_base * v_bracket."employeeRate";
        
        IF v_bracket."minContribution" IS NOT NULL THEN
            v_contribution := GREATEST(v_contribution, v_bracket."minContribution");
        END IF;
        
        IF v_bracket."maxContribution" IS NOT NULL THEN
            v_contribution := LEAST(v_contribution, v_bracket."maxContribution");
        END IF;
    END IF;

    RETURN ROUND(v_contribution, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Update Pag-IBIG Contribution Function to use configuration tables
CREATE OR REPLACE FUNCTION calculate_pagibig_contribution(
    p_salary_base DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_contribution DECIMAL := 0;
    v_bracket RECORD;
BEGIN
    -- Try to find a matching bracket
    SELECT * INTO v_bracket
    FROM "contribution_brackets"
    WHERE "contributionType" = 'pagibig'
    AND "isActive" = true
    AND p_salary_base >= "salaryMin"
    AND p_salary_base <= "salaryMax"
    ORDER BY priority DESC, "salaryMin" DESC
    LIMIT 1;

    IF v_bracket IS NOT NULL THEN
        v_contribution := p_salary_base * v_bracket."employeeRate";
        
        IF v_bracket."minContribution" IS NOT NULL THEN
            v_contribution := GREATEST(v_contribution, v_bracket."minContribution");
        END IF;
        
        IF v_bracket."maxContribution" IS NOT NULL THEN
            v_contribution := LEAST(v_contribution, v_bracket."maxContribution");
        END IF;
    END IF;

    RETURN ROUND(v_contribution, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Update Withholding Tax Function to use configuration tables
CREATE OR REPLACE FUNCTION calculate_withholding_tax(
    p_annual_taxable_income DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_monthly_tax DECIMAL := 0;
    v_bracket RECORD;
BEGIN
    SELECT * INTO v_bracket
    FROM "tax_bracket_configs"
    WHERE "isActive" = true
    AND p_annual_taxable_income > "salaryMin"
    AND p_annual_taxable_income <= "salaryMax"
    ORDER BY priority DESC, "salaryMin" DESC
    LIMIT 1;

    IF v_bracket IS NOT NULL THEN
        -- Tax = Fixed Amount + (Excess * Rate)
        -- Result is Annual Tax, divide by 12 for monthly
        -- Assuming taxRate is stored as decimal (e.g. 0.20 for 20%)
        v_monthly_tax := (v_bracket."fixedAmount" + 
            ((p_annual_taxable_income - v_bracket."salaryMin") * v_bracket."taxRate")) / 12;
    END IF;

    RETURN ROUND(v_monthly_tax, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Update Main Payroll Calculation Function
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
    
    -- Calculate Mandatory Contributions based on Monthly Salary Basis
    v_gsis := calculate_gsis_contribution(v_monthly_salary_basis);
    v_philhealth := calculate_philhealth_contribution(v_monthly_salary_basis);
    v_pagibig := calculate_pagibig_contribution(v_monthly_salary_basis);
    
    -- Calculate taxable income
    v_taxable_income := v_gross_pay - v_gsis - v_philhealth - v_pagibig - v_thirteenth_month - v_sil;
    
    -- Calculate Withholding Tax (Annualized)
    -- We project the monthly taxable income to annual
    v_withholding_tax := calculate_withholding_tax(v_taxable_income * 12);
    
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
