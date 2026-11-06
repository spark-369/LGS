// ---------------------------------------------------------------------------
// Server-side logic gate evaluation.
//
// Kept intentionally in sync with the frontend evaluator
// (frontend/src/utils/simulation.js) so the API can validate a stored circuit
// and expose deterministic truth values for OUTPUT gates.
//
// Inputs arrive as an ordered boolean array whose index matches the gate's
// input-pin index. Missing / unconnected pins are treated as LOW (false).
// ---------------------------------------------------------------------------
import { GATE_INPUT_COUNTS } from '../constants/gates.js';

const parity = (inputs) => inputs.filter(Boolean).length % 2 === 1;
const allHigh = (inputs) => inputs.length > 0 && inputs.every(Boolean);

/**
 * Decode a multiplexer's select lines.
 *
 * Pins are data-first (D0..D(n-1) then S0..S(m-1)), so the select lines are
 * read from the END of the input array. S0 is the least-significant bit.
 * Reading from the end keeps the decode correct regardless of data width,
 * which is what the previous fixed-index version got wrong for MUX8.
 */
const muxSelect = (inputs, dataCount, selectCount) => {
  let sel = 0;
  for (let i = 0; i < selectCount; i += 1) {
    if (inputs[dataCount + i]) sel |= 1 << i;
  }
  return sel;
};

export const GATE_LOGIC = {
  INPUT: (inputs) => Boolean(inputs[0]),
  OUTPUT: (inputs) => Boolean(inputs[0]),
  BUFFER: (inputs) => Boolean(inputs[0]),
  NOT: (inputs) => !inputs[0],

  AND: allHigh,
  OR: (inputs) => inputs.some(Boolean),
  NAND: (inputs) => !allHigh(inputs),
  NOR: (inputs) => !inputs.some(Boolean),
  XOR: parity,
  XNOR: (inputs) => !parity(inputs),

  TRISTATE: (inputs) => Boolean(inputs[0]) && Boolean(inputs[1]),

  AND3: allHigh,
  OR3: (inputs) => inputs.some(Boolean),
  NAND3: (inputs) => !allHigh(inputs),
  NOR3: (inputs) => !inputs.some(Boolean),
  XOR3: parity,
  XNOR3: (inputs) => !parity(inputs),
  AND4: allHigh,
  OR4: (inputs) => inputs.some(Boolean),
  NAND4: (inputs) => !allHigh(inputs),
  NOR4: (inputs) => !inputs.some(Boolean),
  XOR4: parity,
  XNOR4: (inputs) => !parity(inputs),
  AND5: allHigh,
  OR5: (inputs) => inputs.some(Boolean),
  NAND5: (inputs) => !allHigh(inputs),
  NOR5: (inputs) => !inputs.some(Boolean),
  XOR5: parity,
  XNOR5: (inputs) => !parity(inputs),

  // D0 D1 | S0
  MUX2: (inputs) => Boolean(inputs[muxSelect(inputs, 2, 1)]),
  // D0..D3 | S0 S1
  MUX4: (inputs) => Boolean(inputs[muxSelect(inputs, 4, 2)]),
  // D0..D7 | S0 S1 S2
  MUX8: (inputs) => Boolean(inputs[muxSelect(inputs, 8, 3)]),

  AOI21: (inputs) => !((Boolean(inputs[0]) && Boolean(inputs[1])) || Boolean(inputs[2])),
  OAI21: (inputs) => !((Boolean(inputs[0]) || Boolean(inputs[1])) && Boolean(inputs[2])),
  AOI22: (inputs) =>
    !(
      (Boolean(inputs[0]) && Boolean(inputs[1])) ||
      (Boolean(inputs[2]) && Boolean(inputs[3])) ||
      Boolean(inputs[4])
    ),
  OAI22: (inputs) =>
    !(
      (Boolean(inputs[0]) || Boolean(inputs[1])) &&
      (Boolean(inputs[2]) || Boolean(inputs[3])) &&
      Boolean(inputs[4])
    ),
  AOI31: (inputs) =>
    !((Boolean(inputs[0]) && Boolean(inputs[1]) && Boolean(inputs[2])) || Boolean(inputs[3])),
  OAI31: (inputs) =>
    !((Boolean(inputs[0]) || Boolean(inputs[1]) || Boolean(inputs[2])) && Boolean(inputs[3])),
  AOI32: (inputs) =>
    !(
      (Boolean(inputs[0]) && Boolean(inputs[1]) && Boolean(inputs[2])) ||
      (Boolean(inputs[3]) && Boolean(inputs[4]))
    ),
  OAI32: (inputs) =>
    !(
      (Boolean(inputs[0]) || Boolean(inputs[1]) || Boolean(inputs[2])) &&
      (Boolean(inputs[3]) || Boolean(inputs[4]))
    ),
  AOI33: (inputs) =>
    !(
      (Boolean(inputs[0]) && Boolean(inputs[1]) && Boolean(inputs[2])) ||
      (Boolean(inputs[3]) && Boolean(inputs[4]) && Boolean(inputs[5]))
    ),
  OAI33: (inputs) =>
    !(
      (Boolean(inputs[0]) || Boolean(inputs[1]) || Boolean(inputs[2])) &&
      (Boolean(inputs[3]) || Boolean(inputs[4]) || Boolean(inputs[5]))
    ),

  MAJ3: (inputs) => inputs.filter(Boolean).length >= 2,
  MAJ4: (inputs) => inputs.filter(Boolean).length >= 3,
  MAJ5: (inputs) => inputs.filter(Boolean).length >= 3,
  EQ2: (inputs) => inputs.length >= 2 && inputs[0] === inputs[1],
  EQ3: (inputs) =>
    inputs.length >= 3 && inputs[0] === inputs[1] && inputs[1] === inputs[2],
};

/**
 * Evaluate one gate. Unknown types evaluate to LOW rather than throwing so a
 * partially-migrated circuit can still be previewed.
 *
 * @param {string} type
 * @param {boolean[]} inputs
 * @returns {boolean}
 */
export const evaluateGate = (type, inputs = []) => {
  const fn = GATE_LOGIC[type];
  return fn ? Boolean(fn(inputs)) : false;
};

/** Pull the pin index out of a handle id such as "input-2" -> 2. */
const handleIndex = (handleId) => {
  if (typeof handleId !== 'string') return 0;
  const match = handleId.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

/**
 * Evaluate a combinational logic circuit.
 *
 * The algorithm iterates to a fixed point, which naturally handles arbitrary
 * evaluation order, unconnected pins and even feedback loops (which stabilise
 * or oscillate within a bounded number of passes). Input-pin ordering is
 * preserved via each edge's targetHandle.
 *
 * @param {Array} nodes - [{ id, type, data:{ value, inputCount } }]
 * @param {Array} edges - [{ source, target, sourceHandle, targetHandle }]
 * @returns {{ nodes: Array, outputs: Object, values: Object }}
 */
export const simulateCircuit = (nodes = [], edges = []) => {
  const values = new Map();
  const nodeById = new Map();

  for (const node of nodes) {
    nodeById.set(node.id, node);
    values.set(node.id, node.type === 'INPUT' ? Boolean(node.data?.value) : false);
  }

  const incoming = new Map();
  for (const node of nodes) incoming.set(node.id, []);
  for (const edge of edges) {
    if (incoming.has(edge.target) && nodeById.has(edge.source)) {
      incoming.get(edge.target).push(edge);
    }
  }

  const gateInputCount = (node) => {
    if (node.type === 'INPUT') return 0;
    const declared = Number(node.data?.inputCount);
    if (Number.isFinite(declared) && declared > 0) return declared;
    return GATE_INPUT_COUNTS[node.type] || 1;
  };

  const computeNodeValue = (node) => {
    if (node.type === 'INPUT') return Boolean(node.data?.value);

    const edgesIn = incoming.get(node.id) || [];
    const size = Math.max(
      gateInputCount(node),
      ...edgesIn.map((e) => handleIndex(e.targetHandle) + 1),
      1
    );
    const inputs = new Array(size).fill(false);

    for (const edge of edgesIn) {
      const idx = handleIndex(edge.targetHandle);
      inputs[idx] = inputs[idx] || Boolean(values.get(edge.source));
    }

    return evaluateGate(node.type, inputs);
  };

  const maxPasses = Math.max(nodes.length + 1, 2);
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let changed = false;
    for (const node of nodes) {
      const next = computeNodeValue(node);
      if (next !== values.get(node.id)) {
        values.set(node.id, next);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const outputs = {};
  const resultNodes = nodes.map((node) => {
    const value = values.get(node.id);
    if (node.type === 'OUTPUT') outputs[node.id] = value;
    return { ...node, data: { ...node.data, value } };
  });

  return {
    nodes: resultNodes,
    outputs,
    values: Object.fromEntries(values),
  };
};

