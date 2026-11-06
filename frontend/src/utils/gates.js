// ---------------------------------------------------------------------------
// Single source of truth for the gate library.
//
// The palette (Toolbar), the canvas node (LogicGateNode), the symbol renderer
// (GateSymbol), the node factory (gateTemplates) and the simulator
// (utils/simulation) all read from here, so a gate is defined exactly once.
//
// The backend mirrors the *type list* in backend/src/constants/gates.js —
// keep the two in sync.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Pin counts
//
// For multiplexers the data pins come FIRST, then the select pins:
//   MUX2  D0 D1 | S0          =  2 + 1 =  3
//   MUX4  D0..D3 | S0 S1      =  4 + 2 =  6
//   MUX8  D0..D7 | S0 S1 S2   =  8 + 3 = 11
//
// NOTE: MUX8 is 11 pins, not 10. The simulator decodes the select lines from
// the LAST three pins, so declaring 10 previously made S2 fall outside the
// input array and made every MUX8 selection wrong.
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

/** Every gate type the stack understands (48 total). */
export const GATE_TYPES = Object.freeze(Object.keys(GATE_INPUT_COUNTS));

/** Multiplexer data / select pin counts. */
export const MUX_DATA_PINS = Object.freeze({ MUX2: 2, MUX4: 4, MUX8: 8 });
export const MUX_SELECT_PINS = Object.freeze({ MUX2: 1, MUX4: 2, MUX8: 3 });

// ---------------------------------------------------------------------------
// Pin labels — what makes the canvas readable. A wire entering the row
// labelled "S1" is unambiguous, whereas an unlabelled 11-pin card is not.
// ---------------------------------------------------------------------------
const SINGLE_LETTER = ['A', 'B', 'C', 'D', 'E'];

export const buildPinLabels = (type) => {
  const count = GATE_INPUT_COUNTS[type] ?? 1;

  // Multiplexers: data lines then select lines.
  if (MUX_DATA_PINS[type]) {
    const dataCount = MUX_DATA_PINS[type];
    const selectCount = MUX_SELECT_PINS[type];
    const inputs = [
      ...Array.from({ length: dataCount }, (_, i) => `D${i}`),
      ...Array.from({ length: selectCount }, (_, i) => `S${i}`),
    ];
    return { inputs, output: 'Y' };
  }

  // Everything else: A, B, C… (a 5-input AND reads A B C D E).
  const inputs = Array.from({ length: count }, (_, i) => SINGLE_LETTER[i] || `I${i}`);
  return { inputs, output: 'Y' };
};

// ---------------------------------------------------------------------------
// Families — drive the symbol shape, the palette grouping and the accent.
// ---------------------------------------------------------------------------
export const GATE_FAMILY = Object.freeze({
  IO: 'io',
  BUFFER: 'buffer',
  NOT: 'not',
  AND: 'and',
  OR: 'or',
  XOR: 'xor',
  MUX: 'mux',
  AOI: 'aoi',
  MAJORITY: 'majority',
  EQUALITY: 'equality',
  TRISTATE: 'tristate',
});

const base = (t) => t.replace(/\d+$/, ''); // AND3 -> AND, AOI21 -> AOI

/**
 * Resolve a gate type to its rendering family.
 *
 * Defensive by design: nodes can arrive from the API, from a stale
 * localStorage draft or from a partially-built object, so an unknown or
 * missing type falls back to the AND family instead of throwing. Previously
 * a missing type crashed the entire canvas via `undefined.startsWith(...)`.
 */
export const getGateFamily = (type) => {
  if (typeof type !== 'string' || !type) return GATE_FAMILY.AND;
  if (type === 'INPUT' || type === 'OUTPUT') return GATE_FAMILY.IO;
  if (type === 'BUFFER') return GATE_FAMILY.BUFFER;
  if (type === 'NOT') return GATE_FAMILY.NOT;
  if (type === 'TRISTATE') return GATE_FAMILY.TRISTATE;
  if (type.startsWith('MUX')) return GATE_FAMILY.MUX;
  if (type.startsWith('MAJ')) return GATE_FAMILY.MAJORITY;
  if (type.startsWith('EQ')) return GATE_FAMILY.EQUALITY;
  if (type.startsWith('AOI') || type.startsWith('OAI')) return GATE_FAMILY.AOI;
  const b = base(type);
  if (b === 'AND' || b === 'NAND') return GATE_FAMILY.AND;
  if (b === 'OR' || b === 'NOR') return GATE_FAMILY.OR;
  if (b === 'XOR' || b === 'XNOR') return GATE_FAMILY.XOR;
  return GATE_FAMILY.AND;
};

/** True when the gate's output is inverted (drawn with a bubble). */
export const isInverted = (type) =>
  typeof type === 'string' &&
  (['NOT', 'NAND', 'NOR', 'XNOR', 'NAND3', 'NAND4', 'NAND5',
    'NOR3', 'NOR4', 'NOR5', 'XNOR3', 'XNOR4', 'XNOR5'].includes(type) ||
    type.startsWith('AOI') ||
    type.startsWith('OAI'));

// ---------------------------------------------------------------------------
// Accent colour per family — used by the node, palette and minimap.
// ---------------------------------------------------------------------------
export const FAMILY_ACCENT = Object.freeze({
  [GATE_FAMILY.IO]: '#16a34a',
  [GATE_FAMILY.BUFFER]: '#0891b2',
  [GATE_FAMILY.NOT]: '#f59e0b',
  [GATE_FAMILY.TRISTATE]: '#0891b2',
  [GATE_FAMILY.AND]: '#2563eb',
  [GATE_FAMILY.OR]: '#9333ea',
  [GATE_FAMILY.XOR]: '#ec4899',
  [GATE_FAMILY.MUX]: '#0ea5e9',
  [GATE_FAMILY.AOI]: '#d946ef',
  [GATE_FAMILY.MAJORITY]: '#14b8a6',
  [GATE_FAMILY.EQUALITY]: '#f97316',
});

export const getGateAccent = (type) =>
  FAMILY_ACCENT[getGateFamily(type)] || FAMILY_ACCENT[GATE_FAMILY.AND];
/** Derived accent map for every type (kept for backwards compatibility). */
export const GATE_ACCENT = Object.freeze(
  Object.fromEntries(GATE_TYPES.map((type) => [type, getGateAccent(type)]))
);

// ---------------------------------------------------------------------------
// Palette categories — defined once here and consumed by the Toolbar. Each
// entry only needs a type; every other property is derived.
// ---------------------------------------------------------------------------
export const GATE_CATEGORIES = [
  {
    label: 'Input / Output',
    color: FAMILY_ACCENT[GATE_FAMILY.IO],
    gates: [{ type: 'INPUT' }, { type: 'OUTPUT' }],
  },
  {
    label: 'Basic Gates',
    color: FAMILY_ACCENT[GATE_FAMILY.AND],
    gates: [{ type: 'AND' }, { type: 'OR' }, { type: 'NOT' }, { type: 'BUFFER' }],
  },
  {
    label: 'Universal Gates',
    color: '#7c3aed',
    gates: [{ type: 'NAND' }, { type: 'NOR' }],
  },
  {
    label: 'Exclusive Gates',
    color: FAMILY_ACCENT[GATE_FAMILY.XOR],
    gates: [{ type: 'XOR' }, { type: 'XNOR' }],
  },
  {
    label: '3-Input Gates',
    color: FAMILY_ACCENT[GATE_FAMILY.AND],
    gates: [
      { type: 'AND3' }, { type: 'OR3' }, { type: 'NAND3' },
      { type: 'NOR3' }, { type: 'XOR3' }, { type: 'XNOR3' },
    ],
  },
  {
    label: '4-Input Gates',
    color: FAMILY_ACCENT[GATE_FAMILY.AND],
    gates: [
      { type: 'AND4' }, { type: 'OR4' }, { type: 'NAND4' },
      { type: 'NOR4' }, { type: 'XOR4' }, { type: 'XNOR4' },
    ],
  },
  {
    label: '5-Input Gates',
    color: '#1d4ed8',
    gates: [
      { type: 'AND5' }, { type: 'OR5' }, { type: 'NAND5' },
      { type: 'NOR5' }, { type: 'XOR5' }, { type: 'XNOR5' },
    ],
  },
  {
    label: 'Multiplexers',
    color: FAMILY_ACCENT[GATE_FAMILY.MUX],
    gates: [{ type: 'MUX2' }, { type: 'MUX4' }, { type: 'MUX8' }],
  },
  {
    label: 'Arithmetic',
    color: FAMILY_ACCENT[GATE_FAMILY.MAJORITY],
    gates: [
      { type: 'MAJ3' }, { type: 'MAJ4' }, { type: 'MAJ5' },
      { type: 'EQ2' }, { type: 'EQ3' },
    ],
  },
  {
    label: 'Complex (AOI / OAI)',
    color: FAMILY_ACCENT[GATE_FAMILY.AOI],
    gates: [
      { type: 'AOI21' }, { type: 'OAI21' },
      { type: 'AOI22' }, { type: 'OAI22' },
      { type: 'AOI31' }, { type: 'OAI31' },
      { type: 'AOI32' }, { type: 'OAI32' },
      { type: 'AOI33' }, { type: 'OAI33' },
    ],
  },
  {
    label: 'Special',
    color: FAMILY_ACCENT[GATE_FAMILY.TRISTATE],
    gates: [{ type: 'TRISTATE' }],
  },
];

export const TOTAL_GATE_COUNT = GATE_CATEGORIES.reduce(
  (sum, c) => sum + c.gates.length,
  0
);

/** Short palette label, e.g. "BUFFER" -> "BUF", "TRISTATE" -> "TS". */
export const gateShortLabel = (type) => {
  if (type === 'BUFFER') return 'BUF';
  if (type === 'TRISTATE') return 'TS';
  if (type === 'INPUT') return 'IN';
  if (type === 'OUTPUT') return 'OUT';
  return type;
};

