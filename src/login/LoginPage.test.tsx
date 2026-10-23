import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('uses read-only fake credentials and launches a challenge without collecting input', () => {
    const onSubmit = vi.fn();
    render(<LoginPage onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('readonly');
    expect(screen.getByLabelText(/extremely secure password/i)).toHaveAttribute('readonly');
    expect(screen.getByText(/no real account/i)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /let’s prove it/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
