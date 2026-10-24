import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemeModal } from './MemeModal';

const result = {
  outcome: 'fail' as const,
  reason: 'The robot is having doubts.',
  memeTag: 'robot',
};

describe('MemeModal', () => {
  const play = vi.fn<() => Promise<void>>();
  const pause = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    play.mockResolvedValue(undefined);
    // The explosion overlay is a <video>; jsdom can't play media.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    pause.mockReset();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    vi.stubGlobal(
      'Audio',
      class {
        volume = 1;
        currentTime = 0;
        play = play;
        pause = pause;
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('focuses the retry action, closes with Escape, and returns focus on unmount', () => {
    const originalButton = document.createElement('button');
    document.body.appendChild(originalButton);
    originalButton.focus();
    const onContinue = vi.fn();
    const { unmount } = render(<MemeModal result={result} onContinue={onContinue} muted />);

    expect(screen.getByRole('dialog', { name: /certified suspicious/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /try again/i })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onContinue).toHaveBeenCalledOnce();
    unmount();
    expect(originalButton).toHaveFocus();
    originalButton.remove();
  });

  it('returns after the minimum even when the parent updates its callback', async () => {
    const oldCallback = vi.fn();
    const currentCallback = vi.fn();
    let rerender!: ReturnType<typeof render>['rerender'];
    await act(async () => {
      ({ rerender } = render(<MemeModal result={result} onContinue={oldCallback} muted />));
    });
    act(() => vi.advanceTimersByTime(3000));
    rerender(<MemeModal result={result} onContinue={currentCallback} muted />);
    act(() => vi.advanceTimersByTime(1100));

    expect(oldCallback).not.toHaveBeenCalled();
    expect(currentCallback).toHaveBeenCalledOnce();
    expect(play).not.toHaveBeenCalled();
  });

  it('continues silently with no visible controls when autoplay is blocked', async () => {
    play.mockRejectedValueOnce(new Error('User gesture required'));
    const onContinue = vi.fn();
    await act(async () => {
      render(<MemeModal result={result} onContinue={onContinue} />);
    });
    expect(screen.queryByRole('button', { name: /replay sound/i })).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4100));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('uses a tagged meme and its static alternative when reduced motion is enabled', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          memes: [
            {
              id: 'robot-gif',
              tags: ['robot'],
              image: 'suspicion.gif',
              stillImage: 'identity-crisis.svg',
              audio: 'tiny-trombone.wav',
              alt: 'A suspicious checkbox.',
              caption: 'suspicion levels: yes.',
            },
          ],
        }),
      }),
    );

    await act(async () => {
      render(<MemeModal result={result} onContinue={vi.fn()} muted />);
    });

    expect(screen.getByRole('img', { name: /suspicious checkbox/i })).toHaveAttribute(
      'src',
      '/memes/identity-crisis.svg',
    );
    expect(screen.getByText('suspicion levels: yes.')).toBeVisible();
  });
});
