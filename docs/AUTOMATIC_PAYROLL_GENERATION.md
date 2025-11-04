# Automatic Payroll Generation Setup Guide

This guide explains how to set up automatic payroll generation based on the configured payroll schedule.

## Overview

The system now supports automatic payroll generation based on the active payroll schedule:

- **Monthly Schedule**: Generates payroll for the entire previous month on the configured release day
- **Bi-Monthly Schedule**: Generates payroll twice per month (1st-15th and 16th-end of month) on configured processing days
- **Weekly Schedule**: Generates payroll for the previous week (Sunday-Saturday) every Monday

## How It Works

1. **Schedule Configuration**: Admin configures a payroll schedule in the admin dashboard with:
   - Schedule type (monthly, bi-monthly, or weekly)
   - Processing days (when to generate payroll)
   - Cutoff days (for reference)

2. **Automatic Generation**: A cron job checks daily if payroll should be generated based on:
   - Current date matches a processing day
   - Active schedule exists
   - Payroll hasn't already been generated for that period

3. **Admin Notifications**: When payroll is auto-generated, all admin users receive notifications with:
   - Number of employees processed
   - Pay period dates
   - Total gross and net pay
   - Link to view the generated payroll

## Setup Instructions

### 1. Configure Payroll Schedule

1. Go to **Admin Dashboard > Payroll > Schedules**
2. Click "Add Schedule"
3. Configure the schedule:
   - **Name**: e.g., "Bi-Monthly Payroll"
   - **Type**: Choose between Monthly, Bi-Monthly, or Weekly
   - **Processing Days**: 
     - For bi-monthly: e.g., 20th (generates 1-15 period) and 5th (generates 16-end period)
     - For monthly: e.g., 5th of each month
   - **Is Active**: Toggle ON to activate
4. Save the schedule

**Important**: Only ONE schedule should be active at a time.

### 2. Set Up Cron Job

You need to set up an external cron job to trigger the automatic generation. Here are several options:

#### Option A: Docker Compose with Cron Container (Recommended for Docker deployments)

Add a cron service to your `docker-compose.yml`:

```yaml
services:
  # ... your existing services (web, db, etc.)

  payroll-cron:
    image: alpine:latest
    container_name: payroll-cron
    command: |
      sh -c '
      echo "0 8 * * * wget -q -O- http://web:3000/api/cron/payroll-generation?secret=YOUR_SECRET_TOKEN" > /etc/crontabs/root
      crond -f -l 2
      '
    depends_on:
      - web
    restart: unless-stopped
```

Restart your Docker containers:
```bash
docker compose down
docker compose up -d
```

This runs daily at 8:00 AM (container time).

#### Option B: External Cron Service (cron-job.org, EasyCron, etc.)

1. Sign up for a free cron service like [cron-job.org](https://cron-job.org)
2. Create a new cron job with:
   - **URL**: `https://your-domain.com/api/cron/payroll-generation?secret=YOUR_SECRET_TOKEN`
   - **Schedule**: Daily at 8:00 AM (your timezone)
   - **Method**: GET or POST

#### Option C: Windows Task Scheduler (For host system)

1. Open Task Scheduler
2. Create a new task
3. Set trigger: Daily at 8:00 AM
4. Set action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-Command "Invoke-WebRequest -Uri 'https://your-domain.com/api/cron/payroll-generation?secret=YOUR_SECRET_TOKEN' -Method POST"`

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Optional: Secret token for cron endpoint security
CRON_SECRET=your-random-secret-token-here

# Base URL for the application (needed for internal API calls)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

Generate a secure random token:
```bash
# Linux/Mac
openssl rand -base64 32

# PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Testing

### Test the Schedule Check

Test if payroll should be generated today (without actually generating):

```bash
curl https://your-domain.com/api/admin/payroll/auto-generate
```

Expected response:
```json
{
  "shouldGenerate": true/false,
  "reason": "Scheduled bi-monthly payroll generation for period...",
  "period": {
    "start": "2025-11-01T00:00:00.000Z",
    "end": "2025-11-15T23:59:59.999Z",
    "schedule": {
      "id": "...",
      "name": "Bi-Monthly Payroll",
      "type": "bi-monthly"
    }
  }
}
```

### Test Automatic Generation

Manually trigger payroll generation:

```bash
curl -X POST https://your-domain.com/api/admin/payroll/auto-generate
```

Expected response:
```json
{
  "generated": true,
  "schedule": {
    "id": "...",
    "name": "Bi-Monthly Payroll",
    "type": "bi-monthly"
  },
  "period": {
    "start": "2025-11-01T00:00:00.000Z",
    "end": "2025-11-15T23:59:59.999Z"
  },
  "results": {
    "employeeCount": 50,
    "totalGrossPay": 500000,
    "totalNetPay": 450000
  },
  "notifications": {
    "adminsNotified": 3
  }
}
```

### Test Cron Endpoint

Test the cron job endpoint:

```bash
curl "https://your-domain.com/api/cron/payroll-generation?secret=YOUR_SECRET_TOKEN"
```

## Schedule Examples

### Example 1: Bi-Monthly (15th & Last Day)

**Processing Days**: 
- **20th**: Generates payroll for 1st-15th of current month
- **5th**: Generates payroll for 16th-end of previous month

**Timeline**:
- Nov 20: Generates payroll for Nov 1-15
- Dec 5: Generates payroll for Nov 16-30
- Dec 20: Generates payroll for Dec 1-15
- Jan 5: Generates payroll for Dec 16-31

### Example 2: Monthly

**Release Day**: 5th of each month

**Timeline**:
- Nov 5: Generates payroll for October (Oct 1-31)
- Dec 5: Generates payroll for November (Nov 1-30)
- Jan 5: Generates payroll for December (Dec 1-31)

### Example 3: Weekly

**Processing Day**: Every Monday

**Timeline**:
- Nov 4 (Monday): Generates payroll for Oct 27 (Sun) - Nov 2 (Sat)
- Nov 11 (Monday): Generates payroll for Nov 3 (Sun) - Nov 9 (Sat)
- Nov 18 (Monday): Generates payroll for Nov 10 (Sun) - Nov 16 (Sat)

## Viewing Generated Payroll

After automatic generation:

1. **Notifications**: Admin users will see a notification bell icon with a badge
2. Click the notification to go to the payroll page
3. View the generated payroll ledger
4. Review, approve, and process payments as needed

## Troubleshooting

### Payroll Not Generating

1. **Check Active Schedule**: Ensure a schedule is marked as "Active"
2. **Check Processing Days**: Verify today matches a configured processing day
3. **Check Logs**: View application logs for errors
4. **Test Endpoint**: Call the auto-generate endpoint manually to see the response

### Duplicate Payroll Generation

The system prevents duplicate generation by checking if payroll already exists for the period. If you need to regenerate:

1. Delete the existing PayrollResult records for that period
2. Run the generation again

### Notifications Not Appearing

1. **Check Database**: Verify notifications were created in the `notifications` table
2. **Check User Role**: Only users with role "ADMIN" receive auto-generation notifications
3. **Refresh Page**: Notification badge updates on page load

### Cron Job Not Running

1. **Verify URL**: Ensure the cron URL is correct and accessible
2. **Check Secret Token**: Ensure the secret parameter matches your `.env` CRON_SECRET
3. **Test Manually**: Call the cron endpoint manually with curl/browser
4. **Check Service Logs**: Review logs from your cron service provider

## Security Considerations

1. **Secret Token**: Always use a strong, random secret token for the cron endpoint
2. **HTTPS**: Only expose the cron endpoint over HTTPS in production
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse
4. **IP Whitelist**: Optionally restrict access to specific IP addresses

## Monitoring

Monitor the automatic payroll generation:

1. **Check Notifications**: Review admin notifications for generation summaries
2. **View Audit Logs**: Check the audit log for payroll generation events
3. **Database Queries**: Query `PayrollResult` table for recent generations
4. **Application Logs**: Review server logs for any errors or warnings

## Manual Override

If you need to manually generate payroll outside the schedule:

1. Go to **Admin Dashboard > Payroll**
2. Use the "Generate Payroll" card
3. Select the desired date range manually
4. Click "Generate Payroll"

This won't interfere with the automatic generation system.
