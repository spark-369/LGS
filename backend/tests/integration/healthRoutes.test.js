import { describe, it, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import healthRoutes from '../../src/routes/health.js';

const app = express();
app.use('/api/health', healthRoutes);

describe('routes/health', () => {
  it('GET /health reports ok with uptime and timestamp', async () => {
    const res = await request(app).get('/api/health/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toMatch(/^\d+h \d+m \d+s$/);
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });

  it('GET /meta advertises the API contract', async () => {
    const res = await request(app).get('/api/health/meta');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('logic-gate-simulator-api');
    expect(res.body.endpoints.circuits).toEqual(
      expect.arrayContaining(['GET /api/circuits', 'POST /api/circuits/:id/simulate'])
    );
    expect(res.body.circuitQuery).toEqual(
      expect.arrayContaining(['page', 'limit', 'search', 'isPublic', 'sort'])
    );
  });
});
