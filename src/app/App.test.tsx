import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

// Keep shell fixtures fixed: adding a CAPTCHA must not require editing app tests.
vi.mock('../captchas/registry', async (importOriginal) => {
  const registry = await importOriginal<typeof import('../captchas/registry')>();
  const fixtures = ['stable-handshake', 'terms-and-conditions'].map((id) =>
    registry.getCaptchaById(id)!,
  );
  return {
    ...registry,
    getAllCaptchas: () => fixtures,
    pickRandomCaptcha: (excludeId?: string) => fixtures.find(({ id }) => id !== excludeId),
  };
});

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
});

describe('GotCha app', () => {
  it('runs login → forced CAPTCHA → meme → login', () => {
    window.history.replaceState({}, '', '/?captcha=stable-handshake');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /let’s prove it/i }));
    const challenge = screen.getByRole('dialog', { name: 'Stable Handshake' });
    fireEvent.click(within(challenge).getByRole('checkbox'));
    expect(screen.getByRole('dialog', { name: 'Certified suspicious.' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /let’s prove it/i })).toBeInTheDocument();
  });

  it('avoids the last random challenge on the next login attempt', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /let’s prove it/i }));
    expect(screen.getByRole('dialog', { name: 'Stable Handshake' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close challenge' }));
    fireEvent.click(screen.getByRole('button', { name: /let’s prove it/i }));
    expect(screen.getByRole('dialog', { name: 'Terms & Conditions' })).toBeInTheDocument();
  });

  it('shows an actionable error for an unknown override', () => {
    window.history.replaceState({}, '', '/?captcha=missing');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /let’s prove it/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('No CAPTCHA named “missing”');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('launches and resets an isolated challenge in the playground', () => {
    window.history.replaceState({}, '', '/playground');
    render(<App />);
    expect(screen.getAllByRole('button', { name: /launch challenge/i })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: /launch challenge/i })[0]);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('checkbox'));
    expect(screen.getByText('A beautiful failure.')).toBeInTheDocument();
    expect(screen.getByText('robot')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Certified suspicious.' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /run again/i }));
    expect(within(screen.getByRole('dialog')).getByRole('checkbox')).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Close challenge' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
