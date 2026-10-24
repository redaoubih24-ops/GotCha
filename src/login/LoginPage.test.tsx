import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { forgotPasswordLines, lineForAttempt } from './copy';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('accepts any input, never passes it on, and clears the fields on submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LoginPage onSubmit={onSubmit} />);

    const username = screen.getByLabelText('Username');
    const password = screen.getByLabelText('Password');
    await user.type(username, 'definitely-a-human');
    await user.type(password, 'hunter2');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith();
    expect(username).toHaveValue('');
    expect(password).toHaveValue('');
    expect(password).toHaveAttribute('type', 'password');
  });

  it('lets an empty form through too', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LoginPage onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('cycles through unhelpful password advice', async () => {
    const user = userEvent.setup();
    render(<LoginPage onSubmit={vi.fn()} />);
    const forgot = screen.getByRole('button', { name: /forgot password/i });

    await user.click(forgot);
    expect(screen.getByText(forgotPasswordLines[0])).toBeInTheDocument();
    await user.click(forgot);
    expect(screen.getByText(forgotPasswordLines[1])).toBeInTheDocument();
    expect(screen.queryByText(forgotPasswordLines[0])).not.toBeInTheDocument();
  });

  it('escalates its microcopy with the attempt count', () => {
    const { rerender } = render(<LoginPage onSubmit={vi.fn()} attemptCount={0} />);
    expect(screen.queryByText(/still here\?/i)).not.toBeInTheDocument();

    rerender(<LoginPage onSubmit={vi.fn()} attemptCount={3} />);
    expect(screen.getByText('Still here?')).toBeInTheDocument();

    rerender(<LoginPage onSubmit={vi.fn()} attemptCount={7} />);
    expect(screen.getByText('We’ve notified your mother.')).toBeInTheDocument();
  });
});

describe('lineForAttempt', () => {
  it('picks the highest line earned, regardless of array order', () => {
    const lines = [
      { from: 5, text: 'five' },
      { from: 1, text: 'one' },
      { from: 3, text: 'three' },
    ];
    expect(lineForAttempt(0, lines)).toBeUndefined();
    expect(lineForAttempt(2, lines)).toBe('one');
    expect(lineForAttempt(4, lines)).toBe('three');
    expect(lineForAttempt(99, lines)).toBe('five');
  });
});
