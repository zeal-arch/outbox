# ReachInbox - Outbox Labs

A full-stack email job scheduler that accepts email scheduling requests and reliably sends them at a specified time, simulating real-world rate-limiting and robust behavior using BullMQ and Redis.

## Architecture Overview

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (handling job states, idempotency, and attachments tracking)
- **Message Queue / Scheduler**: BullMQ + Redis (delayed jobs handles scheduling without OS cron)
- **Rate Limiting**: Custom implementation using BullMQ delays and rate-limiter logic to respect maximum emails per hour per sender (e.g. `MAX_EMAILS_PER_HOUR_PER_SENDER`) and minimum delays between sends.
- **Email Delivery**: Fake SMTP using Ethereal Email.
- **Frontend**: Next.js (App Router) + Tailwind CSS + TypeScript. Features Google OAuth integration (via Supabase), dynamic dashboard (viewing sent & scheduled emails), and a rich compose editor.
- **Idempotency**: All jobs insert with a unique `idempotency_key` in the database within a robust transaction, protecting against double-submissions or server crashes mid-queueing.
- **Storage**: AWS S3 compatible object storage (Supabase S3) for handling file attachments.

### Rate Limiting & Delays Details
- **Min delay between sends**: Enforced by scheduling successive BullMQ jobs with offset timestamps (`input.delaySeconds` multiplied by index).
- **Hourly Limits**: Handled via BullMQ rate limiter overrides and fallback checks inside the worker using `MAX_EMAILS_PER_HOUR_PER_SENDER`. If the rate limit is hit, jobs aren't dropped; they are gracefully pushed into the next hour window using `moveToDelayed`.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- Redis server
- Supabase project (for Auth & S3 Storage)
- Ethereal Email account (for SMTP)

### 1. Database & Environment Setup
Clone the repository and install dependencies in both `/backend` and `/frontend`.

In `/backend`, create a `.env` file based on `.env.example`:
```env
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgres://...
REDIS_URL=redis://localhost:6379
WORKER_CONCURRENCY=5
MIN_SEND_DELAY_MS=2000
MAX_EMAILS_PER_HOUR_PER_SENDER=200

# Ethereal Email (Fake SMTP)
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your_ethereal_user
ETHEREAL_PASSWORD=your_ethereal_password

# Supabase Storage / S3
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_S3_ENDPOINT=your_s3_endpoint
SUPABASE_S3_REGION=ap-northeast-1
SUPABASE_S3_ACCESS_KEY=your_s3_access_key
SUPABASE_S3_SECRET_KEY=your_s3_secret_key
SUPABASE_S3_BUCKET=your_bucket_name
```

In `/frontend`, create a `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Run Migrations
In the `/backend` directory, run the database migrations to set up the necessary tables (`email_jobs`, `email_attachments`, etc.).

### 3. Start the Application

You need to run three separate processes:
1. **Backend API Server**: `cd backend && npm run dev`
2. **Backend BullMQ Worker**: `cd backend && npm run worker`
3. **Frontend Next.js App**: `cd frontend && npm run dev`

Navigate to `http://localhost:3000` to log in via Google OAuth, view your dashboard, and start scheduling email campaigns!
