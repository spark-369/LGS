import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test-utils/renderWithTheme';
import LoadingScreen from './LoadingScreen';

describe('components/common/LoadingScreen', () => {
  it('renders the default label', () => {
    renderWithTheme(<LoadingScreen />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders a custom label', () => {
    renderWithTheme(<LoadingScreen label="Restoring your session…" />);
    expect(screen.getByText('Restoring your session…')).toBeInTheDocument();
  });

  it('renders a progress indicator', () => {
    const { container } = renderWithTheme(<LoadingScreen />);
    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });
});
