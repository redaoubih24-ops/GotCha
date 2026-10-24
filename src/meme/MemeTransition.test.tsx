import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemeTransition } from './MemeTransition';
import { pickMeme } from './assets';

const result = {
  outcome: 'fail' as const,
  reason: 'Our scanner doubts itself.',
  memeTag: 'confused',
};
const entries = [
  { id: 'one', image: '/memes/one.svg', sound: '/memes/one.wav', tags: ['confused'] },
  { id: 'two', image: '/memes/two.svg', sound: '/memes/two.wav', tags: ['confused'] },
  { id: 'three', image: '/memes/three.svg', sound: '/memes/three.wav', tags: ['betrayal'] },
];
let clips: HTMLAudioElement[];
let play: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  clips = [];
  play = vi.fn().mockResolvedValue(undefined);
  // The explosion overlay is a <video>; jsdom can't play media.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => entries }));
  vi.stubGlobal(
    'Audio',
    class {
      paused = false;
      muted = false;
      volume = 1;
      preload = '';
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      play = play;
      pause = vi.fn();
      constructor() {
        clips.push(this as unknown as HTMLAudioElement);
      }
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function mount(onDone = vi.fn()) {
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(<MemeTransition open result={result} onDone={onDone} />);
  });
  return { ...view, onDone };
}
function playing() {
  return clips.find((clip) => clip.onended !== null)!;
}

describe('MemeTransition lifecycle', () => {
  it('waits for both the minimum time and a longer sound, then calls back once', async () => {
    const { onDone } = await mount();
    act(() => vi.advanceTimersByTime(3500));
    expect(onDone).not.toHaveBeenCalled();
    act(() => {
      playing().onended?.(new Event('ended'));
    });
    act(() => vi.advanceTimersByTime(600));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDone).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('keeps a short sound visible for 3.5 seconds', async () => {
    const { onDone } = await mount();
    act(() => {
      playing().onended?.(new Event('ended'));
      vi.advanceTimersByTime(3499);
    });
    expect(onDone).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(601));
    expect(onDone).toHaveBeenCalledOnce();
  });
  it('handles rejected playback silently and uses the latest callback', async () => {
    play.mockRejectedValue(new Error('blocked'));
    const { rerender, onDone } = await mount();
    const latest = vi.fn();
    rerender(<MemeTransition open result={result} onDone={latest} />);
    expect(screen.getByText(result.reason)).toBeVisible();
    act(() => vi.advanceTimersByTime(4100));
    expect(latest).toHaveBeenCalledOnce();
    expect(onDone).not.toHaveBeenCalled();
  });
  it('traps focus without visible UI and restores it on click close', async () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const { onDone } = await mount();
    expect(document.querySelector('.meme-cinema__flash')).toBeInTheDocument();
    expect(document.querySelector('.meme-cinema__image')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: /try again/i });
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(retry).toHaveFocus();
    fireEvent.click(screen.getByRole('img'));
    expect(onDone).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
  it('closes on Escape once and starts a fresh lifecycle when reopened', async () => {
    const { onDone, rerender } = await mount();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDone).toHaveBeenCalledOnce();
    rerender(<MemeTransition open={false} result={result} onDone={onDone} />);
    await act(async () => {
      rerender(<MemeTransition open result={result} onDone={onDone} />);
    });
    expect(screen.getByRole('dialog')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onDone).toHaveBeenCalledTimes(2);
  });
  it('prefers tags, avoids repeats, and falls back across the whole manifest', () => {
    const first = pickMeme(entries, 'confused');
    const second = pickMeme(entries, 'confused');
    expect(first.tags).toContain('confused');
    expect(second.tags).toContain('confused');
    expect(first.id).not.toBe(second.id);
    expect(entries).toContain(pickMeme(entries, 'unknown'));
  });
});
