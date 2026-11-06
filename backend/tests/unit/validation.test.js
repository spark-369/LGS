import { describe, it, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import {
  circuitQuerySchema,
  validateRegister,
  validateLogin,
  validateCircuit,
  validateObjectId,
  validateCircuitQuery,
} from '../../src/middleware/validation.js';

// ---------------------------------------------------------------------------
// The express-validator chains are exercised through a throwaway Express app so
// the real chain semantics (trim, coercions, error formatting) are covered.
// ---------------------------------------------------------------------------
const appWith = (chain) => {
  const app = express();
  app.use(express.json());
  app.post('/probe/:id?', chain, (req, res) =>
    res.json({ ok: true, body: req.body, query: req.query })
  );
  return app;
};

describe('middleware/validation · circuitQuerySchema (zod)', () => {
  it('applies documented defaults', () => {
    const parsed = circuitQuerySchema.parse({});
    expect(parsed).toEqual({ page: 1, limit: 12, sort: 'recent' });
  });

  it('coerces numeric strings', () => {
    const parsed = circuitQuerySchema.parse({ page: '3', limit: '20' });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(20);
  });

  it('rejects limit above the hard ceiling', () => {
    expect(circuitQuerySchema.safeParse({ limit: 51 }).success).toBe(false);
  });

  it('rejects a non-positive page', () => {
    expect(circuitQuerySchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it('rejects an unsupported sort option', () => {
    expect(circuitQuerySchema.safeParse({ sort: 'bogus' }).success).toBe(false);
  });

  it('accepts a valid isPublic enum and search string', () => {
    const parsed = circuitQuerySchema.parse({ isPublic: 'true', search: 'alu' });
    expect(parsed.isPublic).toBe('true');
    expect(parsed.search).toBe('alu');
  });
});

describe('middleware/validation · validateRegister', () => {
  const app = appWith(validateRegister);

  it('accepts a well-formed payload', async () => {
    const res = await request(app)
      .post('/probe')
      .send({ email: 'user@example.com', password: 'secret123', name: 'Ada' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects an invalid email', async () => {
    const res = await request(app)
      .post('/probe')
      .send({ email: 'not-an-email', password: 'secret123', name: 'Ada' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('email');
  });

  it('rejects a short password and name', async () => {
    const res = await request(app)
      .post('/probe')
      .send({ email: 'user@example.com', password: '123', name: 'A' });
    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['password', 'name']));
  });
});

describe('middleware/validation · validateLogin', () => {
  const app = appWith(validateLogin);

  it('requires an email and a non-empty password', async () => {
    const res = await request(app).post('/probe').send({ email: '', password: '' });
    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['email', 'password']));
  });
});

describe('middleware/validation · validateCircuit', () => {
  const app = appWith(validateCircuit);

  const validBody = {
    name: 'Half Adder',
    description: 'XOR + AND',
    isPublic: true,
    nodes: [
      { id: 'n1', type: 'INPUT', position: { x: 0, y: 0 } },
      { id: 'n2', type: 'XOR', position: { x: 100, y: 0 } },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
  };

  it('accepts a valid circuit', async () => {
    const res = await request(app).post('/probe').send(validBody);
    expect(res.status).toBe(200);
  });

  it('rejects a missing/empty name', async () => {
    const res = await request(app).post('/probe').send({ ...validBody, name: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('rejects an unsupported gate type inside nodes', async () => {
    const res = await request(app)
      .post('/probe')
      .send({ ...validBody, nodes: [{ id: 'x', type: 'WAT', position: { x: 0, y: 0 } }] });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'nodes')).toBe(true);
  });

  it('rejects a node without a numeric position', async () => {
    const res = await request(app)
      .post('/probe')
      .send({ ...validBody, nodes: [{ id: 'x', type: 'AND', position: { x: 'nope' } }] });
    expect(res.status).toBe(400);
  });

  it('rejects an edge missing source/target', async () => {
    const res = await request(app)
      .post('/probe')
      .send({ ...validBody, edges: [{ id: 'e1', source: 'n1' }] });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'edges')).toBe(true);
  });
});

describe('middleware/validation · validateObjectId', () => {
  const app = appWith(validateObjectId);

  it('accepts a valid Mongo id', async () => {
    const res = await request(app).post('/probe/507f1f77bcf86cd799439011').send({});
    expect(res.status).toBe(200);
  });

  it('rejects a malformed id', async () => {
    const res = await request(app).post('/probe/not-an-id').send({});
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('id');
  });
});

describe('middleware/validation · validateCircuitQuery', () => {
  const appWithQuery = () => {
    const app = express();
    app.get('/list', validateCircuitQuery, (req, res) => res.json({ ok: true, query: req.query }));
    return app;
  };

  it('accepts a valid query string', async () => {
    const res = await request(appWithQuery()).get('/list?page=2&limit=10&sort=name');
    expect(res.status).toBe(200);
    expect(res.body.query.page).toBe('2');
  });

  it('rejects an out-of-range limit', async () => {
    const res = await request(appWithQuery()).get('/list?limit=999');
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('limit');
  });

  it('rejects a bad sort and non-boolean isPublic', async () => {
    const res = await request(appWithQuery()).get('/list?sort=size&isPublic=maybe');
    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['sort', 'isPublic']));
  });
});
