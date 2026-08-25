import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initDatabase } from "./config/database.js";

async function startServer() {
  try {
    await initDatabase();
    
    const app = createApp();

    app.listen(env.port, () => {
      console.log(`Backend listening on port ${env.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
