# Outbox - Scalable Email Scheduling & Dispatch System

Welcome to **Outbox**, a production-ready, full-stack email scheduling and dispatch engine built to simulate real-world email infrastructure. Outbox is designed to handle persistent queues, sliding-window rate limiting, provider throttling, and fault tolerance with automatic retries. Whether you're sending a single email or managing multi-recipient campaigns, Outbox guarantees idempotency, supports attachments, and provides a modern Next.js dashboard to manage it all smoothly.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
   - [How Scheduling Works (Zero Cron)](#1-how-scheduling-works-zero-cron)
   - [Handling Persistence on Restart](#2-handling-persistence-on-restart)
   - [Rate Limiting & Concurrency](#3-rate-limiting--concurrency)
2. [Project Structure](#project-structure)
3. [Features Implemented](#features-implemented)
   - [Backend Features](#backend-features)
   - [Frontend Features](#frontend-features)
4. [Setup & Local Development](#setup--local-development)
   - [Prerequisites](#prerequisites)
5. [Deployment Details](#deployment-details)

---

## Architecture Overview

Our architecture separates the frontend client from a robust backend queueing system.

```text
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
                      │   State Sync)   │   │  (Sliding Window) │
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

We intentionally designed the system **without** relying on OS-level cron jobs (`crontab`) or Node cron libraries (like `node-cron` or `agenda`). Here’s how we manage time:

- **BullMQ Delayed Jobs:** When an email campaign is scheduled for a target timestamp `T`:
  1. We calculate the delay as `delayMs = Math.max(0, new Date(targetTime).getTime() - Date.now())`.
  2. For staggered sending or multiple recipients, each successive job adds an incremental throttling delay: `jobDelay = delayMs + (index * (delaySeconds * 1000))`.
  3. Jobs are queued in bulk via `emailQueue.addBulk(jobsToQueue)`.
  4. Redis stores the delayed jobs in a sorted set (`ZSET`) keyed by their execution timestamp. When `targetTime` arrives, Redis automatically promotes the job from `delayed` to `wait` status so the BullMQ worker can consume it.

---

### 2. Handling Persistence on Restart

System crashes and restarts shouldn't mean lost emails. We ensure persistence through a dual-state approach:

- **Redis Queue State:** BullMQ maintains its delayed and waiting job states inside persistent Redis storage. This means any server restart or deployment won't lose future scheduled jobs. The worker automatically picks up pending jobs as soon as it reconnects.
- **Dual-State Idempotency via PostgreSQL:**
  - Before an email is scheduled, an `email_jobs` row is created with `status = 'scheduled'` and a unique `idempotency_key`.
  - When the worker receives a job, its very first step is to check PostgreSQL:
    ```sql
    SELECT status FROM email_jobs WHERE id = $1
    ```
  - If the status is already `'sent'`, the worker immediately returns without resending.
  - If a worker crashes mid-send or after sending (before acknowledging BullMQ), the retry process sees the updated status in PostgreSQL, preventing duplicate delivery.

---

### 3. Rate Limiting & Concurrency

To mimic real-world provider constraints and protect our sender reputation, we implemented strict limits:

- **Configurable Worker Concurrency:** We can configure how many jobs BullMQ processes in parallel across threads without blocking the event loop (e.g., `WORKER_CONCURRENCY=5`).
- **Provider Throttling (Inter-Email Delay):** We enforce a minimum delay between individual email sends (e.g., `MIN_SEND_DELAY_MS=2000`) to prevent IP reputation degradation.
- **Sliding-Window Hourly Rate Limiting:**
  - Configured via `MAX_EMAILS_PER_HOUR_PER_SENDER` (e.g., `200` emails/hour).
  - Managed by a `RateLimiterService` using Redis atomic counters with auto-expiring TTLs.
  - **Graceful Overflow Handling:** Instead of dropping or failing jobs when limits are exceeded, the worker calculates the exact milliseconds until the top of the next hour window, shifts the job back to the delayed queue, and automatically reschedules it while preserving order.

---

## 🗂 Project Structure

Here is a high-level map of our frontend and backend folder structures:

### Frontend
```text
frontend
+-- src
|   +-- app
|   |   +-- auth
|   |   +-- dashboard
|   |   |   +-- compose
|   |   |   +-- draft
|   |   |   +-- email
|   |   |   +-- Scheduled
|   |   |   \-- sent
|   |   +-- layout.tsx
|   |   \-- page.tsx
|   +-- components
|   |   +-- icons
|   |   +-- layout
|   |   +-- providers
|   |   \-- ui
|   +-- lib
|   |   +-- api.ts
|   |   +-- supabase.ts
|   |   \-- utils.ts
|   +-- styles
|   |   +-- globals.css
|   |   \-- layout-utilities.css
|   \-- types
+-- package.json
+-- next.config.ts
\-- tsconfig.json
```

### Backend
```text
backend
+-- src
|   +-- config
|   |   +-- database.ts
|   |   +-- env.ts
|   |   +-- redis.ts
|   |   +-- s3.ts
|   |   \-- supabase.ts
|   +-- controllers
|   |   \-- email.controller.ts
|   +-- db
|   |   \-- migrations
|   |       +-- 001_init.sql
|   |       +-- 002_drafts_and_attachments.sql
|   |       \-- 003_s3_attachments.sql
|   +-- middleware
|   |   +-- auth.middleware.ts
|   |   \-- error-handler.ts
|   +-- queues
|   |   \-- email.queue.ts
|   +-- routes
|   |   +-- email.routes.ts
|   |   +-- health.routes.ts
|   |   \-- metrics.routes.ts
|   +-- services
|   |   +-- email-scheduler.service.ts
|   |   +-- email-sender.service.ts
|   |   \-- rate-limiter.service.ts
|   +-- utils
|   +-- workers
|   |   \-- email.worker.ts
|   +-- app.ts
|   \-- server.ts
+-- package.json
\-- tsconfig.json
```

---

## Features Implemented

### Backend Features
| Category | Implementation Details |
| :--- | :--- |
| **Scheduler Engine** | BullMQ + Redis delayed queue. Zero reliance on `cron` or `node-cron`. Supports multi-recipient campaigns. |
| **Persistence** | PostgreSQL + Redis state machine. Survives process crashes and restarts without re-sending old emails. |
| **Rate Limiter** | Redis-backed sliding-window hourly limiter per sender with automatic `moveToDelayed` rescheduling on overflow. |
| **Concurrency & Throttling** | Multi-worker parallel processing with configurable worker concurrency and inter-email delay. |
| **Fault Tolerance & Retries** | Configurable exponential backoff retry mechanism (default 3 attempts). Status updates tracked in DB. |
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

## Setup & Local Development

### Prerequisites
- **Node.js** (v18.x or higher)
- **PostgreSQL** instance
- **Redis** instance (v6+)
- **Supabase Account** (for Auth & S3 storage)

Detailed setup instructions, environment variable configurations, and running commands have been fully modularized for clarity. 

Please refer to our respective documentation files for step-by-step guidance:
- **[Backend Setup Guide](./backend/README.md)**: Instructions for configuring PostgreSQL, Redis, Ethereal Email, running migrations, and starting the API/Worker.
- **[Frontend Setup Guide](./frontend/README.md)**: Instructions for configuring Supabase Auth, setting up Next.js environment variables, and starting the dashboard.

---

## Deployment Details

| Component | Platform | URL |
| :--- | :--- | :--- |
| **Frontend** | Vercel | [https://frontend-eta-opal-86.vercel.app](https://frontend-eta-opal-86.vercel.app) |
| **Backend API + Worker** | Railway | [https://backend-combined-production.up.railway.app](https://backend-combined-production.up.railway.app) |
| **PostgreSQL & Redis** | Railway | Private internal network mesh |
| **Authentication & Storage** | Supabase | Auth OAuth + S3-compatible bucket |
