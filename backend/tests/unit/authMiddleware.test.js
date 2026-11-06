import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mock the User model BEFORE importing the middleware under test so the
// database is never touched.
jest.unstable_mockModule('../../src/models/User.js', () => ({
  User: { findById: jest.fn() },
}));

const { authenticate, optionalAuth } = await import('../../src/middleware/auth.js');
const { User } = await import('../../src/models/User.js');

const mockReq = (headers = {}) => ({ headers });
const mockRes = () => ({});
const signToken = (payload = { id: 'user-1' }) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('middleware/auth · authenticate', () => {
  it('rejects when no bearer token is present', async () => {
    const next = jest.fn();
    await authenticate(mockReq(), mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(401);
    expect(err.message).toBe('Authentication required');
  });

  it('rejects a non-Bearer authorization header', async () => {
    const next = jest.fn();
    await authenticate(mockReq({ authorization: 'Basic abc123' }), mockRes(), next);
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const next = jest.fn();
    await authenticate(mockReq({ authorization: 'Bearer not.a.jwt' }), mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(401);
    expect(err.message).toBe('Invalid or expired token');
  });

  it('rejects when the token user no longer exists', async () => {
    User.findById.mockResolvedValueOnce(null);
    const next = jest.fn();
    await authenticate(
      mockReq({ authorization: `Bearer ${signToken()}` }),
      mockRes(),
      next
    );
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(401);
    expect(err.message).toBe('User no longer exists');
  });

  it('attaches req.user and calls next() with no error on success', async () => {
    const userDoc = { _id: 'user-1', email: 'a@b.com' };
    User.findById.mockResolvedValueOnce(userDoc);

    const req = mockReq({ authorization: `Bearer ${signToken({ id: 'user-1' })}` });
    const next = jest.fn();
    await authenticate(req, mockRes(), next);

    expect(User.findById).toHaveBeenCalledWith('user-1');
    expect(req.user).toBe(userDoc);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('middleware/auth · optionalAuth', () => {
  it('continues without a user when no token is present', async () => {
    const req = mockReq();
    const next = jest.fn();
    await optionalAuth(req, mockRes(), next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('attaches the user for a valid token', async () => {
    const userDoc = { _id: 'user-1' };
    User.findById.mockResolvedValueOnce(userDoc);
    const req = mockReq({ authorization: `Bearer ${signToken({ id: 'user-1' })}` });
    const next = jest.fn();
    await optionalAuth(req, mockRes(), next);
    expect(req.user).toBe(userDoc);
    expect(next).toHaveBeenCalledWith();
  });

  it('never rejects, even for an invalid token', async () => {
    const req = mockReq({ authorization: 'Bearer nope' });
    const next = jest.fn();
    await optionalAuth(req, mockRes(), next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('treats a missing user as anonymous', async () => {
    User.findById.mockResolvedValueOnce(null);
    const req = mockReq({ authorization: `Bearer ${signToken()}` });
    const next = jest.fn();
    await optionalAuth(req, mockRes(), next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});
