import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  ApiError,
  notFoundHandler,
  errorHandler,
} from '../../src/middleware/errorHandler.js';

/** Minimal Express `res` double that records status + json. */
const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('middleware/errorHandler · ApiError', () => {
  it('carries a status, message and optional details', () => {
    const err = new ApiError(403, 'Forbidden', [{ field: 'x', message: 'nope' }]);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(403);
    expect(err.message).toBe('Forbidden');
    expect(err.details).toEqual([{ field: 'x', message: 'nope' }]);
  });
});

describe('middleware/errorHandler · notFoundHandler', () => {
  it('responds 404 with the method and original url', () => {
    const res = mockRes();
    notFoundHandler({ method: 'GET', originalUrl: '/api/nope' }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Route GET /api/nope not found' });
  });
});

describe('middleware/errorHandler · errorHandler', () => {
  let consoleError;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
  });

  it('honours an explicit ApiError status and message', () => {
    const res = mockRes();
    errorHandler(new ApiError(401, 'Authentication required'), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
  });

  it('maps a Mongoose ValidationError to 400 with field errors', () => {
    const res = mockRes();
    const err = new Error('validation');
    err.name = 'ValidationError';
    err.errors = {
      name: { path: 'name', message: 'Name is required' },
      email: { path: 'email', message: 'Email is required' },
    };

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      errors: [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Email is required' },
      ],
    });
  });

  it('maps a CastError to 400', () => {
    const res = mockRes();
    const err = new Error('cast');
    err.name = 'CastError';
    err.path = '_id';

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid value for "_id"' });
  });

  it('maps a Mongo duplicate-key error (11000) to 409', () => {
    const res = mockRes();
    const err = new Error('dup');
    err.code = 11000;
    err.keyValue = { email: 'a@b.com' };

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'email already exists',
      errors: [{ field: 'email', message: 'email already exists' }],
    });
  });

  it('hides internals for unexpected 500s outside development', () => {
    const res = mockRes();
    // NODE_ENV is 'test' (see tests/setup.js), so the message must be generic.
    errorHandler(new Error('boom: secret stack'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = res.json.mock.calls[0][0];
    expect(payload.message).toBe('Internal server error');
    expect(payload.stack).toBeUndefined();
    expect(payload.errors).toBeUndefined();
  });

  it('adds a stack trace for 500s while in development', () => {
    const res = mockRes();
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      errorHandler(new Error('dev boom'), {}, res, jest.fn());
      const payload = res.json.mock.calls[0][0];
      expect(payload.stack).toBeDefined();
    } finally {
      process.env.NODE_ENV = original;
    }
  });
});
