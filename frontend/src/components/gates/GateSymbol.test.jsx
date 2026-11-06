import { describe, it, expect } from 'vitest';
import { renderWithTheme } from '../../test-utils/renderWithTheme';
import { GATE_TYPES } from '../../utils/gates';
import GateSymbol from './GateSymbol';

const renderSymbol = (type) => renderWithTheme(<GateSymbol type={type} />).container;

describe('components/gates/GateSymbol', () => {
  it('renders an svg for each known gate type without crashing', () => {
    for (const type of GATE_TYPES) {
      const container = renderSymbol(type);
      expect(container.querySelector('svg.lgs-gate-symbol')).toBeInTheDocument();
    }
  });

  it('draws an inverted-gate bubble only for inverting gates', () => {
    expect(renderSymbol('NAND').querySelector('.lgs-sym-bubble')).toBeInTheDocument();
    expect(renderSymbol('NOR').querySelector('.lgs-sym-bubble')).toBeInTheDocument();
    expect(renderSymbol('AND').querySelector('.lgs-sym-bubble')).toBeNull();
    expect(renderSymbol('OR').querySelector('.lgs-sym-bubble')).toBeNull();
  });

  it('annotates multi-input gates with their arity', () => {
    expect(renderSymbol('AND3').querySelector('.lgs-sym-arity')?.textContent).toBe('3');
    expect(renderSymbol('XOR4').querySelector('.lgs-sym-arity')?.textContent).toBe('4');
  });

  it('renders the MUX data count and the AOI label', () => {
    expect(renderSymbol('MUX4').querySelector('.lgs-sym-arity')?.textContent).toBe('M4');
    expect(renderSymbol('AOI21').querySelector('.lgs-sym-arity')?.textContent).toBe('AOI 21');
  });

  it('renders a majority threshold marker', () => {
    // MAJ3 -> "≥2"
    expect(renderSymbol('MAJ3').querySelector('.lgs-sym-arity')?.textContent).toBe('≥2');
  });

  it('falls back to the AND shape for an unknown/missing type', () => {
    const container = renderSymbol('WAT');
    expect(container.querySelector('svg.lgs-gate-symbol')).toBeInTheDocument();
  });
});
