-- Alter the email_attachments table to drop file_data and add s3_key
ALTER TABLE email_attachments DROP COLUMN IF EXISTS file_data;
ALTER TABLE email_attachments ADD COLUMN IF NOT EXISTS s3_key TEXT;
