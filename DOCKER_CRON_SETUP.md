# Docker Setup for Automatic Payroll Generation

## Quick Setup

### 1. Add Environment Variable

Add to your `.env` file:
```env
CRON_SECRET=your-random-secret-here-change-this
```

Generate a secure secret:
```powershell
# PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 2. Add Cron Service to Docker Compose

Open your `docker-compose.yml` and add this service:

```yaml
services:
  app:
    # ... your existing app service

  # Add this cron service
  payroll-cron:
    image: alpine:latest
    container_name: payroll-cron
    command: |
      sh -c '
      echo "0 8 * * * wget -q -O- http://app:3000/api/cron/payroll-generation?secret=${CRON_SECRET} || echo \"Failed\"" > /etc/crontabs/root
      crond -f -l 2
      '
    environment:
      - CRON_SECRET=${CRON_SECRET}
    depends_on:
      - app
    restart: unless-stopped
```

### 3. Restart Docker Containers

```bash
docker compose down
docker compose up -d
```

### 4. Verify Cron is Running

Check the cron container logs:
```bash
docker logs payroll-cron
```

You should see: `crond: crond (busybox 1.x.x) started, log level 2`

## How It Works

1. **Alpine cron container** runs alongside your app
2. **Daily at 8:00 AM**, it calls the payroll generation endpoint
3. **Endpoint checks** if payroll should be generated based on schedule
4. **If yes**, generates payroll and notifies admins
5. **If no**, returns reason (not a processing day, already generated, etc.)

## Testing

### Test the Endpoint Manually

From your host machine:
```bash
# Check if payroll should generate today
curl http://localhost:3000/api/admin/payroll/auto-generate

# Manually trigger generation
curl -X POST http://localhost:3000/api/admin/payroll/auto-generate
```

From inside the cron container:
```bash
docker exec payroll-cron wget -q -O- http://app:3000/api/cron/payroll-generation?secret=YOUR_SECRET
```

### View Cron Logs

```bash
docker logs -f payroll-cron
```

## Customizing the Schedule

Edit the cron schedule in `docker-compose.yml`:

```yaml
# Change this line:
echo "0 8 * * * wget..." 

# Schedule examples:
# "0 8 * * *"     - Daily at 8:00 AM
# "0 */6 * * *"   - Every 6 hours
# "0 9 * * 1"     - Every Monday at 9:00 AM
# "0 0 1,15 * *"  - 1st and 15th of month at midnight
```

Then restart:
```bash
docker compose restart payroll-cron
```

## Troubleshooting

### Cron not running?
```bash
# Check if container is running
docker ps | grep payroll-cron

# Check logs
docker logs payroll-cron

# Restart the service
docker compose restart payroll-cron
```

### Endpoint not responding?
```bash
# Check if app is accessible from cron container
docker exec payroll-cron wget -q -O- http://app:3000/api/health

# Check if CRON_SECRET is set
docker exec payroll-cron env | grep CRON_SECRET
```

### Wrong time zone?
The cron runs in UTC by default. To use a different timezone:

```yaml
payroll-cron:
  # ... existing config
  environment:
    - CRON_SECRET=${CRON_SECRET}
    - TZ=Asia/Manila  # Add timezone
```

Adjust your cron schedule accordingly or set TZ.

## Security Notes

- ✅ Keep `CRON_SECRET` private and strong
- ✅ Don't commit `.env` file to git
- ✅ The cron container only has network access to your app
- ✅ Use HTTPS in production deployments

## Complete Example

Here's a complete docker-compose.yml with the cron service:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    env_file:
      - .env
    environment:
      NODE_ENV: development
      TZ: ${TZ:-Asia/Manila}
    ports:
      - "3000:3000"
    volumes:
      - .:/app:delegated
      - node_modules:/app/node_modules
    restart: unless-stopped

  payroll-cron:
    image: alpine:latest
    container_name: payroll-cron
    command: |
      sh -c '
      echo "0 8 * * * wget -q -O- http://app:3000/api/cron/payroll-generation?secret=${CRON_SECRET} || echo \"Failed\"" > /etc/crontabs/root
      crond -f -l 2
      '
    environment:
      - CRON_SECRET=${CRON_SECRET}
      - TZ=${TZ:-Asia/Manila}
    depends_on:
      - app
    restart: unless-stopped

volumes:
  node_modules:
```

## Next Steps

1. ✅ Add cron service to docker-compose.yml
2. ✅ Set CRON_SECRET in .env
3. ✅ Restart containers: `docker compose up -d`
4. ✅ Configure payroll schedule in admin dashboard
5. ✅ Test the endpoint
6. ✅ Monitor the logs on scheduled days

That's it! Your payroll will now generate automatically based on your configured schedule.
