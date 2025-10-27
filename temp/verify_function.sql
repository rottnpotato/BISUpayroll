-- Verify the current function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'calculate_payroll_for_period';
