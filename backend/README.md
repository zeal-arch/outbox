# Outbox Backend Engine

A high-throughput, fault-tolerant email scheduling API powered by BullMQ, Redis, and PostgreSQL.

## Overview

The Outbox Backend is an Express.js REST API that acts as the core scheduling and dispatch engine. Built strictly without OS-level cron jobs, it leverages **BullMQ** and **Redis** for stateful, delayed job execution, and relies on **PostgreSQL** for strict idempotency guarantees.

This architecture ensures that the system can handle thousands of concurrent email scheduling requests, gracefully manage provider rate-limiting, and survive complete server crashes without double-sending or losing emails.

---

## System Architecture

1. **API Layer (Express)**: Accepts scheduling payloads, uploads multipart attachments directly to Supabase S3, and persists the initial `email_jobs` state in PostgreSQL.
2. **Scheduling Engine (BullMQ)**: Uses `addBulk` to distribute delayed jobs into Redis. Redis Sorted Sets (ZSET) are used to promote jobs from `delayed` to `waiting` precisely when their execution time hits.
3. **Sliding-Window Rate Limiter**: Uses atomic Redis counters (`INCR` + `EXPIRE`) to track hourly sending quotas. Overflowing jobs are intelligently delayed (`moveToDelayed`) rather than dropped.
4. **Worker Pool (BullMQ Workers)**: Pulls ready jobs, verifies idempotency against PostgreSQL, enforces a strict `MIN_SEND_DELAY_MS` to mimic provider throttling, streams S3 attachments, and dispatches via Ethereal SMTP.

---

## Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Express.js / Node.js | REST API & Worker processes |
| **Language** | TypeScript | Strict static typing and developer experience |
| **Database** | PostgreSQL | Persistence, relationships, and idempotency checks |
| **Queue** | BullMQ & Redis | Delayed job scheduling and rate-limiting counters |
| **Storage** | Supabase S3 | Multipart form parsing and attachment streaming |
| **Email** | Nodemailer / Ethereal | Fake SMTP delivery target |

---

## Local Development Setup

### 1. Prerequisites
- **Node.js** (v18.x or newer)
- **PostgreSQL** Database
- **Redis** Cluster (v6.x or newer)
- **Supabase Account** (For S3 buckets)

### 2. Configure Environment Variables
Create a `.env` file at the root of the `backend` directory. 
*(Note: `GOOGLE_CLIENT_ID` is omitted as authentication is securely handled client-side via Supabase).*

```env
# Server & Environment
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database & Cache Connections
DATABASE_URL=postgresql://user:pass@localhost:5432/outbox
REDIS_URL=redis://localhost:6379

# Concurrency & Tuning
WORKER_CONCURRENCY=5
MIN_SEND_DELAY_MS=2000
MAX_EMAILS_PER_HOUR_PER_SENDER=200
MAX_EMAIL_RETRIES=3
EMAIL_SEND_TIMEOUT_MS=30000

# Ethereal Email (Fake SMTP)
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your_ethereal_user
ETHEREAL_PASSWORD=your_ethereal_password

# Supabase Auth & S3
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_S3_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
SUPABASE_S3_REGION=ap-northeast-1
SUPABASE_S3_ACCESS_KEY=your_access_key
SUPABASE_S3_SECRET_KEY=your_secret_key
SUPABASE_S3_BUCKET=attachments
```

### 3. Initialize Database
Install dependencies and run the provided SQL migrations to create the required tables:
```bash
npm install
npm run migrate
```

### 4. Start the Services
The architecture supports running the API and the Worker either combined or as separate scaled processes.

**Run Concurrently (Development):**
```bash
npm run dev
```

**Run Separately (Production/Scale Testing):**
```bash
npm run dev:api     # Tab 1: Starts the Express API
npm run dev:worker  # Tab 2: Starts the BullMQ consumers
```

---

## Security & Auth
All protected routes require a Bearer token. The API verifies the JWT against your Supabase project instance using `supabase.auth.getUser()`, ensuring complete stateless security without local session management.
