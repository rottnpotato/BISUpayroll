## Docker Development Setup

This guide explains how to run the BISU Payroll app in Docker for development with hot reload while using PostgreSQL installed on your machine (not a DB container).

### Prerequisites

- Docker Desktop 4.x (Windows/macOS) or Docker Engine (Linux)
- For Windows: enable WSL2 backend in Docker Desktop
- PostgreSQL installed and running on your host machine

### Files added

- `Dockerfile`: Dev image with pnpm, security improvements, and polling-based hot reload
- `docker-compose.yml`: App container with optimized volume mounts (uses host Postgres)
- `.dockerignore`: Keeps images lean and builds fast

### Environment variables

1) Copy the example env and adjust secrets as needed:

```bash
cp env.example .env
```

2) Ensure your `.env` has a `DATABASE_URL` pointing to your host Postgres. From inside the container, use `host.docker.internal` so it works on Windows/macOS and Linux:

```env
DATABASE_URL="postgresql://username:password@host.docker.internal:5432/bisu_payroll?schema=public"
```

**Important**: Replace `username` and `password` with your actual PostgreSQL credentials.

### First run

```bash
docker compose up --build
```

What happens:
- `app` builds the Node image using **pnpm** for faster, reliable dependency resolution
- Prisma client is generated during build and on container start
- Next.js dev server starts with hot reload enabled
- Container runs as non-root user for security

Open http://localhost:3000

### Hot reload

- Source code is bind-mounted into the container with optimized performance (`.:/app:delegated`)
- Hot reload is enabled via `WATCHPACK_POLLING` and `CHOKIDAR_USEPOLLING`
- Volume mounts for `node_modules`, `.next`, and `.pnpm-store` improve performance
- Changes in your editor trigger rebuild/reload automatically

### Database commands

Run Prisma commands inside the `app` service using **pnpm**:

```bash
docker compose exec app pnpm run db:generate
docker compose exec app pnpm run db:migrate
docker compose exec app pnpm run db:seed
```

To reset the database in dev:

```bash
docker compose exec app npx prisma migrate reset --force
```

### Useful commands

```bash
# Start services in background
docker compose up -d

# View logs
docker compose logs -f app

# Rebuild after dependency changes
docker compose build app && docker compose up -d

# Open a shell in the app container
docker compose exec app sh

# Stop and remove containers
docker compose down

# Clean up everything (containers, volumes, images)
docker compose down -v --rmi all
```

### Performance & Security Improvements

- **pnpm**: Uses pnpm instead of npm for faster, more reliable dependency resolution
- **Security**: Container runs as non-root user (uid/gid 1001)
- **Optimized volumes**: Separate volumes for `node_modules`, `.next`, `.pnpm-store`, and Prisma cache
- **Better caching**: Improved Docker layer caching for faster rebuilds
- **Signal handling**: Uses `dumb-init` for proper signal handling

### Notes

- The `app` container exposes port 3000. If you need a different port, change the mapping in `docker-compose.yml`.
- `secure-payroll-files/` is excluded from images by `.dockerignore`. If you need to test file generation inside the container, ensure that directory exists and is writable on the host.
- If you add native dependencies, rebuild the `app` image: `docker compose build --no-cache app`
- Volume mounts with `:delegated` flag improve performance on macOS/Windows


