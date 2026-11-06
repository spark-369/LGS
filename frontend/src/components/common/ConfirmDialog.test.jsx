import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test-utils/renderWithTheme';
import ConfirmDialog from './ConfirmDialog';

describe('components/common/ConfirmDialog', () => {
  const baseProps = {
    open: true,
    title: 'Delete circuit?',
    message: 'This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  };

  it('renders the title, message and action buttons when open', () => {
    renderWithTheme(<ConfirmDialog {...baseProps} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('Delete circuit?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('invokes onConfirm when the confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    renderWithTheme(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('invokes onCancel when the cancel button is clicked', async () => {
    const onCancel = vi.fn();
    renderWithTheme(<ConfirmDialog {...baseProps} onConfirm={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while loading', () => {
    renderWithTheme(
      <ConfirmDialog {...baseProps} loading onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('renders nothing visible when closed', () => {
    renderWithTheme(
      <ConfirmDialog {...baseProps} open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.queryByText('Delete circuit?')).not.toBeInTheDocument();
  });
});
