import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("ALTER TABLE email_jobs ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT false;")
  .then(() => { console.log('success'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
