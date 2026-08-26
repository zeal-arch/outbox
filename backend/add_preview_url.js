import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("ALTER TABLE email_jobs ADD COLUMN IF NOT EXISTS preview_url TEXT;")
  .then(() => { console.log('success'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
