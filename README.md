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

Detailed setup instructions, environment variable configurations, and running commands have been fully modularized for clarity. 

Please refer to the respective documentation files:

- **[Backend Setup Guide](./backend/README.md)**: Instructions for configuring PostgreSQL, Redis, Ethereal Email, running migrations, and starting the API/Worker.
- **[Frontend Setup Guide](./frontend/README.md)**: Instructions for configuring Supabase Auth, setting up Next.js environment variables, and starting the dashboard.

---

## 🌐 Deployment Details

| Component | Platform | URL |
| :--- | :--- | :--- |
| **Frontend** | Vercel | [https://frontend-eta-opal-86.vercel.app](https://frontend-eta-opal-86.vercel.app) |
| **Backend API + Worker** | Railway | [https://backend-combined-production.up.railway.app](https://backend-combined-production.up.railway.app) |
| **PostgreSQL & Redis** | Railway | Private internal network mesh |
| **Authentication & Storage** | Supabase | Auth OAuth + S3-compatible bucket |
