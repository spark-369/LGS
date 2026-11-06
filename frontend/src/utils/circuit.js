// ---------------------------------------------------------------------------
// Serialization helpers bridging React Flow's in-memory node/edge shapes and
// the compact shape persisted by the API.
//
// NOTE: node creation lives in utils/gateTemplates.js so there is a single
// definition of each gate's default data.
// ---------------------------------------------------------------------------
import { GATE_INPUT_COUNTS } from './gates';

/** Serialize React Flow nodes into the persisted API shape. */
export const serializeNodes = (nodes = []) =>
  nodes.map((n) => ({
    id: n.id,
    type: n.data?.type,
    position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
    data: {
      label: n.data?.label ?? '',
      value: Boolean(n.data?.value),
      inputCount: Number(n.data?.inputCount) || 0,
    },
  }));

/** Serialize React Flow edges into the persisted API shape. */
export const serializeEdges = (edges = []) =>
  edges.map((e) => ({
    id: e.id,
    source: e.source,
    sourceHandle: e.sourceHandle || 'output-0',
    target: e.target,
    targetHandle: e.targetHandle || 'input-0',
  }));

/** Convert a stored API node back into a React Flow node. */
export const deserializeNode = (stored, decorate) => {
  const base = {
    id: stored.id,
    type: 'logicGate',
    position: stored.position || { x: 0, y: 0 },
    data: {
      label: stored.data?.label ?? '',
      value: Boolean(stored.data?.value),
      inputCount: stored.data?.inputCount ?? GATE_INPUT_COUNTS[stored.type] ?? 1,
      type: stored.type,
    },
  };
  return decorate ? decorate(base) : base;
};
