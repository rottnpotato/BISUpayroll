# Payroll Calculation Fix - October 28, 2025

## Summary
Fixed admin payroll stored procedure to match the more accurate employee payroll calculation method.

## Issues Found

### 1. ❌ Contribution Base Missing Overtime Pay
**Problem:** Government contributions (SSS, PhilHealth, Pag-IBIG) were calculated only on `regular_pay + allowances`, excluding overtime pay.

**Before:**
```sql
v_contribution_base := v_regular_pay + v_allowances;
```

**After:**
```sql
v_contribution_base := v_regular_pay + v_overtime_pay + v_allowances;
```

**Why this matters:** Government contributions should be based on total gross compensation including overtime, as per employee calculation approach.

### 2. ⚠️ Overtime Calculation Method Changed
**Problem:** Previous calculation used daily overtime (counting overtime each day hours exceed 8), which could differ from employee view.

**Before (Daily Overtime):**
```sql
-- Counted overtime per day
WHEN CAST("hoursWorked" AS DECIMAL) > v_working_hours_per_day 
THEN CAST("hoursWorked" AS DECIMAL) - v_working_hours_per_day
```

**After (Period-Based Overtime):**
```sql
-- Calculate expected total hours for the period
v_expected_total_hours := v_days_worked * v_working_hours_per_day;

-- Overtime is only hours beyond expected total
v_overtime_hours := CASE 
    WHEN v_hours_worked > v_expected_total_hours 
    THEN v_hours_worked - v_expected_total_hours
    ELSE 0
END;
```

**Why this matters:** Now matches employee calculation - overtime only counts after meeting total expected hours for the entire pay period.

## Impact

### Before Fix
- **Contribution Base:** ₱22,000 (22 days × ₱1,000)
- **Overtime Pay:** ₱1,562.50 (10 hours × ₱125/hr × 1.25)
- **GSIS (9%):** ₱1,980 (9% of ₱22,000)
- **PhilHealth (2.5%):** ₱550 (2.5% of ₱22,000)
- **Pag-IBIG (2%):** ₱440 (2% of ₱22,000)
- **Total Contributions:** ₱2,970

### After Fix
- **Contribution Base:** ₱23,562.50 (₱22,000 + ₱1,562.50)
- **Overtime Pay:** ₱1,562.50 (same)
- **GSIS (9%):** ₱2,120.63 (9% of ₱23,562.50)
- **PhilHealth (2.5%):** ₱589.06 (2.5% of ₱23,562.50)
- **Pag-IBIG (2%):** ₱471.25 (2% of ₱23,562.50)
- **Total Contributions:** ₱3,180.94

**Difference:** ₱210.94 more accurate deductions per month

## Files Changed
- `prisma/migrations/20251028000000_fix_payroll_calculation_accuracy/migration.sql`

## Migration Applied
```bash
npx prisma migrate deploy
```

## Validation
Compare admin payroll results with employee payroll view to ensure they now match:
- `/api/employee/payroll` (Employee view - reference implementation)
- `/api/admin/payroll/debug-calculation` (Admin calculation debug)

## Related Documentation
- `PAYROLL_STORED_PROCEDURES.md` - Overall stored procedure documentation
- `PAYROLL_QUICK_REFERENCE.md` - Quick reference for payroll rules
