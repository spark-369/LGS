// ---------------------------------------------------------------------------
// Dependency-free fixed-window rate limiter.
//
// Kept in-process on purpose: the app ships as a single container, and this
// avoids pulling an extra package into the production image. Buckets expire on
// a background sweep so memory cannot grow without bound.
// ---------------------------------------------------------------------------

const SWEEP_INTERVAL_MS = 60_000;

/**
 * @param {object} [options]
 * @param {number} [options.windowMs]  Window length in ms.
 * @param {number} [options.max]       Allowed requests per window per key.
 * @param {string} [options.message]   Body message when the limit is hit.
 * @param {(req: import('express').Request) => string} [options.keyGenerator]
 */
export const rateLimit = ({
  windowMs = 60_000,
  max = 120,
  message = 'Too many requests, please try again later.',
  keyGenerator,
} = {}) => {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const buckets = new Map();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(key);
    }
  }, SWEEP_INTERVAL_MS);
  // Never keep the process alive just for cleanup.
  if (typeof sweep.unref === 'function') sweep.unref();

  return (req, res, next) => {
    const now = Date.now();
    const identity = keyGenerator ? keyGenerator(req) : req.ip;
    const key = `${identity}:${req.method}:${req.baseUrl}${req.path}`;

    const entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(max - 1));
      return next();
    }

    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ message });
    }

    return next();
  };
};
