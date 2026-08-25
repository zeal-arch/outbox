import { Router } from "express";

export const metricsRouter = Router();

metricsRouter.get("/", (_req, res) => {
  res.json({
    uptimeSeconds: process.uptime(),
    memory: process.memoryUsage()
  });
});
