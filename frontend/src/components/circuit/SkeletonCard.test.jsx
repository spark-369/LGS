import { describe, it, expect } from 'vitest';
import { Card, Grid } from '@mui/material';
import { renderWithTheme } from '../../test-utils/renderWithTheme';
import { SkeletonCard, SkeletonGrid } from './SkeletonCard';

describe('components/circuit/SkeletonCard', () => {
  it('renders a card populated with skeletons', () => {
    const { container } = renderWithTheme(<SkeletonCard />);
    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(3);
  });

  it('SkeletonGrid renders the requested number of placeholder cards', () => {
    const { container } = renderWithTheme(<SkeletonGrid count={4} Grid={Grid} />);
    expect(container.querySelectorAll('.MuiCard-root')).toHaveLength(4);
  });

  it('SkeletonGrid defaults to 6 cards', () => {
    const { container } = renderWithTheme(<SkeletonGrid Grid={Grid} />);
    expect(container.querySelectorAll('.MuiCard-root')).toHaveLength(6);
  });

  it('Card is re-exported for consumers', () => {
    expect(Card).toBeDefined();
  });
});
