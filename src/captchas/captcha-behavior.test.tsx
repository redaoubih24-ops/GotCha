import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import handshakeCaptcha from './stable-handshake';
import termsCaptcha from './terms-and-conditions';

describe('starter CAPTCHA interactions', () => {
  it('fails the human checkbox and completes only once', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const Captcha = handshakeCaptcha.Component;
    render(<Captcha onComplete={onComplete} />);

    const checkbox = screen.getByRole('checkbox', { name: /perfectly normal human/i });
    await user.click(checkbox);
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(checkbox).toBeDisabled();
    expect(onComplete).toHaveBeenCalledExactlyOnceWith({
      outcome: 'fail',
      reason: expect.stringContaining('suspiciously accurate'),
      memeTag: 'robot',
    });
  });

  it('requires agreement before failing, then completes only once', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const Captcha = termsCaptcha.Component;
    render(<Captcha onComplete={onComplete} />);

    const submit = screen.getByRole('button', { name: /agree to absolutely everything/i });
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(onComplete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox', { name: /emotionally processed/i }));
    expect(submit).toBeEnabled();
    await user.click(submit);
    await user.click(submit);

    expect(onComplete).toHaveBeenCalledExactlyOnceWith({
      outcome: 'fail',
      reason: expect.stringContaining('no real human'),
      memeTag: 'terms',
    });
  });
});
