import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { makeQuery } from '../helpers/mockQuery.js';

// ---------------------------------------------------------------------------
// Mock the User model so the auth routes are exercised end-to-end (routing,
// validation, controller, error handler) without a MongoDB connection.
// ---------------------------------------------------------------------------
const findOne = jest.fn();
const create = jest.fn();
const findById = jest.fn();

jest.unstable_mockModule('../../src/models/User.js', () => ({
  User: { findOne, create, findById },
}));

const { default: authRoutes } = await import('../../src/routes/auth.js');
const { notFoundHandler, errorHandler } = await import('../../src/middleware/errorHandler.js');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

const fakeUser = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  email: 'ada@example.com',
  name: 'Ada',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('routes/auth · POST /register', () => {
  it('creates a user and returns a token + public user shape', async () => {
    findOne.mockResolvedValueOnce(null); // no existing email
    create.mockResolvedValueOnce(fakeUser());

    const res = await request(buildApp())
      .post('/api/auth/register')
      .send({ email: 'ada@example.com', password: 'secret123', name: 'Ada' });

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ email: 'ada@example.com', name: 'Ada' });
    expect(res.body.user.password).toBeUndefined();
  });

  it('returns 409 when the email is already registered', async () => {
    findOne.mockResolvedValueOnce(fakeUser());

    const res = await request(buildApp())
      .post('/api/auth/register')
      .send({ email: 'ada@example.com', password: 'secret123', name: 'Ada' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email already registered');
  });

  it('returns 400 for an invalid payload (before hitting the model)', async () => {
    const res = await request(buildApp())
      .post('/api/auth/register')
      .send({ email: 'bad', password: '1', name: 'A' });

    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});

describe('routes/auth · POST /login', () => {
  it('returns a token for valid credentials', async () => {
    const user = fakeUser();
    user.comparePassword = jest.fn(async () => true);
    findOne.mockReturnValueOnce(makeQuery(user));

    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.email).toBe('ada@example.com');
  });

  it('returns 401 for a wrong password (same message as unknown email)', async () => {
    const user = fakeUser();
    user.comparePassword = jest.fn(async () => false);
    findOne.mockReturnValueOnce(makeQuery(user));

    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns 401 for an unknown email', async () => {
    findOne.mockReturnValueOnce(makeQuery(null));

    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'secret123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});

describe('routes/auth · GET /me', () => {
  it('rejects an anonymous request with 401', async () => {
    const res = await request(buildApp()).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    findById.mockResolvedValueOnce(fakeUser());

    const res = await request(buildApp())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenFor('507f1f77bcf86cd799439011')}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('ada@example.com');
  });
});

describe('routes/auth · POST /refresh', () => {
  it('issues a fresh token for an authenticated user', async () => {
    findById.mockResolvedValueOnce(fakeUser());

    const res = await request(buildApp())
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${tokenFor('507f1f77bcf86cd799439011')}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });
});
