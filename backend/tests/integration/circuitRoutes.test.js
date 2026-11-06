import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { makeQuery } from '../helpers/mockQuery.js';

// ---------------------------------------------------------------------------
// Mock the Circuit + User models. The circuit routes run behind `authenticate`
// so User.findById must resolve for the requests we want to reach a controller.
// ---------------------------------------------------------------------------
const circuitModel = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  countDocuments: jest.fn(),
};
const userModel = {
  findById: jest.fn(),
};

jest.unstable_mockModule('../../src/models/Circuit.js', () => ({ Circuit: circuitModel }));
jest.unstable_mockModule('../../src/models/User.js', () => ({ User: userModel }));

const { default: circuitRoutes } = await import('../../src/routes/circuits.js');
const { notFoundHandler, errorHandler } = await import('../../src/middleware/errorHandler.js');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/circuits', circuitRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

const OWNER_ID = '507f1f77bcf86cd799439011';
const CIRCUIT_ID = '507f1f77bcf86cd799439022';
const authToken = jwt.sign({ id: OWNER_ID }, process.env.JWT_SECRET, { expiresIn: '1h' });
const asAuth = (req) => req.set('Authorization', `Bearer ${authToken}`);

const storedCircuit = (overrides = {}) => ({
  _id: CIRCUIT_ID,
  name: 'Half Adder',
  description: 'XOR + AND',
  owner: OWNER_ID,
  nodes: [{ id: 'n1', type: 'INPUT', position: { x: 0, y: 0 }, data: {} }],
  edges: [],
  isPublic: false,
  toObject() {
    return { ...this };
  },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  userModel.findById.mockResolvedValue({ _id: OWNER_ID, email: 'ada@example.com' });
});

describe('routes/circuits · authentication', () => {
  it('rejects unauthenticated access to a protected route', async () => {
    const res = await request(buildApp()).get('/api/circuits');
    expect(res.status).toBe(401);
  });
});

describe('routes/circuits · POST / (create)', () => {
  it('creates a sanitised circuit owned by the caller', async () => {
    circuitModel.create.mockResolvedValueOnce(storedCircuit());

    const res = await asAuth(request(buildApp()).post('/api/circuits')).send({
      name: '  Half Adder ',
      nodes: [{ id: 'n1', type: 'INPUT', position: { x: 0, y: 0 }, data: { value: true } }],
      edges: [],
    });

    expect(res.status).toBe(201);
    expect(res.body.circuit.name).toBe('Half Adder'); // trimmed
    expect(res.body.circuit.gateCount).toBe(1);
    expect(res.body.circuit.owner).toBeUndefined(); // owner stripped by presenter

    const payload = circuitModel.create.mock.calls[0][0];
    expect(payload.owner).toBe(OWNER_ID);
    expect(payload.name).toBe('Half Adder'); // trimmed before persistence
    expect(payload.nodes[0].data.value).toBe(true);
  });

  it('rejects a circuit whose wire references an unknown gate (graph integrity)', async () => {
    const res = await asAuth(request(buildApp()).post('/api/circuits')).send({
      name: 'Broken',
      nodes: [{ id: 'n1', type: 'INPUT', position: { x: 0, y: 0 } }],
      edges: [{ id: 'e1', source: 'n1', target: 'ghost' }],
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unknown target gate/);
    expect(circuitModel.create).not.toHaveBeenCalled();
  });

  it('rejects an unsupported gate type', async () => {
    const res = await asAuth(request(buildApp()).post('/api/circuits')).send({
      name: 'Broken',
      nodes: [{ id: 'n1', type: 'WAT', position: { x: 0, y: 0 } }],
      edges: [],
    });
    expect(res.status).toBe(400);
  });
});

describe('routes/circuits · GET / (list)', () => {
  it('scopes results to the owner and returns a pagination envelope', async () => {
    circuitModel.find.mockReturnValueOnce(makeQuery([storedCircuit()]));
    circuitModel.countDocuments.mockResolvedValueOnce(1);

    const res = await asAuth(request(buildApp()).get('/api/circuits?page=1&limit=12'));

    expect(res.status).toBe(200);
    expect(res.body.circuits).toHaveLength(1);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 12, total: 1, pages: 1 });

    expect(circuitModel.find).toHaveBeenCalledWith({ owner: OWNER_ID });
  });

  it('escapes a regex-metacharacter search term before querying', async () => {
    circuitModel.find.mockReturnValueOnce(makeQuery([]));
    circuitModel.countDocuments.mockResolvedValueOnce(0);

    await asAuth(request(buildApp()).get('/api/circuits?search=(a%2B)%2B%24'));

    const filter = circuitModel.find.mock.calls[0][0];
    expect(filter.$or[0].name.$regex).toBe('\\(a\\+\\)\\+\\$');
  });
});

describe('routes/circuits · GET /:id', () => {
  it('returns the circuit and an isOwner flag for the owner', async () => {
    circuitModel.findOne.mockReturnValueOnce(makeQuery(storedCircuit()));

    const res = await asAuth(request(buildApp()).get(`/api/circuits/${CIRCUIT_ID}`));

    expect(res.status).toBe(200);
    expect(res.body.isOwner).toBe(true);
    expect(res.body.circuit.owner).toBe(OWNER_ID); // withOwner=true
  });

  it('returns 404 when the circuit is not found', async () => {
    circuitModel.findOne.mockReturnValueOnce(makeQuery(null));

    const res = await asAuth(request(buildApp()).get(`/api/circuits/${CIRCUIT_ID}`));
    expect(res.status).toBe(404);
  });

  it('rejects a malformed id with 400', async () => {
    const res = await asAuth(request(buildApp()).get('/api/circuits/not-an-id'));
    expect(res.status).toBe(400);
  });
});

describe('routes/circuits · PUT /:id (update)', () => {
  it('applies a partial update (name is still required by validateCircuit)', async () => {
    circuitModel.findOneAndUpdate.mockReturnValueOnce(makeQuery(storedCircuit({ isPublic: true })));

    const res = await asAuth(request(buildApp()).put(`/api/circuits/${CIRCUIT_ID}`)).send({
      name: 'Renamed',
      isPublic: true,
    });

    expect(res.status).toBe(200);
    expect(res.body.circuit.isPublic).toBe(true);
    const [filter, update] = circuitModel.findOneAndUpdate.mock.calls[0];
    expect(filter).toMatchObject({ _id: CIRCUIT_ID, owner: OWNER_ID });
    expect(update.$set).toMatchObject({ name: 'Renamed', isPublic: true });
    // Partial payload must not inject nodes/edges that were not sent.
    expect(update.$set.nodes).toBeUndefined();
    expect(update.$set.edges).toBeUndefined();
  });

  it('returns 404 when the circuit is not owned by the caller', async () => {
    circuitModel.findOneAndUpdate.mockReturnValueOnce(makeQuery(null));

    const res = await asAuth(request(buildApp()).put(`/api/circuits/${CIRCUIT_ID}`)).send({
      name: 'Renamed',
    });
    expect(res.status).toBe(404);
  });
});

describe('routes/circuits · PATCH /:id/public (toggle)', () => {
  it('flips isPublic when no explicit value is supplied', async () => {
    const doc = storedCircuit({ isPublic: false });
    doc.save = jest.fn(async () => doc);
    circuitModel.findOne.mockResolvedValueOnce(doc);

    const res = await asAuth(request(buildApp()).patch(`/api/circuits/${CIRCUIT_ID}/public`)).send({});

    expect(res.status).toBe(200);
    expect(res.body.circuit.isPublic).toBe(true);
    expect(doc.save).toHaveBeenCalledTimes(1);
  });
});

describe('routes/circuits · POST /:id/duplicate', () => {
  it('duplicates a circuit the caller can read into a private copy', async () => {
    circuitModel.findOne.mockReturnValueOnce(makeQuery(storedCircuit()));
    circuitModel.create.mockResolvedValueOnce(storedCircuit({ name: 'Half Adder (Copy)' }));

    const res = await asAuth(request(buildApp()).post(`/api/circuits/${CIRCUIT_ID}/duplicate`));

    expect(res.status).toBe(201);
    expect(res.body.circuit.name).toBe('Half Adder (Copy)');
    const payload = circuitModel.create.mock.calls[0][0];
    expect(payload).toMatchObject({ name: 'Half Adder (Copy)', owner: OWNER_ID, isPublic: false });
  });
});

describe('routes/circuits · DELETE /:id', () => {
  it('deletes an owned circuit', async () => {
    circuitModel.findOneAndDelete.mockResolvedValueOnce(storedCircuit());

    const res = await asAuth(request(buildApp()).delete(`/api/circuits/${CIRCUIT_ID}`));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: 'Circuit deleted successfully', id: CIRCUIT_ID });
  });

  it('returns 404 when nothing was deleted', async () => {
    circuitModel.findOneAndDelete.mockResolvedValueOnce(null);
    const res = await asAuth(request(buildApp()).delete(`/api/circuits/${CIRCUIT_ID}`));
    expect(res.status).toBe(404);
  });
});

describe('routes/circuits · POST /:id/simulate', () => {
  it('returns resolved OUTPUT values from the shared engine', async () => {
    circuitModel.findOne.mockReturnValueOnce(
      makeQuery(
        storedCircuit({
          nodes: [
            { id: 'a', type: 'INPUT', data: { value: true } },
            { id: 'b', type: 'INPUT', data: { value: true } },
            { id: 'and', type: 'AND', data: { inputCount: 2 } },
            { id: 'out', type: 'OUTPUT', data: { inputCount: 1 } },
          ],
          edges: [
            { id: 'e1', source: 'a', target: 'and', targetHandle: 'input-0' },
            { id: 'e2', source: 'b', target: 'and', targetHandle: 'input-1' },
            { id: 'e3', source: 'and', target: 'out', targetHandle: 'input-0' },
          ],
        })
      )
    );

    const res = await asAuth(request(buildApp()).post(`/api/circuits/${CIRCUIT_ID}/simulate`));

    expect(res.status).toBe(200);
    expect(res.body.outputs).toEqual({ out: true });
    expect(res.body.nodeCount).toBe(4);
    expect(res.body.edgeCount).toBe(3);
  });
});

describe('routes/circuits · GET /public', () => {
  it('returns the public gallery without requiring a session', async () => {
    circuitModel.find.mockReturnValueOnce(
      makeQuery([
        {
          _id: CIRCUIT_ID,
          name: 'Public ALU',
          owner: { _id: new mongoose.Types.ObjectId(), name: 'Grace' },
          gateCount: 3,
          wireCount: 2,
        },
      ])
    );
    circuitModel.countDocuments.mockResolvedValueOnce(1);

    const res = await request(buildApp()).get('/api/circuits/public');

    expect(res.status).toBe(200);
    expect(res.body.circuits[0]).toMatchObject({ name: 'Public ALU', isOwner: false });
    expect(circuitModel.find).toHaveBeenCalledWith({ isPublic: true });
  });
});
