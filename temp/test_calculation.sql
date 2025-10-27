-- Test the payroll calculation with the new rule
SELECT 
    user_id,
    daily_rate,
    hourly_rate,
    days_worked,
    hours_worked,
    regular_pay,
    gross_pay,
    net_pay
FROM calculate_payroll_for_period(
    (SELECT id FROM users WHERE role = 'EMPLOYEE' LIMIT 1),
    '2025-10-01'::DATE,
    '2025-10-31'::DATE
);
