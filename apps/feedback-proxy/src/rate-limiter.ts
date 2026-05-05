import { createStorage } from "unstorage";
import cloudflareKVBindingDriver from "unstorage/drivers/cloudflare-kv-binding";
import type { KVNamespace } from "@cloudflare/workers-types";

const hourlyLimit = 5;
const dailyLimit = 20;

/**
 * Creates a rate limiter backed by Cloudflare KV via unstorage.
 *
 * Count may over-count by 1-2 under concurrent load due to non-atomic get+put.
 */
export function createRateLimiter(kv: KVNamespace) {
  const storage = createStorage({
    driver: cloudflareKVBindingDriver({ binding: kv, base: "rl", minTTL: 60 }),
  });

  function normalizeIp(ip: string): string {
    // Strip ::ffff: prefix for IPv4-mapped IPv6 addresses
    if (ip.startsWith("::ffff:")) {
      return ip.slice(7);
    }
    return ip;
  }

  async function getCount(key: string): Promise<number> {
    const val = await storage.getItem<number>(key);
    return val ?? 0;
  }

  async function setCount(key: string, count: number, ttlSeconds: number): Promise<void> {
    // TTL must be >= 60 seconds for KV
    await storage.setItem(key, count, { ttl: Math.max(ttlSeconds, 60) });
  }

  return {
    async check(
      ip: string,
    ): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
      const normalizedIp = normalizeIp(ip);
      const now = Date.now();

      // Check hourly limit
      const hourKey = `hour:${normalizedIp}`;
      const hourCount = await getCount(hourKey);

      if (hourCount >= hourlyLimit) {
        // Estimate retry-after from TTL remaining
        // Since we don't store reset time, we approximate as 1 hour from now
        return { allowed: false, retryAfterSeconds: 3600 };
      }

      // Check daily limit
      const dayKey = `day:${normalizedIp}`;
      const dayCount = await getCount(dayKey);

      if (dayCount >= dailyLimit) {
        return { allowed: false, retryAfterSeconds: 86400 };
      }

      // Increment counters
      try {
        // Use get + set (non-atomic - accepted trade-off per plan)
        await setCount(hourKey, hourCount + 1, 3600);
        await setCount(dayKey, dayCount + 1, 86400);
      } catch {
        // Fail closed: if KV write fails, reject the request
        console.error("[rate-limiter] KV write failed, rejecting request");
        return { allowed: false, retryAfterSeconds: 60 };
      }

      return { allowed: true };
    },
  };
}
