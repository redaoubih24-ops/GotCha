import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import type { CaptchaModule, CaptchaProps } from '../captchas/types';
import App from './App';

// Mock CAPTCHAs keep these tests independent of whatever the team adds to src/captchas/.
const fixtures = vi.hoisted(() => {
  const make = (id: string, title: string, author: string, crash = false) => ({
    id,
    title,
    author,
    Component: ({ onComplete }: CaptchaProps) => {
      if (crash) throw new Error('kaboom');
      return (
        <div>
          <button
            type="button"
            onClick={() =>
              onComplete({ outcome: 'fail', reason: `${title} says no.`, memeTag: 'robot' })
            }
          >
            Fail me
          </button>
          <button
            type="button"
            onClick={() => onComplete({ outcome: 'pass', reason: 'Too accurate.' })}
          >
            Pass me
          </button>
        </div>
      );
    },
  });
  return [
    make('mock-alpha', 'Mock Alpha', 'Test Bot'),
    make('mock-beta', 'Mock Beta', 'Other Bot'),
    make('mock-crash', 'Mock Crash', 'Chaos Bot', true),
  ];
});

vi.mock('../captchas/registry', () => {
  const pool = fixtures.filter(({ id }) => id !== 'mock-crash') as CaptchaModule[];
  return {
    getAllCaptchas: () => pool,
    getCaptchaById: (id: string) => fixtures.find((captcha) => captcha.id === id),
    pickRandomCaptcha: (excludeId?: string) => pool.find(({ id }) => id !== excludeId) ?? pool[0],
  };
});

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
});

const signIn = () => screen.getByRole('button', { name: /sign in/i });

describe('GotCha app', () => {
  it('walks login → captcha → meme → login, and escalates on repeat failures', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Login: any credentials "work" and are wiped.
    await user.type(screen.getByLabelText('Username'), 'robot.mcrobotface');
    await user.type(screen.getByLabelText('Password'), 'beep-boop');
    await user.click(signIn());

    // Captcha, inside the verification frame.
    const challenge = screen.getByRole('dialog', { name: 'Mock Alpha' });
    expect(within(challenge).getByText(/verify you are human/i)).toBeInTheDocument();
    expect(within(challenge).getByText('Test Bot')).toBeInTheDocument();
    expect(within(challenge).getByText(/captcha by/i)).toBeInTheDocument();
    expect(within(challenge).getByText('Attempt 1')).toBeInTheDocument();
    await user.click(within(challenge).getByRole('button', { name: 'Fail me' }));

    // Meme.
    const meme = screen.getByRole('dialog', { name: 'Certified suspicious.' });
    expect(within(meme).getByText('Mock Alpha says no.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Mock Alpha' })).not.toBeInTheDocument();
    await user.click(within(meme).getByRole('button', { name: /try again/i }));

    // Back to login, fields cleared, first escalation line shown.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByText('Hmm. Let’s call that a warm-up.')).toBeInTheDocument();

    // Two more laps, alternating captchas, until the page gets worried.
    for (const title of ['Mock Beta', 'Mock Alpha']) {
      await user.click(signIn());
      const next = screen.getByRole('dialog', { name: title });
      await user.click(within(next).getByRole('button', { name: 'Fail me' }));
      await user.click(screen.getByRole('button', { name: /try again/i }));
    }
    expect(screen.getByText('Still here?')).toBeInTheDocument();
  });

  it('sends a pass through the meme and back to login too', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(signIn());
    await user.click(screen.getByRole('button', { name: 'Pass me' }));
    expect(screen.getByRole('dialog', { name: /a human\? in this economy\?/i })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(signIn()).toBeInTheDocument();
  });

  it('treats a crashing captcha as a failure instead of blanking the page', async () => {
    const user = userEvent.setup();
    // React re-throws render errors to window in development; the expected one is noise here.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const swallow = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener('error', swallow);
    onTestFinished(() => window.removeEventListener('error', swallow));
    window.history.replaceState({}, '', '/?captcha=mock-crash');
    render(<App />);
    await user.click(signIn());

    const meme = screen.getByRole('dialog', { name: 'Certified suspicious.' });
    expect(within(meme).getByText('The captcha gave up on you.')).toBeInTheDocument();
    await user.click(within(meme).getByRole('button', { name: /try again/i }));
    expect(signIn()).toBeInTheDocument();
  });

  it('counts closing the challenge as a failure', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(signIn());
    await user.click(screen.getByRole('button', { name: 'Close challenge' }));
    expect(screen.getByText(/leaving early is exactly what a bot would do/i)).toBeInTheDocument();
  });

  it('respects the ?captcha= override every time', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/?captcha=mock-beta');
    render(<App />);
    for (let lap = 0; lap < 2; lap += 1) {
      await user.click(signIn());
      await user.click(
        within(screen.getByRole('dialog', { name: 'Mock Beta' })).getByRole('button', {
          name: 'Fail me',
        }),
      );
      await user.click(screen.getByRole('button', { name: /try again/i }));
    }
  });

  it('shows an actionable error for an unknown override', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/?captcha=missing');
    render(<App />);
    await user.click(signIn());
    expect(screen.getByRole('alert')).toHaveTextContent('No CAPTCHA named “missing”');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('launches and resets an isolated challenge in the playground', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/playground');
    render(<App />);
    const launches = screen.getAllByRole('button', { name: /launch challenge/i });
    expect(launches).toHaveLength(2);
    await user.click(launches[0]);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Fail me' }));
    expect(screen.getByText('A beautiful failure.')).toBeInTheDocument();
    expect(screen.getByText('robot')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /run again/i }));
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Fail me' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Close challenge' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
