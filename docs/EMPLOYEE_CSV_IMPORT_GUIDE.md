# Employee CSV Import Guide

This guide explains how to use the CSV bulk import feature to add multiple employees to the system.

## Accessing the Bulk Import Feature

1. Navigate to **Admin > Users** page
2. Click the **Bulk Import** button in the header
3. The Bulk Import dialog will open with two tabs:
   - **CSV Upload**: Upload a CSV file with employee data
   - **Manual Entry**: Add employees one by one through the form

## CSV File Format

### Required Headers (in order)

The CSV file must have the following columns in this exact order:

```
firstName,lastName,email,password,department,position,status,phone,employeeId,hireDate,address,emergencyContactName,emergencyContactRelationship,emergencyContactPhone
```

### Field Descriptions

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| firstName | ✅ Yes | Employee's first name | Juan |
| lastName | ✅ Yes | Employee's last name | Dela Cruz |
| email | ✅ Yes | Unique email address | juan.delacruz@bisu.edu.ph |
| password | ✅ Yes | Initial password (will be hashed) | password123 |
| department | ❌ No | Department code | CCIS, CTAS, CCJ |
| position | ❌ No | Job position | Professor, Instructor, etc. |
| status | ❌ No | Employment status | PERMANENT, TEMPORARY, CONTRACTUAL |
| phone | ❌ No | Contact number | 09123456789 |
| employeeId | ✅ Yes | Unique employee ID | BISU-2024-001 |
| hireDate | ❌ No | Date hired (YYYY-MM-DD) | 2024-01-15 |
| address | ❌ No | Complete address | Tagbilaran City, Bohol |
| emergencyContactName | ❌ No | Emergency contact's name | Maria Dela Cruz |
| emergencyContactRelationship | ❌ No | Relationship to employee | Spouse, Parent, Sibling |
| emergencyContactPhone | ❌ No | Emergency contact's phone | 09987654321 |

### Important Notes

1. **Header Row**: The first row must contain the column headers exactly as shown above
2. **Employment Status**: Must be one of: `PERMANENT`, `TEMPORARY`, or `CONTRACTUAL` (defaults to CONTRACTUAL if not provided)
3. **Date Format**: Use `YYYY-MM-DD` format (e.g., 2024-01-15)
4. **Unique Fields**: `email` and `employeeId` must be unique across all users
5. **Email Format**: Must be a valid email address
6. **Commas in Data**: If your data contains commas, wrap the field in quotes

### Department Options

- **CTAS** - College of Teacher and Arts & Sciences
- **CCJ** - College of Criminal Justice
- **CCIS** - College of Computing and Information Sciences

### Position Options (by Department)

#### All Departments
- Professor
- Associate Professor
- Assistant Professor
- Instructor
- Lecturer
- Dean
- Department Head

#### CCIS Only (additional)
- System Administrator
- IT Support

## Sample CSV File

### Using the Template

The easiest way to get started is to:

1. Click **Download Template** button in the CSV Upload tab
2. Open the downloaded `employee_import_template.csv` file
3. Replace the sample data with your actual employee data
4. Save the file
5. Upload it using the file selector

### Example CSV Content

```csv
firstName,lastName,email,password,department,position,status,phone,employeeId,hireDate,address,emergencyContactName,emergencyContactRelationship,emergencyContactPhone
Juan,Dela Cruz,juan.delacruz@bisu.edu.ph,password123,CCIS,Professor,PERMANENT,09123456789,BISU-2024-001,2024-01-15,Tagbilaran City,Maria Dela Cruz,Spouse,09987654321
Maria,Santos,maria.santos@bisu.edu.ph,password123,CTAS,Associate Professor,PERMANENT,09123456788,BISU-2024-002,2024-02-01,Dauis Bohol,Pedro Santos,Spouse,09987654322
Pedro,Reyes,pedro.reyes@bisu.edu.ph,password123,CCJ,Instructor,TEMPORARY,09123456787,BISU-2024-003,2024-03-01,Panglao Bohol,Ana Reyes,Sister,09987654323
```

## Upload Process

1. **Select File**: Click "Select CSV File" or drag and drop your CSV file
2. **Preview**: The system will parse and display a preview of the employees
3. **Review**: Check for any validation errors (shown in red)
4. **Fix Errors**: If there are errors, download the data, fix the issues, and re-upload
5. **Import**: Click the "Import X Employees" button
6. **Confirmation**: You'll see a success message showing how many were created

## Validation Rules

The system validates each employee entry:

- ✅ **Email**: Must be unique and valid format
- ✅ **Employee ID**: Must be unique
- ✅ **Required Fields**: firstName, lastName, email, password, employeeId
- ✅ **Status**: Must be PERMANENT, TEMPORARY, or CONTRACTUAL
- ✅ **Date Format**: hireDate must be in YYYY-MM-DD format

## Error Handling

If an employee fails validation:
- The row will be highlighted in red
- Error messages will show below each invalid field
- You can remove individual employees from the preview
- Fix the CSV file and re-upload

If some employees succeed and others fail:
- Successfully created employees will be added to the system
- Failed entries will be shown in the error summary
- You can fix and re-import only the failed entries

## Tips for Successful Import

1. **Start Small**: Test with 2-3 employees first
2. **Use Template**: Always use the downloaded template
3. **Check Uniqueness**: Ensure email and employeeId are unique
4. **Verify Dates**: Use YYYY-MM-DD format for dates
5. **Review Preview**: Always review the preview before importing
6. **Keep Backup**: Keep a copy of your CSV file for reference

## Manual Entry Option

If you prefer not to use CSV, you can use the **Manual Entry** tab to:
- Add employees one at a time through a form
- Expand/collapse each employee entry
- Fill in all required and optional fields
- See real-time validation
- Import when ready

## Security Notes

- Passwords in the CSV will be hashed before storage
- Employees can change their password after first login
- Consider using a temporary password like "ChangeMe123" for initial imports
- Notify employees to change their password on first login

## Support

If you encounter issues with CSV import:
1. Verify your CSV matches the template format
2. Check for special characters or encoding issues
3. Ensure all required fields are filled
4. Contact system administrator for assistance
