// ---------------------------------------------------------------------------
// Default node data for each gate type.
//
// `data.type` is REQUIRED — LogicGateNode, the minimap colour and the simulator
// all read the gate type from `node.data.type`, not from the React Flow node
// `type` (which is the generic 'logicGate' renderer key).
// ---------------------------------------------------------------------------
import { GATE_INPUT_COUNTS, gateShortLabel } from './gates';

export const GATE_TEMPLATES = Object.fromEntries(
  Object.entries(GATE_INPUT_COUNTS).map(([type, inputCount]) => [
    type,
    {
      type,
      data: { type, label: gateShortLabel(type), value: false, inputCount },
    },
  ])
);

export const getGateTemplate = (type) => GATE_TEMPLATES[type];


