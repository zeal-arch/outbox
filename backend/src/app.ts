import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { emailRouter } from "./routes/email.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { metricsRouter } from "./routes/metrics.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.frontendUrl, credentials: true }));
  app.use(express.json({ limit: "2mb" }));

  app.use("/api/auth", authRouter);
  app.use("/api/emails", emailRouter);
  app.use("/health", healthRouter);
  app.use("/metrics", metricsRouter);

  app.use(errorHandler);

  return app;
}
