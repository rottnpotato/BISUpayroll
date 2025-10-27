-- Test the fixed payroll calculation function
-- This will show if the contribution calculations are now working

SELECT 
    user_id,
    days_worked,
    hours_worked,
    daily_rate,
    hourly_rate,
    regular_pay,
    overtime_pay,
    holiday_pay,
    allowances,
    bonuses,
    total_earnings,
    gross_pay,
    gsis_contribution,
    philhealth_contribution,
    pagibig_contribution,
    taxable_income,
    withholding_tax,
    late_deductions,
    undertime_deductions,
    loan_deductions,
    other_deductions,
    total_deductions,
    net_pay
FROM calculate_payroll_for_period(
    (SELECT id FROM users WHERE role = 'EMPLOYEE' LIMIT 1),
    '2025-10-01'::DATE,
    '2025-10-15'::DATE
)
WHERE EXISTS (SELECT 1 FROM users WHERE role = 'EMPLOYEE' LIMIT 1);
