import { redis } from "../config/redis.js";
import { env } from "../config/env.js";

export class RateLimiterService {
  /**
   * Checks and reserves a sending slot for a sender.
   * Returns an object indicating if it's allowed or if it needs to be delayed.
   */
  async checkRateLimit(senderId: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    const hourBucket = new Date().toISOString().substring(0, 13); // format: YYYY-MM-DDTHH
    const key = `ratelimit:${senderId}:${hourBucket}`;

    const currentCount = await redis.incr(key);
    
    // Set 2 hours expiry on first increment so it auto-expires
    if (currentCount === 1) {
      await redis.expire(key, 2 * 60 * 60);
    }

    if (currentCount > env.maxEmailsPerHourPerSender) {
      // Calculate delay until the start of the next hour
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      const retryAfterMs = Math.max(nextHour.getTime() - Date.now(), 1000);

      return {
        allowed: false,
        retryAfterMs
      };
    }

    return { allowed: true };
  }
}
