-- Drop all versions of contribution and tax functions to eliminate duplicates
DROP FUNCTION IF EXISTS calculate_gsis_contribution(DECIMAL, DECIMAL, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS calculate_gsis_contribution(DECIMAL);
DROP FUNCTION IF EXISTS calculate_philhealth_contribution(DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS calculate_philhealth_contribution(DECIMAL);
DROP FUNCTION IF EXISTS calculate_pagibig_contribution(DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS calculate_pagibig_contribution(DECIMAL);
DROP FUNCTION IF EXISTS calculate_withholding_tax(DECIMAL);

-- Recreate GSIS with single parameter and fixed 9% rate
CREATE OR REPLACE FUNCTION calculate_gsis_contribution(
    p_salary_base DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_contribution DECIMAL := 0;
    v_fixed_rate DECIMAL := 0.09; -- Fixed 9% rate
BEGIN
    v_contribution := p_salary_base * v_fixed_rate;
    RETURN ROUND(v_contribution, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Recreate PhilHealth with single parameter and fixed 5% rate (2.5% employee share)
CREATE OR REPLACE FUNCTION calculate_philhealth_contribution(
    p_salary_base DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_contribution DECIMAL := 0;
    v_employee_rate DECIMAL := 0.025; -- Fixed 2.5% employee share
    v_min_contribution DECIMAL := 500.00;
    v_max_contribution DECIMAL := 5000.00;
    v_min_salary DECIMAL := 10000.00;
    v_max_salary DECIMAL := 100000.00;
    v_contribution_base DECIMAL;
BEGIN
    IF p_salary_base < v_min_salary THEN
        RETURN v_min_contribution;
    END IF;
    
    v_contribution_base := LEAST(v_max_salary, p_salary_base);
    v_contribution := v_contribution_base * v_employee_rate;
    v_contribution := GREATEST(v_min_contribution, LEAST(v_max_contribution, v_contribution));
    
    RETURN ROUND(v_contribution, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Recreate Pag-IBIG with single parameter and fixed rates
CREATE OR REPLACE FUNCTION calculate_pagibig_contribution(
    p_salary_base DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_contribution DECIMAL := 0;
    v_employee_rate DECIMAL := 0.02; -- Fixed 2% employee share
    v_min_contribution DECIMAL := 100.00;
    v_max_contribution DECIMAL := 200.00;
BEGIN
    v_contribution := p_salary_base * v_employee_rate;
    v_contribution := GREATEST(v_min_contribution, LEAST(v_max_contribution, v_contribution));
    
    RETURN ROUND(v_contribution, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Recreate Withholding Tax with single parameter
CREATE OR REPLACE FUNCTION calculate_withholding_tax(
    p_annual_taxable_income DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_monthly_tax DECIMAL := 0;
BEGIN
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
$$ LANGUAGE plpgsql STABLE;
