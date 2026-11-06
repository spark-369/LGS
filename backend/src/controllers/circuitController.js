import { Circuit } from '../models/Circuit.js';
import { ApiError } from '../middleware/errorHandler.js';
import { escapeRegex } from '../utils/strings.js';
import { simulateCircuit } from '../services/simulation.js';
import {
  DEFAULT_SOURCE_HANDLE,
  DEFAULT_TARGET_HANDLE,
  GATE_INPUT_COUNTS,
  isValidGateType,
} from '../constants/gates.js';

// ---------------------------------------------------------------------------
// Sanitisation helpers
//
// Request bodies are never spread into the model. Every field is explicitly
// copied so a client can never rewrite `owner`, inject `_id`s, or smuggle
// unexpected keys into the document.
// ---------------------------------------------------------------------------

const sanitizeNodes = (nodes = []) =>
  nodes.map((node) => ({
    id: String(node.id),
    type: node.type,
    position: { x: Number(node.position?.x) || 0, y: Number(node.position?.y) || 0 },
    data: {
      label: typeof node.data?.label === 'string' ? node.data.label.slice(0, 60) : '',
      value: Boolean(node.data?.value),
      inputCount: Number.isFinite(Number(node.data?.inputCount))
        ? Math.max(0, Math.min(16, Number(node.data.inputCount)))
        : GATE_INPUT_COUNTS[node.type] || 2,
    },
  }));

const sanitizeEdges = (edges = []) =>
  edges.map((edge) => ({
    id: String(edge.id),
    source: String(edge.source),
    sourceHandle: edge.sourceHandle ? String(edge.sourceHandle) : DEFAULT_SOURCE_HANDLE,
    target: String(edge.target),
    targetHandle: edge.targetHandle ? String(edge.targetHandle) : DEFAULT_TARGET_HANDLE,
  }));

/**
 * Reject graphs that could never render or evaluate:
 *   - unknown gate types
 *   - duplicate node ids
 *   - edges pointing at nodes that do not exist
 */
const assertGraphIntegrity = (nodes, edges) => {
  const ids = new Set();
  for (const node of nodes) {
    if (!isValidGateType(node.type)) throw new ApiError(400, `Unsupported gate type "${node.type}"`);
    if (ids.has(node.id)) throw new ApiError(400, `Duplicate gate id "${node.id}"`);
    ids.add(node.id);
  }

  for (const edge of edges) {
    if (!ids.has(edge.source)) {
      throw new ApiError(400, `Wire references unknown source gate "${edge.source}"`);
    }
    if (!ids.has(edge.target)) {
      throw new ApiError(400, `Wire references unknown target gate "${edge.target}"`);
    }
  }
};

const buildCircuitPayload = (body = {}, { partial = false } = {}) => {
  const payload = {};

  if (body.name !== undefined) payload.name = String(body.name).trim();
  if (body.description !== undefined) payload.description = String(body.description ?? '').trim();
  if (body.isPublic !== undefined) payload.isPublic = Boolean(body.isPublic);

  if (body.nodes !== undefined) payload.nodes = sanitizeNodes(body.nodes);
  if (body.edges !== undefined) payload.edges = sanitizeEdges(body.edges);

  if (!partial) {
    payload.nodes = payload.nodes || [];
    payload.edges = payload.edges || [];
  }

  if (payload.nodes || payload.edges) {
    assertGraphIntegrity(payload.nodes || [], payload.edges || []);
  }

  return payload;
};

/** Shape a lean circuit for the API consumer. */
const presentCircuit = (circuit, { withOwner = false } = {}) => {
  if (!circuit) return circuit;
  const { owner, ...rest } = circuit;
  return {
    ...rest,
    gateCount: rest.nodes?.length || 0,
    wireCount: rest.edges?.length || 0,
    ...(withOwner && owner ? { owner } : {}),
  };
};

/** Shared pagination envelope. */
const paginate = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.max(1, Math.ceil(total / limit)),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});


// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

export const createCircuit = async (req, res, next) => {
  try {
    const payload = buildCircuitPayload(req.body);
    const circuit = await Circuit.create({ ...payload, owner: req.user._id });
    res.status(201).json({ circuit: presentCircuit(circuit.toObject()) });
  } catch (error) {
    next(error);
  }
};

export const getCircuits = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { search, isPublic, sort } = req.query;

    const filter = { owner: req.user._id };
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
    if (search) {
      // Escaped so a search term can never be interpreted as a regex (ReDoS).
      const safe = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ];
    }

    const sortMap = { recent: { createdAt: -1 }, name: { name: 1 }, gates: { createdAt: -1 } };

    const [circuits, total] = await Promise.all([
      Circuit.find(filter)
        .sort(sortMap[sort] || sortMap.recent)
        .skip(skip)
        .limit(limit)
        .lean(),
      Circuit.countDocuments(filter),
    ]);

    res.json({
      circuits: circuits.map((c) => presentCircuit(c)),
      pagination: paginate(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicCircuits = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const filter = { isPublic: true };
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ];
    }

    const [circuits, total] = await Promise.all([
      Circuit.find(filter)
        .select('-nodes -edges')
        .populate('owner', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Circuit.countDocuments(filter),
    ]);

    const viewerId = req.user?._id ? String(req.user._id) : null;

    res.json({
      circuits: circuits.map((c) => ({
        ...c,
        gateCount: c.gateCount ?? 0,
        wireCount: c.wireCount ?? 0,
        isOwner: viewerId ? String(c.owner?._id) === viewerId : false,
      })),
      pagination: paginate(page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};


export const getCircuit = async (req, res, next) => {
  try {
    const circuit = await Circuit.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user._id }, { isPublic: true }],
    }).lean();

    if (!circuit) throw new ApiError(404, 'Circuit not found');

    res.json({
      circuit: presentCircuit(circuit, { withOwner: true }),
      isOwner: String(circuit.owner) === String(req.user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const updateCircuit = async (req, res, next) => {
  try {
    const payload = buildCircuitPayload(req.body, { partial: true });

    const circuit = await Circuit.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();

    if (!circuit) throw new ApiError(404, 'Circuit not found');

    res.json({ circuit: presentCircuit(circuit) });
  } catch (error) {
    next(error);
  }
};

export const deleteCircuit = async (req, res, next) => {
  try {
    const circuit = await Circuit.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!circuit) throw new ApiError(404, 'Circuit not found');

    res.json({ message: 'Circuit deleted successfully', id: req.params.id });
  } catch (error) {
    next(error);
  }
};

export const duplicateCircuit = async (req, res, next) => {
  try {
    const original = await Circuit.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user._id }, { isPublic: true }],
    }).lean();

    if (!original) throw new ApiError(404, 'Circuit not found');

    const duplicated = await Circuit.create({
      name: `${original.name} (Copy)`.slice(0, 100),
      description: original.description,
      owner: req.user._id,
      nodes: original.nodes,
      edges: original.edges,
      isPublic: false,
    });

    res.status(201).json({ circuit: presentCircuit(duplicated.toObject()) });
  } catch (error) {
    next(error);
  }
};

export const togglePublic = async (req, res, next) => {
  try {
    const circuit = await Circuit.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!circuit) throw new ApiError(404, 'Circuit not found');

    // Honour an explicit value when supplied, otherwise flip.
    circuit.isPublic =
      req.body?.isPublic === undefined ? !circuit.isPublic : Boolean(req.body.isPublic);
    await circuit.save();

    res.json({ circuit: presentCircuit(circuit.toObject()) });
  } catch (error) {
    next(error);
  }
};

/**
 * Run the stored circuit through the shared evaluation engine and return the
 * resolved OUTPUT values. This finally wires up services/simulation.js, which
 * previously had no route reaching it.
 */
export const simulateStoredCircuit = async (req, res, next) => {
  try {
    const circuit = await Circuit.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user._id }, { isPublic: true }],
    }).lean();

    if (!circuit) throw new ApiError(404, 'Circuit not found');

    const result = simulateCircuit(circuit.nodes, circuit.edges);

    res.json({
      outputs: result.outputs,
      values: result.values,
      nodeCount: circuit.nodes.length,
      edgeCount: circuit.edges.length,
    });
  } catch (error) {
    next(error);
  }
};
