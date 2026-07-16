// ---------------------------------------------------------------------------
// Server-side logic gate evaluation. Kept in sync with the frontend simulator
// (frontend/src/utils/simulation.js). Inputs arrive as an ordered boolean
// array whose index matches the gate's input-pin index. Unconnected pins = LOW.
// ---------------------------------------------------------------------------
const GATE_LOGIC = {
  INPUT: (inputs) => inputs[0],
  OUTPUT: (inputs) => inputs[0],
  BUFFER: (inputs) => inputs[0],
  NOT: (inputs) => !inputs[0],

  AND: (inputs) => inputs.length > 0 && inputs.every(Boolean),
  OR: (inputs) => inputs.some(Boolean),
  NAND: (inputs) => !(inputs.length > 0 && inputs.every(Boolean)),
  NOR: (inputs) => !inputs.some(Boolean),
  XOR: (inputs) => inputs.filter(Boolean).length % 2 === 1,
  XNOR: (inputs) => inputs.filter(Boolean).length % 2 === 0,

  TRISTATE: (inputs) => Boolean(inputs[0]) && Boolean(inputs[1]),

  AND3: (inputs) => inputs.length > 0 && inputs.every(Boolean),
  OR3: (inputs) => inputs.some(Boolean),
  NAND3: (inputs) => !(inputs.length > 0 && inputs.every(Boolean)),
  NOR3: (inputs) => !inputs.some(Boolean),
  XOR3: (inputs) => inputs.filter(Boolean).length % 2 === 1,
  XNOR3: (inputs) => inputs.filter(Boolean).length % 2 === 0,
  AND4: (inputs) => inputs.length > 0 && inputs.every(Boolean),
  OR4: (inputs) => inputs.some(Boolean),
  NAND4: (inputs) => !(inputs.length > 0 && inputs.every(Boolean)),
  NOR4: (inputs) => !inputs.some(Boolean),
  XOR4: (inputs) => inputs.filter(Boolean).length % 2 === 1,
  XNOR4: (inputs) => inputs.filter(Boolean).length % 2 === 0,

  MUX2: (inputs) => Boolean(inputs[2] ? inputs[1] : inputs[0]),
  MUX4: (inputs) => {
    const sel = (Number(inputs[5]) << 1) | Number(inputs[4]);
    return Boolean(inputs[sel]);
  },
  AOI21: (inputs) => !(Boolean(inputs[0]) && Boolean(inputs[1]) || Boolean(inputs[2])),
  OAI21: (inputs) => !((Boolean(inputs[0]) || Boolean(inputs[1])) && Boolean(inputs[2])),
  MAJ3: (inputs) => inputs.filter(Boolean).length >= 2,

  MUX8: (inputs) => {
    const sel = ((Number(inputs[9]) || 0) << 2) | ((Number(inputs[8]) || 0) << 1) | (Number(inputs[7]) || 0);
    return Boolean(inputs[sel]);
  },
  AOI22: (inputs) => !((Boolean(inputs[0]) && Boolean(inputs[1])) || (Boolean(inputs[2]) && Boolean(inputs[3])) || Boolean(inputs[4])),
  OAI22: (inputs) => !(((Boolean(inputs[0]) || Boolean(inputs[1])) && (Boolean(inputs[2]) || Boolean(inputs[3])) && Boolean(inputs[4]))),
  AOI31: (inputs) =>
    !((Boolean(inputs[0]) && Boolean(inputs[1]) && Boolean(inputs[2])) || Boolean(inputs[3])),
  OAI31: (inputs) =>
    !(((Boolean(inputs[0]) || Boolean(inputs[1]) || Boolean(inputs[2])) && Boolean(inputs[3]))),
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
  AND5: (inputs) => inputs.length > 0 && inputs.every(Boolean),
  OR5: (inputs) => inputs.some(Boolean),
  NAND5: (inputs) => !(inputs.length > 0 && inputs.every(Boolean)),
  NOR5: (inputs) => !inputs.some(Boolean),
  XOR5: (inputs) => inputs.filter(Boolean).length % 2 === 1,
  XNOR5: (inputs) => inputs.filter(Boolean).length % 2 === 0,
  EQ2: (inputs) => inputs.length >= 2 && inputs[0] === inputs[1],
  EQ3: (inputs) => inputs.length >= 3 && inputs[0] === inputs[1] && inputs[1] === inputs[2],
  MAJ4: (inputs) => inputs.filter(Boolean).length >= 3,
  MAJ5: (inputs) => inputs.filter(Boolean).length >= 3,
};

const evaluateGate = (type, inputs) => {
  const fn = GATE_LOGIC[type];
  return fn ? Boolean(fn(inputs)) : false;
};

const handleIndex = (handleId) => {
  if (typeof handleId !== 'string') return 0;
  const match = handleId.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

export const simulateCircuit = (nodes, edges) => {
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
    return Math.max(1, Number(node.data?.inputCount) || 1);
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
