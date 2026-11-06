import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { rateLimit } from '../../src/middleware/rateLimit.js';

const mockReq = (overrides = {}) => ({
  ip: '127.0.0.1',
  method: 'POST',
  baseUrl: '/api/auth',
  path: '/login',
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.headers = {};
  res.setHeader = jest.fn((key, value) => {
    res.headers[key] = value;
    return res;
  });
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('middleware/rateLimit', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows requests up to the limit and emits rate-limit headers', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 3 });
    const req = mockReq();

    const first = mockRes();
    const next1 = jest.fn();
    limiter(req, first, next1);

    expect(next1).toHaveBeenCalledTimes(1);
    expect(first.headers['X-RateLimit-Limit']).toBe('3');
    expect(first.headers['X-RateLimit-Remaining']).toBe('2');

    const second = mockRes();
    const next2 = jest.fn();
    limiter(req, second, next2);
    expect(next2).toHaveBeenCalledTimes(1);
    expect(second.headers['X-RateLimit-Remaining']).toBe('1');
  });

  it('rejects the request that exceeds the limit with 429 + Retry-After', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2, message: 'Slow down' });
    const req = mockReq();

    limiter(req, mockRes(), jest.fn()); // 1
    limiter(req, mockRes(), jest.fn()); // 2 (limit)

    const blocked = mockRes();
    const next = jest.fn();
    limiter(req, blocked, next); // over the limit

    expect(next).not.toHaveBeenCalled();
    expect(blocked.status).toHaveBeenCalledWith(429);
    expect(blocked.json).toHaveBeenCalledWith({ message: 'Slow down' });
    expect(blocked.headers['X-RateLimit-Remaining']).toBe('0');
    expect(Number(blocked.headers['Retry-After'])).toBeGreaterThan(0);
  });

  it('counts each ip + route independently', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1 });

    limiter(mockReq({ ip: '1.1.1.1' }), mockRes(), jest.fn());
    // different ip is unaffected
    const otherIp = mockRes();
    const nextOtherIp = jest.fn();
    limiter(mockReq({ ip: '2.2.2.2' }), otherIp, nextOtherIp);
    expect(nextOtherIp).toHaveBeenCalledTimes(1);

    // same ip, different route is unaffected
    const otherRoute = mockRes();
    const nextOtherRoute = jest.fn();
    limiter(mockReq({ ip: '1.1.1.1', path: '/register' }), otherRoute, nextOtherRoute);
    expect(nextOtherRoute).toHaveBeenCalledTimes(1);
  });

  it('supports a custom keyGenerator (e.g. per user)', () => {
    const limiter = rateLimit({
      windowMs: 60_000,
      max: 1,
      keyGenerator: (req) => req.user?.id || req.ip,
    });

    limiter({ ...mockReq(), user: { id: 'user-a' } }, mockRes(), jest.fn());
    const sameUser = mockRes();
    const next = jest.fn();
    limiter({ ...mockReq(), user: { id: 'user-a' } }, sameUser, next);
    expect(next).not.toHaveBeenCalled(); // same key -> blocked
    expect(sameUser.status).toHaveBeenCalledWith(429);
  });

  it('resets the bucket once the window elapses', () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);

    const limiter = rateLimit({ windowMs: 1_000, max: 1 });
    const req = mockReq();

    limiter(req, mockRes(), jest.fn()); // fills the window

    const blocked = mockRes();
    limiter(req, blocked, jest.fn());
    expect(blocked.status).toHaveBeenCalledWith(429);

    // Move past the window — the counter must start fresh.
    jest.setSystemTime(2_000);
    const afterReset = mockRes();
    const next = jest.fn();
    limiter(req, afterReset, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
