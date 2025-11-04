# Automatic Payroll Generation - Quick Setup

## What's New

✅ **Automatic payroll generation based on schedule**
- Monthly, Bi-Monthly, or Weekly schedules
- Automatic calculation of pay periods
- Admin notifications when payroll is generated

✅ **Smart period detection**
- Bi-Monthly: Generates for 1-15 or 16-end of month based on current day
- Monthly: Generates for previous full month
- Weekly: Generates for previous Sunday-Saturday

## Quick Start

### 1. Run Database Migration

```powershell
npx prisma migrate dev --name add_notifications_and_auto_payroll
```

This adds:
- `Notification` model for admin alerts
- Enhanced payroll tracking

### 2. Configure Schedule (Admin Dashboard)

1. Go to **Admin → Payroll → Schedules**
2. Create a new schedule:
   - **Name**: "Bi-Monthly Payroll" (or your preference)
   - **Type**: Bi-Monthly (or Monthly/Weekly)
   - **Processing Days** (for bi-monthly):
     - **1st Period** (1-15): Generate on **20th**
     - **2nd Period** (16-end): Generate on **5th** of next month
   - **Active**: ✓ (Only one schedule can be active)

### 3. Set Up Cron Job

Add to your `.env`:
```env
CRON_SECRET=your-random-secret-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### Option A: Docker Compose with Cron Container (Recommended)

Add a cron service to your `docker-compose.yml`:
```yaml
services:
  # ... your existing services

  payroll-cron:
    image: alpine:latest
    container_name: payroll-cron
    command: |
      sh -c '
      echo "0 8 * * * wget -q -O- http://web:3000/api/cron/payroll-generation?secret=YOUR_SECRET" > /etc/crontabs/root
      crond -f -l 2
      '
    depends_on:
      - web
    restart: unless-stopped
```

Restart Docker containers:
```bash
docker compose down
docker compose up -d
```

#### Option B: Host System Cron (Windows Task Scheduler)

1. Open Task Scheduler
2. Create a new task: Daily at 8:00 AM
3. Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-Command "Invoke-WebRequest -Uri 'http://localhost:3000/api/cron/payroll-generation?secret=YOUR_SECRET' -Method POST"`

#### Option C: External Service (cron-job.org)

- **URL**: `http://your-server-ip:3000/api/cron/payroll-generation?secret=YOUR_SECRET`
- **Schedule**: Daily at 8:00 AM
- **Method**: GET or POST

## How It Works

### Example: Bi-Monthly Schedule

**Today is November 20th** → System generates payroll for **Nov 1-15**
**Today is December 5th** → System generates payroll for **Nov 16-30**

### Example: Monthly Schedule

**Today is November 5th** → System generates payroll for **October 1-31**

## Testing

### 1. Check if payroll should generate today:
```bash
curl http://localhost:3000/api/admin/payroll/auto-generate
```

### 2. Manually trigger generation:
```bash
curl -X POST http://localhost:3000/api/admin/payroll/auto-generate
```

### 3. Test cron endpoint:
```bash
curl "http://localhost:3000/api/cron/payroll-generation?secret=YOUR_SECRET"
```

### 4. Check Docker cron logs (if using Docker):
```bash
docker logs -f payroll-cron
```

## Key Files Created

When payroll is auto-generated, admins receive notifications showing:
- 📊 Number of employees processed
- 📅 Pay period dates
- 💰 Total gross and net pay
- 🔗 Link to view payroll

Access notifications in the admin dashboard (bell icon).

## Key Files Created

| File | Purpose |
|------|---------|
| `lib/payroll-schedule-utils.ts` | Calculate pay periods based on schedule |
| `app/api/admin/payroll/auto-generate/route.ts` | Auto-generate payroll endpoint |
| `app/api/cron/payroll-generation/route.ts` | Cron job trigger endpoint |
| `app/api/admin/notifications/route.ts` | Notification management API |
| `components/notification-bell.tsx` | Notification UI component |
| `docker-compose.cron.example.yml` | Docker cron service example |
| `DOCKER_CRON_SETUP.md` | Docker-specific setup guide |
| `docs/AUTOMATIC_PAYROLL_GENERATION.md` | Complete documentation |

## Troubleshooting

❌ **Payroll not generating?**
- Check that a schedule is marked "Active"
- Verify today matches a processing day
- Check application logs

❌ **Notifications not showing?**
- Ensure user role is "ADMIN"
- Run database migration
- Refresh the page

❌ **Cron not running?**
- Verify the URL and secret token
- Check cron service logs
- Test the endpoint manually

## Manual Generation

You can still manually generate payroll:
1. Go to **Admin → Payroll**
2. Select date range
3. Click "Generate Payroll"

This won't interfere with automatic generation.

## Need Help?

See full documentation: `docs/AUTOMATIC_PAYROLL_GENERATION.md`
