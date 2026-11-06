import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test-utils/renderWithTheme';
import EmptyState from './EmptyState';

describe('components/circuit/EmptyState', () => {
  const baseProps = {
    icon: <span data-testid="icon">★</span>,
    title: 'No circuits yet',
    description: 'Create your first circuit to get started.',
  };

  it('renders the title, description and icon', () => {
    renderWithTheme(<EmptyState {...baseProps} />);
    expect(screen.getByText('No circuits yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first circuit to get started.')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('omits the action button when no label/handler is given', () => {
    renderWithTheme(<EmptyState {...baseProps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('fires onAction when the action button is clicked', async () => {
    const onAction = vi.fn();
    renderWithTheme(<EmptyState {...baseProps} actionLabel="New circuit" onAction={onAction} />);

    await userEvent.click(screen.getByRole('button', { name: 'New circuit' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders correctly in dark mode', () => {
    renderWithTheme(<EmptyState {...baseProps} />, { mode: 'dark' });
    expect(screen.getByText('No circuits yet')).toBeInTheDocument();
  });
});
