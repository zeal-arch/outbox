import { Redis } from "ioredis";
import { env } from "./env.js";

// @ts-ignore
export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: null
});
