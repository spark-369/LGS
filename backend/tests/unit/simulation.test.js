import { describe, it, expect } from '@jest/globals';
import { evaluateGate, simulateCircuit } from '../../src/services/simulation.js';

// ---------------------------------------------------------------------------
// Small builders keep the circuit tests declarative.
// ---------------------------------------------------------------------------
const node = (id, type, data = {}) => ({ id, type, data });
const edge = (source, target, targetHandle = 'input-0', sourceHandle = 'output-0') => ({
  id: `${source}->${target}:${targetHandle}`,
  source,
  target,
  sourceHandle,
  targetHandle,
});

describe('services/simulation · evaluateGate truth tables', () => {
  describe('primitive gates', () => {
    it('AND / NAND', () => {
      expect(evaluateGate('AND', [false, false])).toBe(false);
      expect(evaluateGate('AND', [true, false])).toBe(false);
      expect(evaluateGate('AND', [true, true])).toBe(true);

      expect(evaluateGate('NAND', [false, false])).toBe(true);
      expect(evaluateGate('NAND', [true, false])).toBe(true);
      expect(evaluateGate('NAND', [true, true])).toBe(false);
    });

    it('OR / NOR', () => {
      expect(evaluateGate('OR', [false, false])).toBe(false);
      expect(evaluateGate('OR', [true, false])).toBe(true);
      expect(evaluateGate('OR', [true, true])).toBe(true);

      expect(evaluateGate('NOR', [false, false])).toBe(true);
      expect(evaluateGate('NOR', [true, false])).toBe(false);
    });

    it('XOR / XNOR (odd-parity)', () => {
      expect(evaluateGate('XOR', [false, false])).toBe(false);
      expect(evaluateGate('XOR', [true, false])).toBe(true);
      expect(evaluateGate('XOR', [true, true])).toBe(false);

      expect(evaluateGate('XNOR', [true, true])).toBe(true);
      expect(evaluateGate('XNOR', [true, false])).toBe(false);
    });

    it('NOT / BUFFER / INPUT / OUTPUT', () => {
      expect(evaluateGate('NOT', [true])).toBe(false);
      expect(evaluateGate('NOT', [false])).toBe(true);
      expect(evaluateGate('BUFFER', [true])).toBe(true);
      expect(evaluateGate('INPUT', [true])).toBe(true);
      expect(evaluateGate('OUTPUT', [false])).toBe(false);
    });

    it('TRISTATE passes the data line only when enabled', () => {
      expect(evaluateGate('TRISTATE', [true, true])).toBe(true);
      expect(evaluateGate('TRISTATE', [true, false])).toBe(false);
      expect(evaluateGate('TRISTATE', [false, true])).toBe(false);
    });
  });

  describe('multi-input variants', () => {
    it('AND3/AND4/AND5 require every pin high', () => {
      expect(evaluateGate('AND3', [true, true, true])).toBe(true);
      expect(evaluateGate('AND3', [true, true, false])).toBe(false);
      expect(evaluateGate('AND4', [true, true, true, true])).toBe(true);
      expect(evaluateGate('AND4', [true, true, true, false])).toBe(false);
      expect(evaluateGate('AND5', [true, true, true, true, true])).toBe(true);
      expect(evaluateGate('AND5', [true, true, true, true, false])).toBe(false);
    });

    it('OR3/OR4/OR5 require at least one pin high', () => {
      expect(evaluateGate('OR3', [false, false, true])).toBe(true);
      expect(evaluateGate('OR3', [false, false, false])).toBe(false);
      expect(evaluateGate('OR5', [false, false, false, false, true])).toBe(true);
    });

    it('NAND3/NOR4 are the inverted everyday counterparts', () => {
      expect(evaluateGate('NAND3', [true, true, true])).toBe(false);
      expect(evaluateGate('NAND3', [true, true, false])).toBe(true);
      expect(evaluateGate('NOR4', [false, false, false, false])).toBe(true);
      expect(evaluateGate('NOR4', [false, false, true, false])).toBe(false);
    });

    it('XOR3/XOR5 are parity checks', () => {
      expect(evaluateGate('XOR3', [true, true, true])).toBe(true); // 3 highs -> odd
      expect(evaluateGate('XOR3', [true, true, false])).toBe(false); // 2 highs -> even
      expect(evaluateGate('XOR5', [true, true, true, true, true])).toBe(true);
      expect(evaluateGate('XOR5', [true, true, true, true, false])).toBe(false);
    });
  });

  describe('multiplexers (data-first pin order, S0 = LSB)', () => {
    it('MUX2 selects D0 when S0 is low, D1 when high', () => {
      //        D0     D1     S0
      expect(evaluateGate('MUX2', [true, false, false])).toBe(true);
      expect(evaluateGate('MUX2', [true, false, true])).toBe(false);
      expect(evaluateGate('MUX2', [false, true, true])).toBe(true);
    });

    it('MUX4 decodes two select lines', () => {
      //            D0     D1     D2    D3     S0     S1
      expect(evaluateGate('MUX4', [true, false, false, false, false, false])).toBe(true); // idx 0 -> D0
      expect(evaluateGate('MUX4', [false, false, true, false, false, true])).toBe(true); // idx 2 -> D2
      expect(evaluateGate('MUX4', [true, true, true, false, true, true])).toBe(false); // idx 3 -> D3 low
    });

    it('MUX8 decodes all three select lines (S2 included)', () => {
      const data = (idx) => Array.from({ length: 8 }, (_, i) => i === idx);
      // select value 5 -> S0=1, S1=0, S2=1 ; value 7 -> S0=1, S1=1, S2=1
      const sel5 = [true, false, true];
      const sel7 = [true, true, true];

      expect(evaluateGate('MUX8', [...data(5), ...sel5])).toBe(true);
      expect(evaluateGate('MUX8', [...data(3), ...sel5])).toBe(false);
      expect(evaluateGate('MUX8', [...data(7), ...sel7])).toBe(true);
    });
  });

  describe('AOI / OAI families', () => {
    it('AOI21 = NOT((A AND B) OR C)', () => {
      expect(evaluateGate('AOI21', [true, true, false])).toBe(false);
      expect(evaluateGate('AOI21', [false, false, false])).toBe(true);
      expect(evaluateGate('AOI21', [false, false, true])).toBe(false);
    });

    it('OAI21 = NOT((A OR B) AND C)', () => {
      expect(evaluateGate('OAI21', [false, false, true])).toBe(true);
      expect(evaluateGate('OAI21', [true, false, true])).toBe(false);
      expect(evaluateGate('OAI21', [true, true, false])).toBe(true);
    });

    it('AOI22 / OAI22', () => {
      // AOI22 = NOT((A&B) | (C&D) | E)
      expect(evaluateGate('AOI22', [true, true, false, false, false])).toBe(false);
      expect(evaluateGate('AOI22', [false, false, false, false, false])).toBe(true);
      // OAI22 = NOT((A|B) & (C|D) & E)
      expect(evaluateGate('OAI22', [true, false, true, false, true])).toBe(false);
      expect(evaluateGate('OAI22', [false, false, false, false, true])).toBe(true);
    });

    it('AOI31 / OAI31', () => {
      // AOI31 = NOT((A&B&C) | D)
      expect(evaluateGate('AOI31', [true, true, true, false])).toBe(false);
      expect(evaluateGate('AOI31', [false, false, false, false])).toBe(true);
      // OAI31 = NOT((A|B|C) & D)
      expect(evaluateGate('OAI31', [false, false, false, true])).toBe(true);
      expect(evaluateGate('OAI31', [true, false, false, true])).toBe(false);
    });

    it('AOI32 / OAI32', () => {
      // AOI32 = NOT((A&B&C) | (D&E))
      expect(evaluateGate('AOI32', [true, true, true, false, false])).toBe(false);
      expect(evaluateGate('AOI32', [false, false, false, true, true])).toBe(false);
      expect(evaluateGate('AOI32', [false, false, false, false, false])).toBe(true);
      // OAI32 = NOT((A|B|C) & (D|E))
      expect(evaluateGate('OAI32', [true, false, false, false, false])).toBe(true);
      expect(evaluateGate('OAI32', [true, false, false, true, false])).toBe(false);
    });

    it('AOI33 / OAI33', () => {
      // AOI33 = NOT((A&B&C) | (D&E&F))
      expect(evaluateGate('AOI33', [true, true, true, false, false, false])).toBe(false);
      expect(evaluateGate('AOI33', [false, false, false, true, true, true])).toBe(false);
      expect(evaluateGate('AOI33', [true, false, false, true, false, true])).toBe(true);
      // OAI33 = NOT((A|B|C) & (D|E|F))
      expect(evaluateGate('OAI33', [false, false, false, false, false, false])).toBe(true);
      expect(evaluateGate('OAI33', [true, false, false, true, false, false])).toBe(false);
    });
  });

  describe('arithmetic / decision gates', () => {
    it('MAJ3/MAJ4/MAJ5 use their documented majority thresholds', () => {
      expect(evaluateGate('MAJ3', [true, true, false])).toBe(true);
      expect(evaluateGate('MAJ3', [true, false, false])).toBe(false);
      expect(evaluateGate('MAJ4', [true, true, true, false])).toBe(true);
      expect(evaluateGate('MAJ4', [true, true, false, false])).toBe(false);
      expect(evaluateGate('MAJ5', [true, true, true, false, false])).toBe(true);
      expect(evaluateGate('MAJ5', [true, true, false, false, false])).toBe(false);
    });

    it('EQ2/EQ3 test for equality', () => {
      expect(evaluateGate('EQ2', [true, true])).toBe(true);
      expect(evaluateGate('EQ2', [true, false])).toBe(false);
      expect(evaluateGate('EQ3', [true, true, true])).toBe(true);
      expect(evaluateGate('EQ3', [true, true, false])).toBe(false);
    });
  });

  it('unknown gate types evaluate LOW instead of throwing', () => {
    expect(evaluateGate('BOGUS', [true, true])).toBe(false);
    expect(evaluateGate(undefined, [true])).toBe(false);
  });
});

describe('services/simulation · simulateCircuit', () => {
  it('propagates INPUT values through a combinational chain', () => {
    const nodes = [
      node('in1', 'INPUT', { value: true }),
      node('in2', 'INPUT', { value: true }),
      node('and', 'AND', { inputCount: 2 }),
      node('out', 'OUTPUT', { inputCount: 1 }),
    ];
    const edges = [
      edge('in1', 'and', 'input-0'),
      edge('in2', 'and', 'input-1'),
      edge('and', 'out', 'input-0'),
    ];

    const { outputs, values, nodes: resultNodes } = simulateCircuit(nodes, edges);

    expect(outputs.out).toBe(true);
    expect(values.and).toBe(true);
    expect(resultNodes.find((n) => n.id === 'out').data.value).toBe(true);
  });

  it('honours the target pin index encoded in the handle id', () => {
    // D0 -> input-0 (TRUE), D1 -> input-1 (FALSE), S0 -> input-2 (TRUE).
    const nodes = [
      node('d0', 'INPUT', { value: true }),
      node('d1', 'INPUT', { value: false }),
      node('s0', 'INPUT', { value: true }),
      node('mux', 'MUX2', { inputCount: 3 }),
      node('out', 'OUTPUT', { inputCount: 1 }),
    ];
    const edges = [
      edge('d0', 'mux', 'input-0'),
      edge('d1', 'mux', 'input-1'),
      edge('s0', 'mux', 'input-2'),
      edge('mux', 'out', 'input-0'),
    ];

    const { outputs } = simulateCircuit(nodes, edges);
    // S0 high selects D1, which is low.
    expect(outputs.out).toBe(false);
  });

  it('treats unconnected pins as LOW', () => {
    const nodes = [
      node('in1', 'INPUT', { value: true }),
      node('and', 'AND', { inputCount: 2 }), // only input-0 is wired
      node('out', 'OUTPUT', { inputCount: 1 }),
    ];
    const edges = [edge('in1', 'and', 'input-0'), edge('and', 'out', 'input-0')];

    const { outputs } = simulateCircuit(nodes, edges);
    expect(outputs.out).toBe(false);
  });

  it('reads the declared inputCount from node data', () => {
    const nodes = [
      node('a', 'INPUT', { value: true }),
      node('b', 'INPUT', { value: false }),
      node('and', 'AND', { inputCount: 4 }), // widened -> unconnected pins stay LOW
      node('out', 'OUTPUT', { inputCount: 1 }),
    ];
    const edges = [
      edge('a', 'and', 'input-0'),
      edge('b', 'and', 'input-1'),
      edge('and', 'out', 'input-0'),
    ];

    const { values } = simulateCircuit(nodes, edges);
    expect(values.and).toBe(false);
  });

  it('falls back to the constant pin count when data.inputCount is missing', () => {
    const nodes = [
      node('a', 'INPUT', { value: true }),
      node('b', 'INPUT', { value: true }),
      node('and', 'AND'), // no inputCount -> AND default is 2
      node('out', 'OUTPUT', { inputCount: 1 }),
    ];
    const edges = [
      edge('a', 'and', 'input-0'),
      edge('b', 'and', 'input-1'),
      edge('and', 'out', 'input-0'),
    ];

    const { outputs } = simulateCircuit(nodes, edges);
    expect(outputs.out).toBe(true);
  });

  it('stabilises a feedback loop rather than hanging', () => {
    // NOT wired back into itself: deliberately oscillating. The bounded
    // fixed-point loop must terminate and return a boolean.
    const nodes = [node('a', 'NOT', { inputCount: 1 }), node('out', 'OUTPUT', { inputCount: 1 })];
    const edges = [edge('a', 'a', 'input-0'), edge('a', 'out', 'input-0')];

    const { outputs } = simulateCircuit(nodes, edges);
    expect(typeof outputs.out).toBe('boolean');
  });

  it('produces an outputs entry only for OUTPUT gates', () => {
    const nodes = [node('in1', 'INPUT', { value: true }), node('not', 'NOT', { inputCount: 1 })];
    const { outputs, values } = simulateCircuit(nodes, [edge('in1', 'not', 'input-0')]);
    expect(outputs).toEqual({});
    expect(values.not).toBe(false); // NOT(true)
  });

  it('ignores edges that reference missing nodes', () => {
    const nodes = [
      node('in1', 'INPUT', { value: true }),
      node('out', 'OUTPUT', { inputCount: 1 }),
    ];
    const edges = [edge('ghost', 'out', 'input-0'), edge('in1', 'out', 'input-0')];
    const { outputs } = simulateCircuit(nodes, edges);
    expect(outputs.out).toBe(true);
  });

  it('handles empty input safely', () => {
    expect(simulateCircuit()).toEqual({ nodes: [], outputs: {}, values: {} });
  });
});
