# Outbox - Scalable Email Scheduling & Dispatch System

A production-ready full-stack email scheduling and dispatch engine built to simulate real-world email infrastructure. It features persistent queues, sliding-window rate limiting, provider throttling, fault tolerance with automatic retries, idempotency guarantees, attachment support, and a modern Next.js dashboard.

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
   - [How Scheduling Works (Zero Cron)](#1-how-scheduling-works-zero-cron)
   - [How Persistence on Restart is Handled](#2-how-persistence-on-restart-is-handled)
   - [How Rate Limiting & Concurrency are Implemented](#3-how-rate-limiting--concurrency-are-implemented)
2. [Features Implemented](#-features-implemented)
   - [Backend Features](#backend-features)
   - [Frontend Features](#frontend-features)
3. [Setup & Local Development](#-setup--local-development)
   - [Prerequisites](#prerequisites)
   - [Setting Up Ethereal Email (Fake SMTP)](#setting-up-ethereal-email-fake-smtp)
   - [Environment Variables Configuration](#environment-variables-configuration)
   - [Running the Database Migrations](#running-the-database-migrations)
   - [Running the Backend & BullMQ Worker](#running-the-backend--bullmq-worker)
   - [Running the Frontend](#running-the-frontend)
4. [Deployment Details](#-deployment-details)

---

## 🏗 Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │           Next.js Frontend              │
                      │  (Google OAuth / Compose / Dashboards)  │
                      └────────────────────┬────────────────────┘
                                           │ HTTP / REST API (JWT)
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │          Express API Server             │
                      │  - Validation & S3 Attachment Upload    │
                      │  - PostgreSQL Transaction (Idempotency) │
                      │  - BullMQ addBulk() Queueing            │
                      └────────────┬───────────────┬────────────┘
                                   │               │
                 Writes DB Records │               │ Schedules Jobs
                                   ▼               ▼
                      ┌─────────────────┐   ┌───────────────────┐
                      │   PostgreSQL    │   │   Redis Cluster   │
                      │  (Persistence & │   │  (BullMQ Delayed  │
                      │   State Sync)   │   │  & Sliding Window)│
                      └────────┬────────┘   └─────────┬─────────┘
                               ▲                      │
                               │ Reads/Updates Status │ Consumes Delayed Jobs
                               │                      ▼
                      ┌────────┴────────────────────────────────┐
                      │          BullMQ Worker Pool             │
                      │  - Concurrency Control (5x Parallel)    │
                      │  - Rate Limiter Check (Sliding Window)  │
                      │  - Throttling Delay (2s between sends)  │
                      │  - S3 Attachment Stream Fetch           │
                      │  - Nodemailer SMTP Dispatcher           │
                      └────────────────────┬────────────────────┘
                                           │ SMTP / TLS
                                           ▼
                              ┌─────────────────────────┐
                              │     Ethereal Email      │
                              │  (SMTP Delivery Target) │
                              └─────────────────────────┘
```

---

### 1. How Scheduling Works (Zero Cron)
- **No Cron Jobs:** This system strictly adheres to the hard constraint of **never using OS-level cron** (`crontab`) or Node cron libraries (`node-cron`, `agenda`).
- **BullMQ Delayed Jobs:** When an email campaign is scheduled for a target timestamp `T`:
  1. The delay is calculated as `delayMs = Math.max(0, new Date(targetTime).getTime() - Date.now())`.
  2. If staggered sending is requested or multiple recipients are provided, each successive recipient job adds an incremental provider throttling delay: `jobDelay = delayMs + (index * (delaySeconds * 1000))`.
  3. Jobs are queued in bulk via `emailQueue.addBulk(jobsToQueue)`.
  4. Redis stores the delayed jobs in a sorted set (`ZSET`) keyed by execution timestamp. When `targetTime` arrives, Redis automatically promotes the job from `delayed` to `wait` status for the BullMQ worker to consume.

---

### 2. How Persistence on Restart is Handled
- **Redis Queue State:** Because BullMQ maintains its delayed and waiting job states inside persistent Redis storage, any server restart, crash, or deployment does **not** lose future scheduled jobs. The worker automatically picks up pending jobs as soon as it reconnects.
- **Dual-State Idempotency via PostgreSQL:**
  - Before an email is scheduled, an `email_jobs` row is created with `status = 'scheduled'` and a unique `idempotency_key`.
  - When the worker receives a job, its very first step is to query PostgreSQL:
    ```sql
    SELECT status FROM email_jobs WHERE id = $1
    ```
  - If the status is already `'sent'`, the worker immediately returns without resending.
  - If a worker crashes mid-send or after sending before acknowledging BullMQ, the retry will see the updated status in PostgreSQL and prevent duplicate delivery.

---

### 3. How Rate Limiting & Concurrency are Implemented
- **Configurable Worker Concurrency:**
  - Configured via `WORKER_CONCURRENCY` (e.g. `5`).
  - BullMQ processes up to 5 jobs in parallel across threads without blocking the event loop.
- **Provider Throttling (Inter-Email Delay):**
  - Configured via `MIN_SEND_DELAY_MS` (e.g. `2000` ms).
  - Enforces a minimum delay between individual email sends to mimic real-world provider throttling and prevent IP reputation degradation.
- **Sliding-Window Hourly Rate Limiting:**
  - Configured via `MAX_EMAILS_PER_HOUR_PER_SENDER` (e.g. `200` emails/hour).
  - Managed by `RateLimiterService` using Redis atomic counters:
    - **Key Format:** `ratelimit:<senderId>:<YYYY-MM-DDTHH>`
    - Uses `redis.incr(key)` with auto-expiring TTL (2 hours).
  - **Graceful Overflow Handling (No Dropped Jobs):**
    - When `currentCount > MAX_EMAILS_PER_HOUR_PER_SENDER`, the job is **not dropped or marked failed**.
    - The worker calculates the exact milliseconds until the top of the next hour window:
      ```ts
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      const retryAfterMs = nextHour.getTime() - Date.now();
      ```
    - The worker invokes `await job.moveToDelayed(Date.now() + retryAfterMs, token)` and throws `new DelayedError()`.
    - BullMQ automatically reschedules the job for the next hour window while preserving order.

---

## ✨ Features Implemented

### Backend Features
| Category | Implementation Details |
| :--- | :--- |
| **Scheduler Engine** | BullMQ + Redis delayed queue. Zero reliance on `cron` or `node-cron`. Supports multi-recipient campaigns. |
| **Persistence** | PostgreSQL + Redis state machine. Survives process crashes and restarts without re-sending old emails. |
| **Rate Limiter** | Redis-backed sliding-window hourly limiter per sender with automatic `moveToDelayed` rescheduling on overflow. |
| **Concurrency & Throttling** | Multi-worker parallel processing with configurable worker concurrency and inter-email delay. |
| **Fault Tolerance & Retries** | Configurable exponential backoff retry mechanism (`MAX_EMAIL_RETRIES`, default 3 attempts). Status updates tracked in DB. |
| **Attachment Handling** | Direct multipart upload to Supabase S3 Object Storage, linked with foreign keys, and streamed on dispatch. |
| **Draft Deletion** | Automatic cleanup of corresponding draft record from PostgreSQL once scheduled. |
| **Authentication Middleware** | Supabase JWT verification guarding all protected scheduling endpoints. |

### Frontend Features
| Feature | Description |
| :--- | :--- |
| **Google OAuth Login** | Real Google OAuth login flow powered by Supabase Auth with automatic session persistence. |
| **Dashboard Layout** | Clean responsive UI following the Figma design, with dark mode toggle, user avatar, and navigation. |
| **Compose Modal / Page** | Rich compose interface with instant email validation, multi-recipient parsing, date-time picker, and attachment uploader. |
| **Scheduled Emails Tab** | Real-time overview of all upcoming email campaigns, scheduled execution times, and current queue statuses. |
| **Sent Emails Tab** | Comprehensive log of sent and failed emails with recipient info, subject, status badge, and sent timestamps. |
| **Draft Management** | Saves work in progress to the database and removes drafts upon successful campaign scheduling. |

---

## 🚀 Setup & Local Development

### Prerequisites
- **Node.js** (v18.x or higher)
- **PostgreSQL** instance
- **Redis** instance (v6+)
- **Supabase Account** (for Auth & S3 storage)

---

### Setting Up Ethereal Email (Fake SMTP)
Ethereal Email is a safe fake SMTP service where all sent emails are captured in a virtual inbox without hitting real recipients.

1. Go to [https://ethereal.email/create](https://ethereal.email/create).
2. Click **Create Ethereal Account**.
3. Note your generated **Account Email** (User) and **Password**.
4. Use these values for `ETHEREAL_USER` and `ETHEREAL_PASSWORD` in your backend configuration.

---

### Environment Variables Configuration

#### 1. Backend (`backend/.env`)
Create `backend/.env` with the following variables:

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

#### 2. Frontend (`frontend/.env.local`)
Create `frontend/.env.local` with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

### Running the Database Migrations
Run the initial SQL schema migrations to create the required tables (`senders`, `email_jobs`, `email_attachments`, `email_drafts`):

```bash
cd backend
npm install
npm run migrate
```

---

### Running the Backend & BullMQ Worker

You can start both the Express API and the BullMQ worker concurrently:

```bash
cd backend
npm run dev
```

Or run them in separate terminal tabs:

**Tab 1 (Express API):**
```bash
cd backend
npm run dev:api
```

**Tab 2 (BullMQ Worker):**
```bash
cd backend
npm run dev:worker
```

---

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment Details

| Component | Platform | URL |
| :--- | :--- | :--- |
| **Frontend** | Vercel | [https://frontend-eta-opal-86.vercel.app](https://frontend-eta-opal-86.vercel.app) |
| **Backend API + Worker** | Railway | [https://backend-combined-production.up.railway.app](https://backend-combined-production.up.railway.app) |
| **PostgreSQL & Redis** | Railway | Private internal network mesh |
| **Authentication & Storage** | Supabase | Auth OAuth + S3-compatible bucket |
