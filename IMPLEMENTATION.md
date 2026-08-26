# Technical Implementation Details & Design Decisions

This document outlines the core architectural choices, trade-offs, and implementation details behind the Outbox Scheduling Engine. It serves as a technical companion to the main `README.md` to explain *why* specific choices were made.

---

## 1. Scheduling Engine: Why BullMQ?

When building a scheduling system, the simplest approach is often `node-cron` or JavaScript's native `setTimeout`. However, these are strictly in-memory solutions. 

**The Problem with `cron`:**
If the Node.js server crashes or a deployment occurs while a timeout is pending, the scheduled email is permanently lost. Furthermore, `cron` does not scale horizontally; if you spin up a second server, both servers will attempt to send the same email simultaneously.

**The BullMQ Solution:**
By using BullMQ backed by Redis, scheduling becomes completely detached from the Node process.
- **Persistence:** Jobs are stored in a Redis Sorted Set (ZSET) scored by their scheduled execution time.
- **Fault Tolerance:** If the server crashes, the delayed jobs remain safely in Redis. When the server restarts, BullMQ instantly resumes polling and dispatches the jobs that missed their window.
- **Concurrency:** Multiple workers can connect to the same Redis queue. BullMQ uses atomic Lua scripts to guarantee that a job is only popped by a single worker, preventing duplicate emails.

## 2. Idempotency: PostgreSQL as the Source of Truth

While Redis is excellent for fast, ephemeral queue operations, it is not a durable relational database. 

**Implementation:**
Every email is first persisted to PostgreSQL (`email_jobs` table) with a unique `idempotency_key` before it is ever sent to Redis. 
When a worker picks up a job from Redis, it queries PostgreSQL to verify the job's status. If the status is already marked as `sent` or `failed`, the worker instantly drops the job. This dual-layer architecture ensures that even in edge cases where a network partition causes BullMQ to retry a completed job, the PostgreSQL state prevents the email from being sent twice.

## 3. Handling API Rate Limits & Load

Email providers strictly throttle outbound traffic. To prevent getting banned, the system incorporates two mechanisms:

1. **Sliding-Window Rate Limiter:** We use Redis atomic counters (`INCR` with an `EXPIRE` window) to track how many emails a specific sender has dispatched in the last hour. If the limit (e.g., 200/hr) is exceeded, the worker intercepts the job, calculates the time until the window resets, and explicitly calls `job.moveToDelayed()` to push the job back into the queue for later. No emails are dropped.
2. **Inter-Email Throttling:** The worker enforces a strict configurable delay (`MIN_SEND_DELAY_MS`) between processing jobs. This smooths out bursts of traffic into a steady, predictable stream.

## 4. Infrastructure & Containerization (Why No Local Docker?)

A standard approach for a microservices stack (Next.js, Express, PostgreSQL, Redis, Worker) is to orchestrate it locally using `docker-compose`. 

**The Trade-off:**
Due to local hardware constraints (a development machine with strictly 8GB of RAM), running five separate Docker containers along with an IDE and a browser caused severe OS-level memory swapping, CPU bottlenecking, and thermal throttling. This made local development unbearably slow.

**The Solution:**
Instead of forcing local containerization, the architecture was explicitly designed to be **Cloud-Native**. 
- **Database & Cache:** PostgreSQL and Redis were immediately provisioned on **Railway**.
- **Backend Services:** The Express API and BullMQ worker were deployed to Railway, acting as true remote microservices.
- **Frontend:** Next.js was deployed to **Vercel**.

This approach actually provides a *more* realistic production environment than local Docker. It forced the implementation to properly handle network latency, CORS, and remote database connections from day one, proving the system's robustness in a real distributed environment.

## 5. Future Improvements

If given additional time beyond the scope of this assignment, I would implement the following improvements:

1. **Unit & Integration Testing:** Introduce `Jest` and `Supertest` to mock the Redis connections and thoroughly test the rate-limiting and idempotency logic.
2. **Real-time UI Updates:** Implement a WebSocket server (using `Socket.io`) or Server-Sent Events (SSE) to push status updates from the BullMQ worker directly to the Next.js frontend, eliminating the need to manually refresh the dashboard.
3. **Dead-Letter Queue Dashboard:** Integrate `@bull-board/express` to provide a visual admin dashboard for inspecting failed jobs and manually retrying emails that failed due to permanent hard-bounces.
