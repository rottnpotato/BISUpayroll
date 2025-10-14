# Attendance Import (Admin)

This system imports attendance from biometric CSV or Excel files.

## Supported File Formats
- CSV (.csv)
- Excel (.xls, .xlsx)

**Note:** Excel files are automatically converted to CSV format before processing.

## File Structure
- Expected columns: Department, Name, No., Date/Time, Status, Location ID
- Matching user:
  - First tries `User.biometricNo` against CSV `No.`
  - Falls back to name: "Last, First Middle" → firstName lastName (case-insensitive)
- Import creates:
  - Raw punches in `attendance_punches` (deduped on [userId, timestamp, type])
  - Daily `attendance_records` with computed timeIn/out, sessions, hours, and status APPROVED
  - `attendance_import_batches` entry with checksum for traceability

Notes
- Add biometric numbers to users to ensure reliable matching
- Duplicate punches are ignored
- Existing daily record is updated; otherwise created
- Timezone: parsed timestamps use local server timezone; date stored with noon time to avoid tz issues
