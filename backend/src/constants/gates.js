// ---------------------------------------------------------------------------
// Single source of truth for every logic gate the stack understands.
//
// The Mongoose schema enum, the request-validation layer and the evaluation
// engine all import from here, so adding a gate means editing exactly one file
// (plus its truth table in services/simulation.js).
// ---------------------------------------------------------------------------

export const GATE_TYPES = Object.freeze([
  // I/O + buffers
  'INPUT', 'OUTPUT', 'BUFFER', 'NOT',
  // primitive 2-input
  'AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'TRISTATE',
  // 3-input
  'AND3', 'OR3', 'NAND3', 'NOR3', 'XOR3', 'XNOR3',
  // 4-input
  'AND4', 'OR4', 'NAND4', 'NOR4', 'XOR4', 'XNOR4',
  // 5-input
  'AND5', 'OR5', 'NAND5', 'NOR5', 'XOR5', 'XNOR5',
  // multiplexers
  'MUX2', 'MUX4', 'MUX8',
  // complex / AOI-OAI families
  'AOI21', 'OAI21', 'AOI22', 'OAI22',
  'AOI31', 'OAI31', 'AOI32', 'OAI32', 'AOI33', 'OAI33',
  // arithmetic / decision
  'MAJ3', 'MAJ4', 'MAJ5', 'EQ2', 'EQ3',
]);

// ---------------------------------------------------------------------------
// Pin counts.
//
// Multiplexers are data-first: D0..D(n-1) then S0..S(m-1).
//   MUX2  D0 D1 | S0          =  2 + 1 =  3
//   MUX4  D0..D3 | S0 S1      =  4 + 2 =  6
//   MUX8  D0..D7 | S0 S1 S2   =  8 + 3 = 11
//
// MUX8 is 11 pins (not 10). The evaluator decodes the select lines from the
// last three pins; declaring 10 previously pushed S2 outside the input array.
// ---------------------------------------------------------------------------
export const GATE_INPUT_COUNTS = Object.freeze({
  INPUT: 0, OUTPUT: 1, BUFFER: 1, NOT: 1,
  AND: 2, OR: 2, NAND: 2, NOR: 2, XOR: 2, XNOR: 2, TRISTATE: 2,
  AND3: 3, OR3: 3, NAND3: 3, NOR3: 3, XOR3: 3, XNOR3: 3,
  AND4: 4, OR4: 4, NAND4: 4, NOR4: 4, XOR4: 4, XNOR4: 4,
  AND5: 5, OR5: 5, NAND5: 5, NOR5: 5, XOR5: 5, XNOR5: 5,
  MUX2: 3, MUX4: 6, MUX8: 11,
  AOI21: 3, OAI21: 3, AOI22: 5, OAI22: 5,
  AOI31: 4, OAI31: 4, AOI32: 5, OAI32: 5, AOI33: 6, OAI33: 6,
  MAJ3: 3, MAJ4: 4, MAJ5: 5, EQ2: 2, EQ3: 3,
});

/** Multiplexer data / select pin counts. */
export const MUX_DATA_PINS = Object.freeze({ MUX2: 2, MUX4: 4, MUX8: 8 });
export const MUX_SELECT_PINS = Object.freeze({ MUX2: 1, MUX4: 2, MUX8: 3 });


/** Hard ceilings so a single request can never exhaust the worker. */
export const MAX_NODES_PER_CIRCUIT = 400;
export const MAX_EDGES_PER_CIRCUIT = 800;

/** Handle id used when a client omits an explicit source/target handle. */
export const DEFAULT_SOURCE_HANDLE = 'output-0';
export const DEFAULT_TARGET_HANDLE = 'input-0';

export const isValidGateType = (type) => GATE_TYPES.includes(type);

export const inputCountFor = (type) => {
  const count = GATE_INPUT_COUNTS[type];
  return Number.isFinite(count) ? count : 1;
};
