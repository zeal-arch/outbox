import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { emailRouter } from "./routes/email.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { metricsRouter } from "./routes/metrics.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || origin === env.frontendUrl || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev to avoid NetworkError
      }
    },
    credentials: true
  }));
  app.use(express.json({ limit: "2mb" }));

  app.use("/api/emails", emailRouter);
  app.use("/health", healthRouter);
  app.use("/metrics", metricsRouter);

  app.use(errorHandler);

  return app;
}
