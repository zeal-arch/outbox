<div align="center">
  <h1>Outbox - Email Scheduling Engine</h1>
  <p>A full-stack email scheduling and dispatch engine built to simulate real-world email infrastructure.</p>
</div>

Welcome to the Outbox repository!

This project is a monorepo containing a high-throughput, fault-tolerant email background scheduler and a modern frontend dashboard.

## 📚 Documentation Directory

Please refer to the detailed documentation for each part of the system:

- **[Main System Architecture & Requirements](../README.md)**: Full architecture breakdown, rate limiting implementation, zero-cron scheduling logic, and deployment instructions.
- **[Backend API & Worker Engine](../backend/README.md)**: Details on BullMQ, Redis Sliding Window Rate Limiter, Nodemailer, and PostgreSQL idempotency checks.
- **[Frontend Dashboard](../frontend/README.md)**: Details on the Next.js App Router, Supabase Google OAuth integration, and the Compose UI.
