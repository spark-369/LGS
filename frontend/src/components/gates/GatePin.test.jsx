import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test-utils/renderWithTheme';

// GatePin's only external dependency is React Flow's <Handle>/<Position>, which
// need the flow store to render. Mocking them keeps this a focused unit test
// that still verifies the exact handle contract (id, type, position).
vi.mock('@xyflow/react', () => ({
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
  Handle: ({ id, type, position }) => (
    <div data-testid="handle" data-handleid={id} data-handletype={type} data-position={position} />
  ),
}));

const { default: GatePin } = await import('./GatePin');

describe('components/gates/GatePin', () => {
  it('renders the pin label', () => {
    renderWithTheme(<GatePin index={0} label="A" accent="#2563eb" isDark={false} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('exposes a target handle keyed by the pin index', () => {
    renderWithTheme(<GatePin index={2} label="S0" accent="#0ea5e9" isDark={false} />);
    const handle = screen.getByTestId('handle');
    expect(handle).toHaveAttribute('data-handleid', 'input-2');
    expect(handle).toHaveAttribute('data-handletype', 'target');
    expect(handle).toHaveAttribute('data-position', 'left');
  });

  it('renders the label for a signal-high pin in dark mode', () => {
    renderWithTheme(<GatePin index={0} label="D0" accent="#16a34a" isDark signal />);
    expect(screen.getByText('D0')).toBeInTheDocument();
  });
});

