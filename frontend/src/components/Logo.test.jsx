import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../test-utils/renderWithTheme';
import Logo from './Logo';

describe('components/Logo', () => {
  it('renders the brand wordmark', () => {
    renderWithTheme(<Logo />);
    // The wordmark is split across two adjacent nodes ("Logic_Gate" + "Simulator").
    expect(screen.getByText(/Logic_Gate/)).toBeInTheDocument();
    expect(screen.getAllByText(/Simulator/).length).toBeGreaterThan(0);
  });

  it('hides the wordmark when showText is false', () => {
    renderWithTheme(<Logo showText={false} />);
    expect(screen.queryByText(/Logic_Gate/)).not.toBeInTheDocument();
  });

  it('renders without crashing at every supported size', () => {
    for (const size of ['small', 'medium', 'large']) {
      const { unmount } = renderWithTheme(<Logo size={size} />);
      expect(screen.getByText(/Logic_Gate/)).toBeInTheDocument();
      unmount();
    }
  });
});
