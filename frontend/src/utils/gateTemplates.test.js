import { describe, it, expect } from 'vitest';
import { GATE_TEMPLATES, getGateTemplate } from './gateTemplates';
import { GATE_INPUT_COUNTS, GATE_TYPES, gateShortLabel } from './gates';

describe('utils/gateTemplates', () => {
  it('provides a template for every gate type', () => {
    expect(Object.keys(GATE_TEMPLATES).sort()).toEqual([...GATE_TYPES].sort());
  });

  it('stores the gate type on both the node and its data (required by the canvas)', () => {
    for (const type of GATE_TYPES) {
      const template = GATE_TEMPLATES[type];
      expect(template.type).toBe(type);
      expect(template.data.type).toBe(type);
    }
  });

  it('seeds inputCount from the constants and a short label', () => {
    for (const type of GATE_TYPES) {
      const template = GATE_TEMPLATES[type];
      expect(template.data.inputCount).toBe(GATE_INPUT_COUNTS[type]);
      expect(template.data.label).toBe(gateShortLabel(type));
    }
  });

  it('starts every gate at a LOW value', () => {
    for (const type of GATE_TYPES) {
      expect(GATE_TEMPLATES[type].data.value).toBe(false);
    }
  });

  it('getGateTemplate resolves by type and is undefined for unknown types', () => {
    expect(getGateTemplate('AND')).toBe(GATE_TEMPLATES.AND);
    expect(getGateTemplate('WAT')).toBeUndefined();
  });
});
