# Outbox - Backend Services

This is the backend for the Outbox scheduling engine. It handles API requests, queues background jobs, and enforces rate-limiting constraints using a combination of PostgreSQL and Redis.

## 🛠 Tech Stack
- **Node.js + Express**: REST API framework.
- **TypeScript**: Strictly typed backend code.
- **PostgreSQL**: Primary data store for users, scheduled jobs, sent logs, and idempotency states.
- **Redis & BullMQ**: Background job queue processing with advanced delay features.
- **Nodemailer**: SMTP client connecting to Ethereal Email for testing.
- **Supabase S3**: For parsing and storing multipart form attachments.

## 🚀 Key Features
1. **Zero-Cron Scheduling**: Uses BullMQ delayed jobs to schedule tasks up to months in advance.
2. **Robust Rate Limiting**: Uses a Redis sliding-window algorithm to enforce `MAX_EMAILS_PER_HOUR_PER_SENDER`. If the limit is hit, jobs are delayed to the next hour (`moveToDelayed`) instead of being dropped.
3. **Provider Throttling**: The background worker explicitly awaits a configurable delay (`MIN_SEND_DELAY_MS`) between emails to mimic real SMTP limits.
4. **Fault Tolerant**: Maintains an `idempotency_key` and relies on Postgres for state tracking. If a worker crashes mid-send, it won't double-send the email on reboot.

## ⚙️ Running Locally

1. Create a `.env` file based on the root documentation.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run migrations to initialize PostgreSQL tables:
   ```bash
   npm run migrate
   ```
4. Start the API server and the Worker:
   ```bash
   npm run dev:api
   npm run dev:worker
   ```
