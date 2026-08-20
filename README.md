# actual212

Sync a [Trading 212](https://www.trading212.com) account value into [Actual Budget](https://actualbudget.org) account.

Each run reads `GET /api/v0/equity/account/summary` and uses `[@actual-app/api](https://actualbudget.org/docs/api/)` to add a balancing transaction so the Actual account matches.

## Run

```bash
cp .env.example .env
docker compose run --rm actual212
```

With no `CRON_SCHEDULE`, the process runs once and exits.

## Docker Compose

> [!TIP] 
> Run `actual212` next to Actual on a shared network so `ACTUAL_SERVER_URL=http://actual:5006` resolves.

1. Copy `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

2. Add actual212 to your `docker-compose.yml`:

   ```yaml
   networks:
     actual-network:

   services:
     actual:
       image: docker.io/actualbudget/actual-server:latest
       container_name: actual
       restart: unless-stopped
       networks:
         - actual-network
       volumes:
         - actual-data:/data
       healthcheck:
         test: ["CMD-SHELL", "node scripts/health-check.js"]
         interval: 60s
         timeout: 10s
         retries: 3
         start_period: 20s

     actual212:
       image: ghcr.io/joshhoughton/actual212:latest
       container_name: actual212
       restart: unless-stopped
       networks:
         - actual-network
       env_file: .env
       environment:
         ACTUAL_DATA_DIR: /data
       volumes:
         - actual212-data:/data
       depends_on:
         actual:
           condition: service_healthy

   volumes:
     actual-data:
     actual212-data:
   ```

   If Actual already runs in another stack, join that network instead of creating one:

   ```yaml
   networks:
     actual-network:
       external: true
       name: actual-network
   ```

3. Run `docker compose up -d` to start the service.

## Environment


| Variable                     | Required | Notes                                       |
| ---------------------------- | -------- | ------------------------------------------- |
| `T212_API_KEY`               | yes      | Trading 212 API key                         |
| `T212_API_SECRET`            | yes      | Trading 212 API secret                      |
| `T212_BASE_URL`              |          | Default `https://live.trading212.com`       |
| `ACTUAL_SERVER_URL`          | yes      | e.g. `http://actual:5006`                   |
| `ACTUAL_PASSWORD`            | yes      |                                             |
| `ACTUAL_SYNC_ID`             | yes      | Settings -> Show advanced settings          |
| `ACTUAL_ACCOUNT_NAME`        | yes      | Account to update                           |
| `ACTUAL_ENCRYPTION_PASSWORD` |          | If the budget file is encrypted             |
| `DRY_RUN`                    |          | `true` to log without writing               |
| `CRON_SCHEDULE`              |          | Cron schedule, leave this empty to run once |
| `TZ`                         |          | Timezone for the cron expression            |


