import { describe, it, expect } from 'vitest';
import { serializeNodes, serializeEdges, deserializeNode } from './circuit';
import { GATE_INPUT_COUNTS } from './gates';

describe('utils/circuit', () => {
  describe('serializeNodes', () => {
    it('maps a React Flow node to the persisted API shape', () => {
      const [out] = serializeNodes([
        {
          id: 'n1',
          position: { x: 12.7, y: 40.2 },
          data: { type: 'AND', label: 'AND', value: true, inputCount: 2 },
        },
      ]);

      expect(out).toEqual({
        id: 'n1',
        type: 'AND',
        position: { x: 13, y: 40 }, // rounded
        data: { label: 'AND', value: true, inputCount: 2 },
      });
    });

    it('applies safe defaults for missing fields', () => {
      const [out] = serializeNodes([{ id: 'x', position: { x: 0, y: 0 }, data: undefined }]);
      expect(out.data).toEqual({ label: '', value: false, inputCount: 0 });
      expect(out.type).toBeUndefined();
    });

    it('returns an empty array for empty/undefined input', () => {
      expect(serializeNodes()).toEqual([]);
      expect(serializeNodes([])).toEqual([]);
    });
  });

  describe('serializeEdges', () => {
    it('defaults the handles when they are omitted', () => {
      const [out] = serializeEdges([{ id: 'e1', source: 'a', target: 'b' }]);
      expect(out).toEqual({
        id: 'e1',
        source: 'a',
        sourceHandle: 'output-0',
        target: 'b',
        targetHandle: 'input-0',
      });
    });

    it('preserves explicit handles', () => {
      const [out] = serializeEdges([
        { id: 'e1', source: 'a', sourceHandle: 'output-0', target: 'b', targetHandle: 'input-2' },
      ]);
      expect(out.targetHandle).toBe('input-2');
    });
  });

  describe('deserializeNode', () => {
    it('rebuilds a React Flow node with the generic renderer key', () => {
      const node = deserializeNode({
        id: 'n1',
        type: 'AND',
        position: { x: 5, y: 5 },
        data: { label: 'AND', value: true, inputCount: 3 },
      });

      expect(node).toEqual({
        id: 'n1',
        type: 'logicGate',
        position: { x: 5, y: 5 },
        data: { label: 'AND', value: true, inputCount: 3, type: 'AND' },
      });
    });

    it('backfills inputCount from the gate constants when missing', () => {
      const node = deserializeNode({ id: 'n1', type: 'MUX8', data: {} });
      expect(node.data.inputCount).toBe(GATE_INPUT_COUNTS.MUX8);
    });

    it('defaults the position when none is stored', () => {
      const node = deserializeNode({ id: 'n1', type: 'NOT', data: {} });
      expect(node.position).toEqual({ x: 0, y: 0 });
    });

    it('applies the optional decorate callback', () => {
      const decorated = deserializeNode({ id: 'n1', type: 'AND', data: {} }, (base) => ({
        ...base,
        selected: true,
      }));
      expect(decorated.selected).toBe(true);
    });
  });
});
