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

## ⚙️ Setup & Local Development

### Prerequisites
- **Node.js** (v18.x or higher)
- **PostgreSQL** instance
- **Redis** instance (v6+)
- **Supabase Account** (for Auth & S3 storage)

### 1. Setting Up Ethereal Email (Fake SMTP)
Ethereal Email is a safe fake SMTP service where all sent emails are captured in a virtual inbox without hitting real recipients.
1. Go to [https://ethereal.email/create](https://ethereal.email/create).
2. Click **Create Ethereal Account**.
3. Note your generated **Account Email** (User) and **Password**.

### 2. Environment Variables Configuration
Create a `.env` file in the `backend` directory:
```env
# Server Config
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database & Cache
DATABASE_URL=postgresql://postgres:password@localhost:5432/outbox_db
REDIS_URL=redis://localhost:6379

# Concurrency & Rate Limiting
WORKER_CONCURRENCY=5
MIN_SEND_DELAY_MS=2000
MAX_EMAILS_PER_HOUR_PER_SENDER=200
MAX_EMAIL_RETRIES=3
EMAIL_SEND_TIMEOUT_MS=30000

# Ethereal Email SMTP Credentials
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your_ethereal_user@ethereal.email
ETHEREAL_PASSWORD=your_ethereal_password

# Supabase Auth & S3 Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_S3_ENDPOINT=https://your-project.storage.supabase.co/storage/v1/s3
SUPABASE_S3_REGION=ap-northeast-1
SUPABASE_S3_ACCESS_KEY=your_s3_access_key
SUPABASE_S3_SECRET_KEY=your_s3_secret_key
SUPABASE_S3_BUCKET=attachments
```

### 3. Running the Database Migrations
Run the initial SQL schema migrations to create the required tables:
```bash
npm install
npm run migrate
```

### 4. Running the Backend & BullMQ Worker
You can start both the Express API and the BullMQ worker concurrently:
```bash
npm run dev
```

Or run them in separate terminal tabs:
**Tab 1 (Express API):**
```bash
npm run dev:api
```
**Tab 2 (BullMQ Worker):**
```bash
npm run dev:worker
```
