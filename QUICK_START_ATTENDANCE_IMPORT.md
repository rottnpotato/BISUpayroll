# Quick Start Guide - Attendance Import

## For Administrators (Import Attendance)

### Step 1: Export from Biometric System
Export your attendance data as CSV or Excel with these columns:
- Department
- Name (format: "Last, First")
- No.
- Date/Time (format: "MM/DD/YYYY H:MM AM/PM")
- Status (C/In or C/Out)
- Location ID

### Step 2: Import in Admin Panel
1. Login as admin
2. Go to **Admin → Attendance**
3. Click **"Import Attendance"** button (green, top right)
4. Click to select your CSV or Excel file (.csv, .xls, .xlsx)
5. Click **"Upload & Import"**
6. Wait for processing (progress bar shows status)
   - Excel files are automatically converted to CSV format

### Step 3: Review Results
Check the results dashboard for:
- ✅ **Imported**: New records added
- 🔄 **Updated**: Existing records modified
- ⚠️ **Warnings**: Minor issues (still processed)
- ❌ **Errors**: Records that failed (need fixing)

### Step 4: Verify Data
- Records automatically refresh in the table
- Use filters to check specific dates/departments
- Edit any records if needed

## Common Import Issues

### "Employee not found"
**Problem**: Name in CSV doesn't match database  
**Solution**: 
- Check employee name spelling in database
- Update employee record to match CSV
- Or edit CSV name to match database

### "Invalid date/time format"
**Problem**: Timestamp format doesn't match expected  
**Solution**:
- Ensure format is "MM/DD/YYYY H:MM AM/PM"
- Check for special characters in timestamps
- Re-export from biometric system

### "No clock-in record found" (Warning)
**Problem**: Only clock-out exists for a day  
**Solution**:
- Check biometric system for missing clock-in
- May need manual correction for that employee

## For Employees (View Attendance)

### View Your Records
1. Login as employee
2. Go to **Employee → Attendance**
3. Select month and year from dropdowns
4. View your attendance table

### Understanding Your Data

| Column | Meaning |
|--------|---------|
| **Date** | The day of the record |
| **Day** | Day of the week |
| **Time In** | When you clocked in |
| **Time Out** | When you clocked out |
| **Hours** | Total hours worked |
| **Status** | On Time, Late, or Absent |
| **Approval** | Pending, Approved, or Rejected |

### If You See an Issue
1. Note the specific date and details
2. Contact your supervisor or HR
3. Provide:
   - Date of discrepancy
   - What you expected vs what shows
   - Any supporting documents

## Sample CSV Format

```csv
Department,Name,No.,Date/Time,Status,Location ID
BISU-Balilihan,"Agoc, Winzeal",1,02/12/2024 7:30 A12P12,C/In,1
BISU-Balilihan,"Agoc, Winzeal",1,02/12/2024 17:00 A12P12,C/Out,1
BISU-Balilihan,"Diaz, Gabrene D.",6,02/12/2024 8:00 A12P12,C/In,1
BISU-Balilihan,"Diaz, Gabrene D.",6,02/12/2024 17:30 A12P12,C/Out,1
```

## Quick Tips

### ✅ Do's
- Import attendance regularly (weekly recommended)
- Review results before closing dialog
- Keep CSV files backed up
- Verify employee names match before importing
- Check for errors and warnings

### ❌ Don'ts
- Don't import same file twice (creates duplicates/updates)
- Don't upload unsupported files (only CSV and Excel files)
- Don't modify column headers in CSV/Excel files
- Don't ignore error messages
- Don't close dialog before reviewing results

## Need More Help?

📖 **Full Documentation**: See `ATTENDANCE_IMPORT_SYSTEM.md`  
🔧 **Technical Details**: See `ATTENDANCE_CHANGES_SUMMARY.md`  
💬 **Support**: Contact HR or system administrator

---

**Remember**: Attendance is now imported from biometric system only. Employees cannot manually clock in/out through the system anymore.