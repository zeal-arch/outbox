import pg from "pg";
import { env } from "./env.js";
import fs from "fs/promises";
import path from "path";

export const db = new pg.Pool({
  connectionString: env.databaseUrl
});

export async function initDatabase() {
  const client = await db.connect();
  try {
    const migrationPath1 = path.join(process.cwd(), "src", "db", "migrations", "001_init.sql");
    const sql1 = await fs.readFile(migrationPath1, "utf-8");
    await client.query(sql1);
    
    const migrationPath2 = path.join(process.cwd(), "src", "db", "migrations", "002_drafts_and_attachments.sql");
    const sql2 = await fs.readFile(migrationPath2, "utf-8");
    await client.query(sql2);
    
    const migrationPath3 = path.join(process.cwd(), "src", "db", "migrations", "003_s3_attachments.sql");
    const sql3 = await fs.readFile(migrationPath3, "utf-8");
    await client.query(sql3);
    
    console.log("[DB] Migrations executed successfully.");
  } catch (err) {
    console.error("[DB] Failed to run migrations:", err);
    throw err;
  } finally {
    client.release();
  }
}
