CREATE TABLE IF NOT EXISTS senders (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_jobs (
  id UUID PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES senders(id),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  bull_job_id TEXT UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_jobs_status_scheduled_at_idx
  ON email_jobs (status, scheduled_at);

CREATE INDEX IF NOT EXISTS email_jobs_sender_scheduled_at_idx
  ON email_jobs (sender_id, scheduled_at);
