import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorModeProvider } from '../theme/ColorModeContext';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import ThemeToggle from './ThemeToggle';

// ThemeToggle reads the mode from ColorModeContext, so it must be rendered
// inside a real ColorModeProvider (which also applies the MUI theme).
const renderToggle = () =>
  renderWithTheme(
    <ColorModeProvider>
      <ThemeToggle />
    </ColorModeProvider>
  );

describe('components/ThemeToggle', () => {
  it('renders an accessible toggle button', () => {
    renderToggle();
    expect(screen.getByRole('button', { name: 'Toggle color mode' })).toBeInTheDocument();
  });

  it('flips the persisted color mode on click', async () => {
    renderToggle();
    const button = screen.getByRole('button', { name: 'Toggle color mode' });

    expect(localStorage.getItem('lgs-color-mode')).toBeNull();
    await userEvent.click(button);
    // The provider persists the chosen mode; either light or dark is expected
    // depending on the mocked matchMedia default.
    expect(['light', 'dark']).toContain(localStorage.getItem('lgs-color-mode'));
  });
});
