# BISU Payroll Security & Deadline Management Features

## Overview

This document describes the enhanced security and deadline management features implemented in the BISU Payroll system.

## Features Implemented

### 1. Missed Payroll Deadline Detection

The system now automatically detects when payroll generation deadlines have been missed based on the configured payroll schedule.

#### How it Works:
- Monitors active payroll schedules and their generation dates
- Compares current date with expected payroll generation dates
- Calculates days overdue for missed deadlines
- Displays warnings and alerts on the admin dashboard

#### Dashboard Alerts:
- **Red Alert**: When payroll generation is overdue
- **Amber Alert**: When upcoming deadlines are approaching (urgent)
- **Green Status**: When all deadlines are on track

### 2. Encrypted Payroll File Storage

All payroll files are now automatically encrypted before storage for enhanced security.

#### Security Features:
- **AES-256-GCM Encryption**: Industry-standard encryption algorithm
- **Unique Salt & IV**: Each file has unique encryption parameters
- **File Integrity**: SHA-256 checksums verify file integrity
- **Secure Directory Structure**: Organized by year-month and department

#### Directory Structure:
```
secure-payroll-files/
├── 2024-01/
│   ├── all-departments/
│   │   └── payroll_1234567890_abc123.enc
│   ├── Computer Science/
│   │   └── payroll_1234567890_def456.enc
│   └── Information Technology/
│       └── payroll_1234567890_ghi789.enc
└── 2024-02/
    └── ...
```

### 3. Secure File Access for Admin

Admin users can securely view and download encrypted payroll files through the dashboard.

#### Access Methods:
- **Download**: Decrypts file on-the-fly for download
- **View**: Temporary decryption for preview (file cleaned up immediately)
- **Audit Trail**: Tracks download count and last access time

### 4. Enhanced Dashboard Alerts

The admin dashboard now displays comprehensive payroll status information:

#### Alert Types:
1. **Missed Deadline Alerts** (Red)
   - Shows days overdue
   - Provides quick action button to generate payroll
   - Displays compliance warnings for extended delays

2. **Upcoming Deadline Alerts** (Amber)
   - Shows urgent deadlines (within 3 days)
   - Lists generation, cutoff, and payment dates
   - Color-coded by urgency level

3. **File Security Status** (Green)
   - Shows encryption status of payroll files
   - Displays file count and employee coverage
   - Warns about unencrypted files

4. **System Status** (Green)
   - Confirms when all deadlines are on track
   - Shows file security statistics

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Required for payroll file encryption
PAYROLL_ENCRYPTION_SECRET="your-strong-encryption-secret-here"
```

⚠️ **Important**: Use a strong, unique secret for production. This secret is used to encrypt/decrypt all payroll files.

### Payroll Schedule Setup

1. Navigate to Admin → Payroll → Schedules
2. Configure your payroll schedule with:
   - Generation days (when payroll should be processed)
   - Cutoff days (deadline for attendance submission)
   - Payment release days (when salaries are paid)

## API Endpoints

### File Download/Access
```
GET /api/admin/payroll/files/[id]/download
```
- Downloads encrypted file with automatic decryption
- Updates access audit trail

```
POST /api/admin/payroll/files/[id]/download
```
- Body: `{ "action": "view" }`
- Returns decrypted file content for preview

### Dashboard Data
```
GET /api/admin/dashboard
```
- Returns enhanced data including:
  - `deadlineStatus`: Missed deadline information
  - `upcomingDeadlines`: Future payroll dates
  - `fileStatus`: Encryption and security status

## Security Considerations

### File Encryption
- Uses AES-256-GCM with PBKDF2 key derivation
- Each file has unique salt and initialization vector
- Authentication tag prevents tampering
- Automatic cleanup of temporary decrypted files

### Access Control
- Only admin users can access encrypted files
- Download attempts are logged and audited
- Files are decrypted only when needed
- Temporary files are immediately cleaned up

### Key Management
- Encryption secret should be stored securely
- Use environment-specific secrets for different deployments
- Rotate encryption secrets periodically (requires file re-encryption)

## Monitoring & Maintenance

### Dashboard Monitoring
- Check for red alerts indicating missed deadlines
- Monitor file encryption status regularly
- Review upcoming deadlines to plan ahead

### File Management
- Encrypted files are stored in organized directory structure
- Regular backup of secure-payroll-files directory recommended
- Monitor disk space usage for encrypted file storage

### Audit Trail
- File access is logged with timestamps
- Download counts are tracked per file
- Consider implementing additional audit logging as needed

## Troubleshooting

### Missing Encryption Secret
If `PAYROLL_ENCRYPTION_SECRET` is not set:
- Files will use a default secret (not secure for production)
- Warning logs will be generated
- Recommendation: Set a strong secret immediately

### File Decryption Errors
If files cannot be decrypted:
- Check that the encryption secret matches the one used for encryption
- Verify file integrity using checksums
- Check file permissions and existence

### Missed Deadline Alerts
If false alerts are showing:
- Verify payroll schedule configuration
- Check that payroll generation has completed successfully
- Ensure PayrollResult records are being created properly

## Future Enhancements

Potential improvements for consideration:
- Email notifications for missed deadlines
- Automatic payroll generation scheduling
- Enhanced file format support (PDF, Excel)
- Key rotation and migration tools
- Advanced audit reporting
- Integration with external backup systems

## Support

For technical issues or questions regarding these security features, please refer to the system administrator or development team.