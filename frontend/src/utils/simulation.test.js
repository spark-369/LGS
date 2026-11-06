import { describe, it, expect } from 'vitest';
import { evaluateGate, simulateCircuit } from './simulation';

const node = (id, type, data = {}) => ({ id, type, data });
const edge = (source, target, targetHandle = 'input-0', sourceHandle = 'output-0') => ({
  id: `${source}->${target}:${targetHandle}`,
  source,
  target,
  sourceHandle,
  targetHandle,
});

describe('utils/simulation · evaluateGate truth tables', () => {
  it('evaluates the primitive gates', () => {
    expect(evaluateGate('AND', [true, true])).toBe(true);
    expect(evaluateGate('AND', [true, false])).toBe(false);
    expect(evaluateGate('NAND', [true, true])).toBe(false);
    expect(evaluateGate('OR', [false, false])).toBe(false);
    expect(evaluateGate('NOR', [false, false])).toBe(true);
    expect(evaluateGate('XOR', [true, false])).toBe(true);
    expect(evaluateGate('XOR', [true, true])).toBe(false);
    expect(evaluateGate('XNOR', [true, true])).toBe(true);
    expect(evaluateGate('NOT', [true])).toBe(false);
    expect(evaluateGate('BUFFER', [true])).toBe(true);
  });

  it('evaluates the 3/4/5-input variants', () => {
    expect(evaluateGate('AND3', [true, true, true])).toBe(true);
    expect(evaluateGate('AND3', [true, true, false])).toBe(false);
    expect(evaluateGate('OR5', [false, false, false, false, true])).toBe(true);
    expect(evaluateGate('NAND3', [true, true, true])).toBe(false);
    expect(evaluateGate('NOR4', [false, false, false, false])).toBe(true);
    expect(evaluateGate('XOR3', [true, true, true])).toBe(true);
    expect(evaluateGate('XNOR5', [true, true, true, true, true])).toBe(false); // 5 highs -> odd parity
    expect(evaluateGate('XNOR5', [true, true, true, true, false])).toBe(true); // 4 highs -> even parity
  });

  it('evaluates the AOI/OAI families', () => {
    expect(evaluateGate('AOI21', [true, true, false])).toBe(false);
    expect(evaluateGate('OAI21', [false, false, true])).toBe(true);
    expect(evaluateGate('AOI22', [false, false, false, false, false])).toBe(true);
    expect(evaluateGate('OAI33', [true, false, false, true, false, false])).toBe(false);
  });

  it('evaluates the arithmetic / decision gates', () => {
    expect(evaluateGate('MAJ3', [true, true, false])).toBe(true);
    expect(evaluateGate('MAJ3', [true, false, false])).toBe(false);
    expect(evaluateGate('MAJ5', [true, true, true, false, false])).toBe(true);
    expect(evaluateGate('EQ2', [true, true])).toBe(true);
    expect(evaluateGate('EQ2', [true, false])).toBe(false);
    expect(evaluateGate('EQ3', [true, true, true])).toBe(true);
  });

  it('decodes the multiplexers (data-first, S0 = LSB)', () => {
    //                         D0     D1     S0
    expect(evaluateGate('MUX2', [true, false, false])).toBe(true);
    expect(evaluateGate('MUX2', [true, false, true])).toBe(false);

    //             D0     D1     D2     D3     S0     S1
    expect(evaluateGate('MUX4', [false, false, true, false, false, true])).toBe(true); // idx 2 -> D2
    expect(evaluateGate('MUX4', [true, true, true, false, true, true])).toBe(false); // idx 3 -> D3 low
  });

  it('decodes MUX8 using all three select lines (S2 regression guard)', () => {
    const data = (idx) => Array.from({ length: 8 }, (_, i) => i === idx);
    const sel5 = [true, false, true]; // 1 + 0*2 + 1*4 = 5
    const sel7 = [true, true, true]; // 7

    expect(evaluateGate('MUX8', [...data(5), ...sel5])).toBe(true);
    expect(evaluateGate('MUX8', [...data(3), ...sel5])).toBe(false);
    expect(evaluateGate('MUX8', [...data(7), ...sel7])).toBe(true);
  });

  it('returns false for unknown gate types', () => {
    expect(evaluateGate('BOGUS', [true])).toBe(false);
    expect(evaluateGate(undefined, [true])).toBe(false);
  });
});

describe('utils/simulation · simulateCircuit', () => {
  it('propagates inputs through a combinational chain', () => {
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

    const { outputs, values } = simulateCircuit(nodes, edges);
    expect(outputs.out).toBe(true);
    expect(values.and).toBe(true);
  });

  it('maps the target handle index to the input pin', () => {
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

    // S0 high -> select D1 (low)
    expect(simulateCircuit(nodes, edges).outputs.out).toBe(false);
  });

  it('treats unconnected pins as LOW', () => {
    const nodes = [
      node('in1', 'INPUT', { value: true }),
      node('and', 'AND', { inputCount: 2 }),
      node('out', 'OUTPUT', { inputCount: 1 }),
    ];
    const edges = [edge('in1', 'and', 'input-0'), edge('and', 'out', 'input-0')];
    expect(simulateCircuit(nodes, edges).outputs.out).toBe(false);
  });

  it('omits non-OUTPUT gates from the outputs map', () => {
    const nodes = [node('in1', 'INPUT', { value: true }), node('not', 'NOT', { inputCount: 1 })];
    const { outputs, values } = simulateCircuit(nodes, [edge('in1', 'not', 'input-0')]);
    expect(outputs).toEqual({});
    expect(values.not).toBe(false);
  });

  it('terminates on a feedback loop', () => {
    const nodes = [node('a', 'NOT', { inputCount: 1 }), node('out', 'OUTPUT', { inputCount: 1 })];
    const edges = [edge('a', 'a', 'input-0'), edge('a', 'out', 'input-0')];
    expect(typeof simulateCircuit(nodes, edges).outputs.out).toBe('boolean');
  });

  it('handles empty input safely', () => {
    expect(simulateCircuit()).toEqual({ nodes: [], outputs: {}, values: {} });
  });
});
