Technical Implementation Details and Design Decisions

This document outlines the core architectural choices, trade-offs, and implementation details behind the Outbox Scheduling Engine. It serves as a technical companion to explain why specific choices were made.

1. Scheduling Engine and Why BullMQ Was Chosen

When building a scheduling system, the simplest approach is often node-cron or native timeouts. However, these are strictly in-memory solutions. If the Node server crashes or a deployment occurs while a timeout is pending, the scheduled email is permanently lost. Furthermore, cron does not scale horizontally; if you spin up a second server, both servers will attempt to send the same email simultaneously.

By using BullMQ backed by Redis, scheduling becomes completely detached from the Node process. Jobs are stored in a Redis Sorted Set scored by their scheduled execution time. If the server crashes, the delayed jobs remain safely in Redis. When the server restarts, BullMQ instantly resumes polling and dispatches the jobs that missed their window. Multiple workers can connect to the same Redis queue, and BullMQ uses atomic Lua scripts to guarantee that a job is only popped by a single worker, preventing duplicate emails.

2. Idempotency and PostgreSQL as the Source of Truth

While Redis is excellent for fast queue operations, it is not a durable relational database. Every email is first persisted to PostgreSQL with a unique idempotency key before it is ever sent to Redis. 

When a worker picks up a job from Redis, it queries PostgreSQL to verify the job status. If the status is already marked as sent or failed, the worker instantly drops the job. This dual-layer architecture ensures that even in edge cases where a network partition causes BullMQ to retry a completed job, the PostgreSQL state prevents the email from being sent twice.

3. Handling API Rate Limits and Load

Email providers strictly throttle outbound traffic. To prevent getting banned, the system incorporates two mechanisms. First, we use a Sliding-Window Rate Limiter. We use Redis atomic counters to track how many emails a specific sender has dispatched in the last hour. If the limit is exceeded, the worker intercepts the job, calculates the time until the window resets, and explicitly pushes the job back into the queue for later. No emails are dropped. 

Second, the worker enforces a strict configurable delay between processing jobs. This smooths out bursts of traffic into a steady, predictable stream.

4. Infrastructure and Containerization

A standard approach for a microservices stack is to orchestrate it locally using docker-compose. Due to local hardware constraints on an 8GB machine, running five separate Docker containers caused severe OS-level memory swapping and CPU bottlenecking. This made local development unbearably slow.

Instead of forcing local containerization, the architecture was explicitly designed to be Cloud-Native. PostgreSQL and Redis were immediately provisioned on Railway. The Express API and BullMQ worker were deployed to Railway, acting as true remote microservices. Next.js was deployed to Vercel. This approach forced the implementation to properly handle network latency, CORS, and remote database connections from day one, proving the system robustness in a real distributed environment.

5. Future Improvements

If given additional time beyond the scope of this assignment, I would implement unit testing to mock the Redis connections and test the rate-limiting logic. I would also implement a WebSocket server to push status updates from the BullMQ worker directly to the Next.js frontend, eliminating the need to manually refresh the dashboard. Finally, I would integrate a visual admin dashboard for inspecting failed jobs and manually retrying emails that failed due to permanent hard-bounces.
