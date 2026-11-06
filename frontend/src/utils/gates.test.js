import { describe, it, expect } from 'vitest';
import {
  GATE_TYPES,
  GATE_INPUT_COUNTS,
  GATE_FAMILY,
  buildPinLabels,
  getGateFamily,
  isInverted,
  getGateAccent,
  GATE_ACCENT,
  GATE_CATEGORIES,
  TOTAL_GATE_COUNT,
  gateShortLabel,
} from './gates';

describe('utils/gates', () => {
  it('derives GATE_TYPES from the input-count map with no duplicates', () => {
    expect(GATE_TYPES).toEqual(Object.keys(GATE_INPUT_COUNTS));
    expect(new Set(GATE_TYPES).size).toBe(GATE_TYPES.length);
    expect(Object.isFrozen(GATE_TYPES)).toBe(true);
  });

  describe('buildPinLabels', () => {
    it('labels everyday gates A, B, C…', () => {
      expect(buildPinLabels('AND')).toEqual({ inputs: ['A', 'B'], output: 'Y' });
      expect(buildPinLabels('AND5')).toEqual({
        inputs: ['A', 'B', 'C', 'D', 'E'],
        output: 'Y',
      });
    });

    it('labels multiplexers data-first then select (D0…S0…)', () => {
      expect(buildPinLabels('MUX2')).toEqual({ inputs: ['D0', 'D1', 'S0'], output: 'Y' });
      expect(buildPinLabels('MUX4')).toEqual({
        inputs: ['D0', 'D1', 'D2', 'D3', 'S0', 'S1'],
        output: 'Y',
      });
      expect(buildPinLabels('MUX8').inputs).toEqual([
        'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'S0', 'S1', 'S2',
      ]);
    });

    it('produces exactly one label per declared input pin', () => {
      for (const type of GATE_TYPES) {
        if (type === 'INPUT') continue; // no input pins
        expect(buildPinLabels(type).inputs).toHaveLength(GATE_INPUT_COUNTS[type]);
      }
    });
  });

  describe('getGateFamily', () => {
    it.each([
      ['INPUT', GATE_FAMILY.IO],
      ['OUTPUT', GATE_FAMILY.IO],
      ['BUFFER', GATE_FAMILY.BUFFER],
      ['NOT', GATE_FAMILY.NOT],
      ['TRISTATE', GATE_FAMILY.TRISTATE],
      ['AND3', GATE_FAMILY.AND],
      ['NAND', GATE_FAMILY.AND],
      ['OR4', GATE_FAMILY.OR],
      ['NOR', GATE_FAMILY.OR],
      ['XOR5', GATE_FAMILY.XOR],
      ['XNOR', GATE_FAMILY.XOR],
      ['MUX8', GATE_FAMILY.MUX],
      ['AOI21', GATE_FAMILY.AOI],
      ['OAI33', GATE_FAMILY.AOI],
      ['MAJ3', GATE_FAMILY.MAJORITY],
      ['EQ2', GATE_FAMILY.EQUALITY],
    ])('%s -> %s', (type, family) => {
      expect(getGateFamily(type)).toBe(family);
    });

    it('falls back to the AND family for unknown/missing types', () => {
      expect(getGateFamily('WAT')).toBe(GATE_FAMILY.AND);
      expect(getGateFamily(undefined)).toBe(GATE_FAMILY.AND);
      expect(getGateFamily('')).toBe(GATE_FAMILY.AND);
      expect(getGateFamily(null)).toBe(GATE_FAMILY.AND);
    });
  });

  describe('isInverted', () => {
    it('flags inverting gates', () => {
      for (const type of ['NOT', 'NAND', 'NOR', 'XNOR', 'NAND3', 'NOR5', 'XNOR4']) {
        expect(isInverted(type)).toBe(true);
      }
    });

    it('treats AOI/OAI as inverted but not AND/OR/XOR', () => {
      expect(isInverted('AOI22')).toBe(true);
      expect(isInverted('OAI31')).toBe(true);
      expect(isInverted('AND')).toBe(false);
      expect(isInverted('OR')).toBe(false);
      expect(isInverted('XOR')).toBe(false);
      expect(isInverted(undefined)).toBe(false);
    });
  });

  describe('accents', () => {
    it('maps every gate type to a hex colour', () => {
      for (const type of GATE_TYPES) {
        expect(GATE_ACCENT[type]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('defaults an unknown type to the AND accent', () => {
      expect(getGateAccent('WAT')).toBe(getGateAccent('AND'));
    });
  });

  describe('palette', () => {
    it('lists every gate exactly once across categories', () => {
      const listed = GATE_CATEGORIES.flatMap((c) => c.gates.map((g) => g.type));
      expect(listed).toHaveLength(TOTAL_GATE_COUNT);
      expect(new Set(listed).size).toBe(listed.length); // no duplicates
      for (const type of listed) {
        expect(GATE_TYPES).toContain(type);
      }
    });

    it('covers the full gate library', () => {
      const listed = new Set(GATE_CATEGORIES.flatMap((c) => c.gates.map((g) => g.type)));
      for (const type of GATE_TYPES) {
        expect(listed.has(type)).toBe(true);
      }
    });
  });

  describe('gateShortLabel', () => {
    it('shortens the special gate names only', () => {
      expect(gateShortLabel('BUFFER')).toBe('BUF');
      expect(gateShortLabel('TRISTATE')).toBe('TS');
      expect(gateShortLabel('INPUT')).toBe('IN');
      expect(gateShortLabel('OUTPUT')).toBe('OUT');
    });

    it('passes through everything else unchanged', () => {
      expect(gateShortLabel('AND')).toBe('AND');
      expect(gateShortLabel('MUX8')).toBe('MUX8');
    });
  });
});
