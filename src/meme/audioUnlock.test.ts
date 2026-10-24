import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installAudioUnlock, resetAudioUnlock, takeAudio } from './audioUnlock';

let created: HTMLAudioElement[];

beforeEach(() => {
  created = [];
  resetAudioUnlock();
  vi.stubGlobal(
    'Audio',
    class {
      src = '';
      currentTime = 0;
      play = vi.fn().mockResolvedValue(undefined);
      pause = vi.fn();
      constructor(src?: string) {
        if (src) this.src = src;
        created.push(this as unknown as HTMLAudioElement);
      }
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('Safari audio unlock', () => {
  it('uses a fresh element before anyone has clicked', () => {
    const { audio } = takeAudio('/memes/sounds/sfx-1.mp3');
    expect(audio.src).toBe('/memes/sounds/sfx-1.mp3');
    expect(created).toHaveLength(1);
  });

  it('unlocks one element on the first click and reuses it for every clip', async () => {
    installAudioUnlock();
    document.dispatchEvent(new Event('pointerdown'));
    await vi.waitFor(() => expect(created[0].pause).toHaveBeenCalled());
    const unlocked = created[0];
    expect(unlocked.play).toHaveBeenCalledOnce();

    const first = takeAudio('/memes/sounds/sfx-2.mp3');
    expect(first.audio).toBe(unlocked);
    expect(unlocked.src).toBe('/memes/sounds/sfx-2.mp3');
    first.release();

    const second = takeAudio('/memes/sounds/sfx-3.mp3');
    expect(second.audio).toBe(unlocked);
    expect(created).toHaveLength(1);
  });

  it('falls back to a fresh element while the shared one is busy', async () => {
    installAudioUnlock();
    document.dispatchEvent(new Event('keydown'));
    await vi.waitFor(() => expect(created[0].pause).toHaveBeenCalled());
    const busy = takeAudio('/a.mp3');
    const other = takeAudio('/b.mp3');
    expect(other.audio).not.toBe(busy.audio);
  });

  it('only unlocks once, however many clicks follow', async () => {
    installAudioUnlock();
    document.dispatchEvent(new Event('pointerdown'));
    await vi.waitFor(() => expect(created[0].pause).toHaveBeenCalled());
    document.dispatchEvent(new Event('pointerdown'));
    document.dispatchEvent(new Event('keydown'));
    expect(created).toHaveLength(1);
  });
});
