/**
 * Lazy Redis client (rate limiting + preview cache). Kept optional: if REDIS_URL
 * is unset or the server is down, callers degrade gracefully rather than fail.
 */
import Redis from "ioredis";

let client: Redis | null = null;

export function redis(): Redis | null {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  client = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: false,
    // Don't spam reconnect logs; a down Redis is a soft failure here.
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
  });
  client.on("error", () => {
    /* swallow — availability is checked per call */
  });
  return client;
}
