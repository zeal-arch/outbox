import pg from "pg";

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const result = await pool.query("SELECT id, recipient_email, status, last_error FROM email_jobs ORDER BY created_at DESC LIMIT 5");
  console.log(result.rows);
  await pool.end();
}

run().catch(console.error);
