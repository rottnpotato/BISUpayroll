-- Test Script for Payroll Stored Procedures
-- Run this after migration to verify everything works

-- =====================================================
-- TEST 1: Check if all functions exist
-- =====================================================
\echo '======================================'
\echo 'TEST 1: Checking Functions'
\echo '======================================'

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%payroll%'
ORDER BY routine_name;

-- =====================================================
-- TEST 2: Check if all triggers exist
-- =====================================================
\echo ''
\echo '======================================'
\echo 'TEST 2: Checking Triggers'
\echo '======================================'

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%payroll%'
ORDER BY trigger_name;

-- =====================================================
-- TEST 3: Test helper functions
-- =====================================================
\echo ''
\echo '======================================'
\echo 'TEST 3: Testing Helper Functions'
\echo '======================================'

-- Test hourly rate calculation
SELECT 
    'Hourly Rate Calculation' as test,
    calculate_hourly_rate(800, 8) as result,
    100 as expected,
    CASE WHEN calculate_hourly_rate(800, 8) = 100 THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- Test overtime pay calculation
SELECT 
    'Overtime Pay (3 hours)' as test,
    calculate_overtime_pay(3, 100, 1.25, 1.5) as result,
    400.00 as expected,
    CASE WHEN calculate_overtime_pay(3, 100, 1.25, 1.5) = 400 THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- Test holiday pay calculation
SELECT 
    'Holiday Pay (8 hours, Regular)' as test,
    calculate_holiday_pay(8, 100, 'REGULAR', 2.0, 1.3) as result,
    800.00 as expected,
    CASE WHEN calculate_holiday_pay(8, 100, 'REGULAR', 2.0, 1.3) = 800 THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- Test GSIS contribution
SELECT 
    'GSIS Contribution' as test,
    calculate_gsis_contribution(20000, 9.0) as result,
    1800.00 as expected,
    CASE WHEN calculate_gsis_contribution(20000, 9.0) = 1800 THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- Test PhilHealth contribution
SELECT 
    'PhilHealth Contribution' as test,
    calculate_philhealth_contribution(20000, 2.5, 500, 5000) as result,
    500.00 as expected,
    CASE WHEN calculate_philhealth_contribution(20000, 2.5, 500, 5000) = 500 THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- Test Pag-IBIG contribution
SELECT 
    'Pag-IBIG Contribution' as test,
    calculate_pagibig_contribution(5000, 2.0, 100, 200) as result,
    100.00 as expected,
    CASE WHEN calculate_pagibig_contribution(5000, 2.0, 100, 200) = 100 THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- =====================================================
-- TEST 4: Test main calculation (if user exists)
-- =====================================================
\echo ''
\echo '======================================'
\echo 'TEST 4: Testing Main Calculation'
\echo '======================================'

-- Get first EMPLOYEE user for testing
DO $$
DECLARE
    v_test_user_id TEXT;
    v_result RECORD;
BEGIN
    SELECT id INTO v_test_user_id
    FROM "users"
    WHERE role = 'EMPLOYEE'
    AND status != 'INACTIVE'
    LIMIT 1;
    
    IF v_test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with user ID: %', v_test_user_id;
        
        -- Calculate payroll for current month
        SELECT * INTO v_result
        FROM calculate_payroll_for_period(
            v_test_user_id,
            DATE_TRUNC('month', CURRENT_DATE)::date,
            (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
        );
        
        RAISE NOTICE 'Base Salary: %', v_result.base_salary;
        RAISE NOTICE 'Days Worked: %', v_result.days_worked;
        RAISE NOTICE 'Hours Worked: %', v_result.hours_worked;
        RAISE NOTICE 'Gross Pay: %', v_result.gross_pay;
        RAISE NOTICE 'Total Deductions: %', v_result.total_deductions;
        RAISE NOTICE 'Net Pay: %', v_result.net_pay;
        RAISE NOTICE '✅ Calculation successful!';
    ELSE
        RAISE NOTICE '⚠️  No EMPLOYEE users found to test with';
    END IF;
END $$;

-- =====================================================
-- TEST 5: Test current month summary
-- =====================================================
\echo ''
\echo '======================================'
\echo 'TEST 5: Testing Summary Function'
\echo '======================================'

SELECT 
    total_employees,
    total_gross_pay,
    total_net_pay,
    total_deductions,
    avg_net_pay
FROM get_current_month_payroll_summary();

-- =====================================================
-- TEST 6: Check system settings
-- =====================================================
\echo ''
\echo '======================================'
\echo 'TEST 6: Checking System Settings'
\echo '======================================'

SELECT 
    key,
    value,
    "dataType"
FROM "system_settings"
WHERE key LIKE 'rates_%' OR key LIKE 'working_hours_%'
ORDER BY key;

-- =====================================================
-- SUMMARY
-- =====================================================
\echo ''
\echo '======================================'
\echo 'TEST SUMMARY'
\echo '======================================'
\echo 'If all tests passed, the stored procedures are ready to use!'
\echo 'Next steps:'
\echo '1. Test the API endpoint: POST /api/admin/payroll/recalculate'
\echo '2. Import attendance and verify auto-recalculation'
\echo '3. Read PAYROLL_STORED_PROCEDURES.md for usage guide'
\echo '======================================'
