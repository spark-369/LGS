import { describe, it, expect } from '@jest/globals';
import {
  GATE_TYPES,
  GATE_INPUT_COUNTS,
  MUX_DATA_PINS,
  MUX_SELECT_PINS,
  MAX_NODES_PER_CIRCUIT,
  MAX_EDGES_PER_CIRCUIT,
  DEFAULT_SOURCE_HANDLE,
  DEFAULT_TARGET_HANDLE,
  isValidGateType,
  inputCountFor,
} from '../../src/constants/gates.js';

describe('constants/gates', () => {
  it('exposes a frozen, non-empty gate list', () => {
    expect(Object.isFrozen(GATE_TYPES)).toBe(true);
    expect(GATE_TYPES.length).toBeGreaterThan(40);
  });

  it('defines an input count for every declared gate type', () => {
    for (const type of GATE_TYPES) {
      expect(GATE_INPUT_COUNTS[type]).toBeDefined();
      expect(Number.isFinite(GATE_INPUT_COUNTS[type])).toBe(true);
    }
  });

  it('has no duplicate gate types', () => {
    expect(new Set(GATE_TYPES).size).toBe(GATE_TYPES.length);
  });

  describe('isValidGateType', () => {
    it('accepts known types', () => {
      expect(isValidGateType('AND')).toBe(true);
      expect(isValidGateType('MUX8')).toBe(true);
      expect(isValidGateType('INPUT')).toBe(true);
    });

    it('rejects unknown / malformed types', () => {
      expect(isValidGateType('and')).toBe(false); // case-sensitive
      expect(isValidGateType('NAND9')).toBe(false);
      expect(isValidGateType('')).toBe(false);
      expect(isValidGateType(undefined)).toBe(false);
      expect(isValidGateType(null)).toBe(false);
    });
  });

  describe('inputCountFor', () => {
    it('returns the declared pin count', () => {
      expect(inputCountFor('AND')).toBe(2);
      expect(inputCountFor('AND5')).toBe(5);
      expect(inputCountFor('INPUT')).toBe(0);
    });

    it('falls back to 1 for unknown types', () => {
      expect(inputCountFor('WAT')).toBe(1);
      expect(inputCountFor(undefined)).toBe(1);
    });
  });

  describe('multiplexer pin layout (data-first, then select)', () => {
    it('keeps the documented MUX8 11-pin layout', () => {
      // Regression guard: MUX8 was previously (wrongly) 10 pins, which pushed
      // S2 outside the input array and broke every selection.
      expect(GATE_INPUT_COUNTS.MUX8).toBe(11);
      expect(MUX_DATA_PINS.MUX8 + MUX_SELECT_PINS.MUX8).toBe(GATE_INPUT_COUNTS.MUX8);
    });

    it.each([
      ['MUX2', 2, 1],
      ['MUX4', 4, 2],
      ['MUX8', 8, 3],
    ])('%s sums data (%i) + select (%i)', (type, data, select) => {
      expect(MUX_DATA_PINS[type]).toBe(data);
      expect(MUX_SELECT_PINS[type]).toBe(select);
      expect(GATE_INPUT_COUNTS[type]).toBe(data + select);
    });
  });

  it('exposes sane limits and default handles', () => {
    expect(MAX_NODES_PER_CIRCUIT).toBeGreaterThan(0);
    expect(MAX_EDGES_PER_CIRCUIT).toBeGreaterThan(MAX_NODES_PER_CIRCUIT);
    expect(DEFAULT_SOURCE_HANDLE).toBe('output-0');
    expect(DEFAULT_TARGET_HANDLE).toBe('input-0');
  });
});
