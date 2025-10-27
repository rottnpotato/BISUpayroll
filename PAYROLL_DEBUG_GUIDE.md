# Payroll Calculation Debugger Guide

## Overview

The Payroll Calculation Debugger is a powerful tool that helps you inspect and troubleshoot payroll calculations performed by the stored procedures. It provides detailed visibility into every step of the calculation process.

## Features

✅ **Complete Calculation Breakdown** - View all earnings, deductions, and intermediate values
✅ **Payslip Preview** - See exactly how the payslip would be generated with all formatting
✅ **Attendance Analysis** - See detailed attendance records for the period
✅ **Payroll Rules Inspection** - Review all active rules and configurations
✅ **System Settings** - Check rates, working hours, and other settings
✅ **Diagnostics & Warnings** - Automatically detect common issues
✅ **Raw Data Access** - View the complete JSON response for advanced debugging

## How to Use

### Method 1: From Admin Payroll Page (UI)

1. Navigate to **Admin > Payroll > Reports** tab
2. Click the **"Debug Calculation"** button (with bug icon) above the payroll generator
3. Enter the required information:
   - **User ID**: The ID of the employee to debug
   - **Start Date**: Beginning of the pay period
   - **End Date**: End of the pay period
4. Click **"Run Debug Analysis"**
5. Review the results in the tabbed interface

### Method 2: Direct API Call

You can also call the debug endpoint directly:

```bash
GET /api/admin/payroll/debug-calculation?userId=<USER_ID>&start=<START_DATE>&end=<END_DATE>
```

**Example:**
```bash
curl "http://localhost:3000/api/admin/payroll/debug-calculation?userId=clxxx123&start=2025-10-01&end=2025-10-31"
```

## Understanding the Results

### 1. Diagnostics Tab

Shows overall health check of the calculation:
- ✅ **Green checkmarks** = Data exists and is valid
- ❌ **Red X marks** = Data is missing or invalid
- ⚠️ **Warnings** = Potential issues detected

Common warnings:
- "Stored procedure returned no result" - Calculation failed completely
- "No attendance records found" - Employee has no attendance for this period
- "No approved attendance" - Attendance exists but isn't approved yet
- "No active payroll rules" - No salary/earnings rules configured
- "Net pay is zero" - Check if attendance and rates are correct

### 2. Calculation Tab

**Base Rates**
- Daily Rate: Employee's daily salary
- Hourly Rate: Computed from daily rate ÷ daily hours

**Attendance Metrics**
- Days Worked: Total days with approved attendance
- Hours Worked: Total hours including overtime
- Overtime Hours: Hours beyond standard daily hours
- Late Hours: Accumulated late time
- Holiday Hours: Hours worked on holidays

**Earnings** (shown in green)
- Regular Pay: Standard hours × hourly rate
- Overtime Pay: Overtime calculation with premium rates
- Holiday Pay: Holiday premium calculations
- Allowances: From payroll rules
- Bonuses: One-time or recurring bonuses
- **Gross Pay**: Total of all earnings

**Deductions** (shown in red)
- GSIS: Government Service Insurance System
- PhilHealth: Health insurance contribution
- Pag-IBIG: Housing fund contribution
- Withholding Tax: Income tax based on annual projection
- Late Deductions: Penalties for tardiness
- Loan Deductions: Active loan payments
- **Total Deductions**: Sum of all deductions

**Net Pay** (shown in blue)
- Final take-home pay after all deductions

### 3. Payslip Tab

A formatted preview of how the payslip would appear to the employee:

**Header Section**
- Company name and payslip title
- Employee information (name, ID, department, position)
- Pay period dates and generation timestamp
- Reference ID

**Earnings Section** (green background)
- Regular Pay: Base salary for hours worked
- Overtime Pay: Overtime premium payments
- Holiday Pay: Holiday work premiums
- Allowances: Transportation, meal, etc.
- Bonuses: Performance, attendance bonuses
- 13th Month Pay: If applicable
- **Gross Pay Total**

**Deductions Section** (red background)
- GSIS: Government insurance contribution
- PhilHealth: Health insurance
- Pag-IBIG: Housing fund
- Withholding Tax: Income tax
- Late Deductions: Tardiness penalties
- Loan Deductions: Active loan payments
- **Total Deductions**

**Net Pay Display** (blue, prominent)
- Large, formatted final amount
- This is what the employee receives

**Attendance Summary**
- Days Worked: Total working days
- Hours Worked: Total hours including overtime
- Overtime Hours: Extra hours worked
- Late Hours: Accumulated tardiness

**Notes Section**
- System-generated status messages
- Validation checks and warnings

**Use Cases:**
- Preview before generating actual payslips
- Verify formatting and layout
- Check that all amounts appear correctly
- Ensure employee information is complete
- Validate attendance summary accuracy

### 4. Attendance Tab

**Summary Section**
- Total Days: All attendance records in period
- Approved Days: Records with APPROVED status
- Pending Days: Records waiting for approval
- Total Hours: Sum of all hours worked
- Late Days: Days with late check-in
- Absent Days: Marked absent
- Half Days: Partial day attendance

**Records List**
- Each attendance record with date, status, hours
- Color-coded by status (green=approved, yellow=pending)
- Shows late minutes, overtime, and special flags

### 5. Rules Tab

**Global Rules**
- Rules that apply to all employees
- Typically include standard benefits and deductions

**User-Specific Rules**
- Rules assigned only to this employee
- Custom allowances, bonuses, or deductions

**User Payroll Roles**
- Assigned roles that determine salary and eligibility
- Shows daily rate and benefit eligibility

### 6. Settings Tab

**Rates**
- Overtime multipliers (e.g., 1.25x, 1.5x)
- Holiday pay rates
- Other premium rates

**Working Hours**
- Standard daily hours (usually 8)
- Late deduction settings
- Undertime penalties

### 7. Raw Data Tab

Complete JSON response from the API. Useful for:
- Copying data for bug reports
- Detailed analysis
- Integration testing
- Verification of API responses

## Common Debugging Scenarios

### Scenario 0: Verify Payslip Output

**Symptoms:**
- Need to check how payslip will look before generating

**Check:**
1. **Payslip Tab** - Review formatted payslip preview
2. Check employee information is complete
3. Verify all amounts are formatted correctly
4. Ensure attendance summary is accurate

**Solutions:**
- Update employee information if incomplete
- Correct any calculation issues found
- Verify system is using correct template

### Scenario 1: Net Pay is Zero

**Symptoms:**
- Calculation completes but net pay = ₱0.00

**Check:**
1. **Attendance Tab** - Are there approved attendance records?
2. **Rules Tab** - Is there a base salary/daily rate configured?
3. **Settings Tab** - Are working hours configured properly?
4. **Payroll Roles** - Is the user assigned to a payroll role?

**Solutions:**
- Approve pending attendance records
- Create/assign a payroll role with salary
- Add base salary rule in Payroll Rules
- Check system settings for working hours

### Scenario 2: Stored Procedure Returns No Result

**Symptoms:**
- Error: "Stored procedure returned no result"

**Check:**
1. Verify stored procedure exists in database:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'calculate_payroll_for_period';
   ```

2. Check database logs for SQL errors

**Solutions:**
- Re-run migration: `npx prisma migrate deploy`
- Check database connection
- Verify user ID exists in database

### Scenario 3: Deductions Too High

**Symptoms:**
- Deductions exceed expected amount

**Check:**
1. **Calculation Tab** - Review each deduction line item
2. **Rules Tab** - Check for duplicate deduction rules
3. **Settings Tab** - Verify contribution rates are correct
4. **Payroll Roles** - Check if employee is incorrectly marked eligible

**Solutions:**
- Remove duplicate rules
- Update contribution rates in Settings
- Adjust payroll role eligibility flags

### Scenario 4: Overtime Not Calculated

**Symptoms:**
- Overtime Hours shows 0 despite working extra hours

**Check:**
1. **Attendance Tab** - Verify hours_worked exceeds daily standard
2. **Settings Tab** - Check `working_hours_dailyHours` setting
3. **Payroll Roles** - Ensure `overtimeEligible = true`

**Solutions:**
- Ensure attendance records show hours > 8 (or configured daily hours)
- Set correct daily hours in system settings
- Enable overtime eligibility in payroll role

### Scenario 5: Late Deductions Incorrect

**Symptoms:**
- Late deductions don't match expected amount

**Check:**
1. **Attendance Tab** - Count late days and minutes
2. **Settings Tab** - Review late deduction settings:
   - `working_hours_lateDeductionAmount`
   - `working_hours_lateDeductionBasis` (per-occurrence vs per-minute)
3. **Calculation Tab** - Verify late hours calculation

**Solutions:**
- Adjust late deduction settings
- Correct attendance late minutes if data entry error
- Review stored procedure late calculation logic

## Advanced Debugging

### Compare Stored Procedure vs Manual Calculation

1. Run debugger to get stored procedure result
2. Manually calculate using formulas:
   ```
   Regular Pay = Regular Hours × Hourly Rate
   Overtime Pay = OT Hours × Hourly Rate × OT Rate
   Gross Pay = Regular Pay + OT Pay + Allowances + Bonuses
   GSIS = Salary Base × GSIS Rate
   Net Pay = Gross Pay - All Deductions
   ```
3. Compare values to identify discrepancy

### Batch Testing

Test multiple employees to identify patterns:
1. Run debug for Employee A, B, C
2. Compare results
3. Look for:
   - Same department, different results?
   - Same salary, different deductions?
   - Consistent patterns or random issues?

### Stored Procedure Direct Testing

Query the stored procedure directly in database client:

```sql
-- Test one employee
SELECT * FROM calculate_payroll_for_period(
    'clxxx123'::text,
    '2025-10-01'::date,
    '2025-10-31'::date
);

-- Check intermediate calculations
SELECT 
    calculate_hourly_rate(800.00, 8.0) as hourly_rate,
    calculate_overtime_pay(5.0, 100.0, 1.25, 1.5) as overtime_pay,
    calculate_gsis_contribution(16000.00, 0.09, 0, 999999) as gsis;
```

## Best Practices

1. **Always Check Diagnostics First** - Warnings often point directly to the issue
2. **Verify Attendance is Approved** - Pending attendance won't calculate
3. **Check Date Ranges** - Ensure dates cover the intended pay period
4. **Compare with Previous Periods** - Look for sudden changes
5. **Document Issues** - Copy raw JSON when reporting bugs
6. **Test After Changes** - Run debug after modifying rules or settings

## Troubleshooting API Errors

### 400 Bad Request
- Missing userId, start, or end parameter
- Invalid date format (use YYYY-MM-DD)

### 404 Not Found
- User ID doesn't exist in database
- Check spelling and format of userId

### 500 Internal Server Error
- Database connection issue
- Stored procedure error
- Check server logs for details

## Integration with Testing

### Unit Tests

```typescript
describe('Payroll Debug API', () => {
  it('should return calculation for valid user', async () => {
    const response = await fetch(
      '/api/admin/payroll/debug-calculation?userId=test123&start=2025-10-01&end=2025-10-31'
    )
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.storedProcedureCalculation).toBeDefined()
  })
})
```

### Integration Tests

Use the debug API to verify end-to-end payroll flow:
1. Create test employee
2. Add attendance records
3. Configure payroll rules
4. Call debug API
5. Assert expected calculations

## Support

If you encounter issues not covered in this guide:

1. **Check Database Logs** - Look for SQL errors
2. **Review Server Logs** - Check application console output
3. **Examine PAYROLL_STORED_PROCEDURES.md** - Understand calculation logic
4. **Consult PAYROLL_QUICK_REFERENCE.md** - Review system design
5. **Copy Raw Data** - Include in bug reports for faster resolution

## Related Documentation

- `PAYROLL_STORED_PROCEDURES.md` - Database calculation system
- `PAYROLL_QUICK_REFERENCE.md` - Overall payroll system guide
- `prisma/migrations/create_payroll_stored_procedures.sql` - Stored procedure source code

---

**Last Updated:** October 2025
**Version:** 1.0.0
