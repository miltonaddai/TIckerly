/** In-process fixed-window rate limiter (no external store). */
const hits = new Map<string, { count: number; reset: number }>();

export async function consumeRateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  current.count += 1;
  return { ok: current.count <= limit, remaining: Math.max(0, limit - current.count) };
}
