# Attendance Import System - Implementation Guide

## Overview
The attendance system has been revamped to support CSV-based attendance import from biometric time tracking systems. This replaces the previous manual clock-in/clock-out functionality with an automated import process managed by administrators.

## Changes Summary

### 1. **Import API Enhancement** (`/app/api/admin/attendance/import/route.ts`)
- **Purpose**: Processes CSV files from biometric attendance systems
- **Features**:
  - Parses biometric timestamp format (MM/DD/YYYY HH:MM AM/PM)
  - Matches employee names from CSV to database users
  - Groups clock-in/clock-out punches by employee and date
  - Automatically calculates work hours and sessions
  - Supports morning and afternoon session tracking
  - Auto-approves imported records
  - Provides detailed import statistics and error reporting

- **CSV Format Expected**:
  ```csv
  Department,Name,No.,Date/Time,Status,Location ID
  BISU-Balilihan,"Agoc, Winzeal",1,02/12/2024 5:15 A12P12,C/In,1
  BISU-Balilihan,"Agoc, Winzeal",1,02/12/2024 18:31 A12P12,C/Out,1
  ```

- **Key Functions**:
  - `parseBiometricTimestamp()`: Converts biometric timestamp to JavaScript Date
  - `findUserByName()`: Matches CSV name format to database users
  - Groups multiple punch records per day per employee
  - Calculates session-based attendance (morning/afternoon)
  - Updates existing records or creates new ones

### 2. **Import UI Component** (`/app/admin/attendance/components/AttendanceImportDialog.tsx`)
- **Purpose**: Provides user-friendly interface for importing CSV files
- **Features**:
  - Drag-and-drop file selection
  - CSV format instructions and guidelines
  - Real-time upload progress indicator
  - Detailed import results dashboard showing:
    - Total records processed
    - New records imported
    - Existing records updated
    - Records skipped
    - Errors encountered
    - Warnings generated
  - Scrollable error/warning log viewer
  - Success/failure status indicators

### 3. **Admin Attendance Page Update** (`/app/admin/attendance/page.tsx`)
- Added import button in page header
- Import dialog triggers data refresh after successful import
- Seamless integration with existing attendance management features

### 4. **Employee Attendance Page Simplification** (`/app/employee/attendance/page.tsx`)
- **Removed**:
  - Clock-in/clock-out buttons
  - Time restriction checks
  - Real-time clock display
  - Manual attendance recording
  
- **Updated to**:
  - View-only attendance records
  - Month/year selector for historical data
  - Summary statistics (total days, present, late, hours)
  - Detailed attendance table with approval status
  - Informational alert explaining import-based system

## Database Schema
The attendance import utilizes the existing `AttendanceRecord` model with these key fields:

```prisma
model AttendanceRecord {
  id                String           @id @default(cuid())
  userId            String
  date              DateTime
  timeIn            DateTime?
  timeOut           DateTime?
  hoursWorked       Decimal?
  isLate            Boolean          @default(false)
  isAbsent          Boolean          @default(false)
  
  // Session-based tracking
  morningTimeIn     DateTime?
  morningTimeOut    DateTime?
  afternoonTimeIn   DateTime?
  afternoonTimeOut  DateTime?
  totalSessions     Int              @default(0)
  isHalfDay         Boolean          @default(false)
  isEarlyOut        Boolean          @default(false)
  
  status            AttendanceStatus @default(APPROVED)
  approvedAt        DateTime?
  approvedById      String?
}
```

## How It Works

### For Administrators:

1. **Export CSV from Biometric System**
   - Export attendance data from your biometric time tracking device
   - Ensure CSV format matches the expected structure

2. **Import via Admin Panel**
   - Navigate to Admin > Attendance
   - Click "Import Attendance" button
   - Select the CSV file
   - Review format requirements in the dialog
   - Click "Upload & Import"

3. **Review Import Results**
   - View summary statistics (imported, updated, errors)
   - Check warnings for potential issues
   - Review error log for failed records
   - Fix any employee name mismatches if needed

4. **Verify Imported Data**
   - Records are automatically refreshed after import
   - Filter by date range or department to review
   - Approve or edit records as needed

### For Employees:

1. **View Attendance Records**
   - Navigate to Employee > Attendance
   - Select month and year to view
   - Review daily attendance logs
   - Check approval status

2. **Understanding the Data**
   - Time In/Out: First clock-in and last clock-out of the day
   - Hours: Total hours worked (calculated automatically)
   - Status: On Time, Late, or Absent
   - Approval: Pending, Approved, or Rejected

3. **Report Discrepancies**
   - Contact supervisor or HR if data is incorrect
   - Provide specific date and details of the issue

## API Endpoints

### Import Attendance (Admin Only)
```
POST /api/admin/attendance/import
Content-Type: multipart/form-data
Body: { file: <CSV File> }

Response:
{
  success: boolean,
  message: string,
  results: {
    total: number,
    processed: number,
    imported: number,
    updated: number,
    skipped: number,
    errors: string[],
    warnings: string[]
  }
}
```

### Get Employee Attendance
```
GET /api/employee/attendance?year=2024&month=12

Response:
{
  success: boolean,
  data: {
    records: AttendanceRecord[],
    summary: {
      totalDays: number,
      presentDays: number,
      absentDays: number,
      lateDays: number,
      totalHours: number,
      averageHoursPerDay: number
    }
  }
}
```

## Name Matching Logic

The import system uses intelligent name matching to link CSV records to employees:

1. **CSV Format**: "Last, First Middle" (e.g., "Agoc, Winzeal")
2. **Exact Match**: First attempts exact match on first and last name
3. **Fuzzy Match**: Falls back to normalized name comparison (case-insensitive, punctuation-removed)
4. **Error Reporting**: Reports employees not found in database

### Tips for Successful Matching:
- Ensure employee names in database match biometric system
- Use proper capitalization and spelling
- Update employee records before importing if names have changed

## Timestamp Parsing

The system handles various biometric timestamp formats:

- **Format**: `MM/DD/YYYY H:MM A12P12` or similar
- **Examples**:
  - `02/12/2024 5:15 A12P12` → 5:15 AM
  - `03/12/2024 18:31 A12P12` → 6:31 PM
- **Timezone**: Uses server timezone
- **Validation**: Invalid timestamps are reported as errors

## Session-Based Attendance

The import automatically categorizes attendance into sessions:

- **Morning Session**: Clock-ins before 1:00 PM
- **Afternoon Session**: Clock-ins from 1:00 PM onwards
- **Half-Day**: Only one session completed
- **Full-Day**: Both sessions completed
- **Early Out**: Clock-out before 5:00 PM

## Error Handling

Common errors and solutions:

1. **"Employee not found"**
   - Employee name in CSV doesn't match database
   - Solution: Update employee record or CSV name

2. **"Invalid date/time format"**
   - Timestamp format doesn't match expected pattern
   - Solution: Check CSV format, ensure proper date/time columns

3. **"Missing required fields"**
   - CSV missing Name, Date/Time, or Status columns
   - Solution: Export complete data from biometric system

4. **"No clock-in record found"**
   - Only clock-out punches exist for a day
   - Solution: Check biometric data, may need manual correction

## Best Practices

### For Administrators:
1. Import attendance data regularly (weekly or bi-weekly)
2. Review import results for errors before proceeding
3. Keep employee database names synchronized with biometric system
4. Archive imported CSV files for audit trail
5. Test import with small file first to verify format

### For HR Department:
1. Maintain accurate employee records (names, IDs)
2. Configure biometric system with correct employee names
3. Establish cutoff dates for attendance imports
4. Review approval status regularly
5. Address employee-reported discrepancies promptly

### For Employees:
1. Check attendance records regularly
2. Report any discrepancies within the pay period
3. Understand late and early-out policies
4. Maintain proper clock-in/out habits with biometric system

## Troubleshooting

### Import Not Working
1. Check file format (must be .csv)
2. Verify admin permissions
3. Check server logs for detailed errors
4. Ensure database connection is active

### Names Not Matching
1. Review employee names in database
2. Compare with CSV names
3. Update employee records if needed
4. Consider standardizing name format across systems

### Missing Records
1. Verify employee clocked in with biometric system
2. Check CSV export includes all records
3. Review import warnings for skipped records
4. Check date range of export

## Security Considerations

- Import feature restricted to ADMIN role only
- Authentication required via JWT token
- Imported records are auto-approved but can be reviewed
- Audit trail maintained through approval system
- File uploads validated for CSV format only

## Future Enhancements

Potential improvements for future versions:

1. **Bulk Edit**: Allow editing multiple imported records at once
2. **Import History**: Track all import operations with details
3. **Name Mapping**: Create permanent mappings for mismatched names
4. **Schedule Import**: Automated imports from shared network location
5. **Export Templates**: Provide CSV template for manual creation
6. **Validation Rules**: Configurable validation for attendance data
7. **Notification System**: Alert employees of new attendance records
8. **Mobile Support**: Mobile-friendly import interface

## Migration Notes

If upgrading from manual clock-in system:

1. **Data Preservation**: Existing attendance records are preserved
2. **No Schema Changes**: Import uses existing database structure
3. **Backward Compatible**: Old records remain viewable
4. **Gradual Transition**: Can import historical data from biometric system
5. **Employee Communication**: Inform employees of new process

## Support

For issues or questions:
- Check error logs in import results
- Review this documentation
- Contact system administrator
- Submit bug reports with sample CSV (anonymized)

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Author**: BISU Payroll Development Team