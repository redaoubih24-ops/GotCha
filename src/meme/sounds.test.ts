import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SOUNDS, peekNextSound, pickSound } from './assets';

describe('random meme sounds', () => {
  it('only ever plays clips from the shared set', () => {
    for (let i = 0; i < 50; i += 1) expect(SOUNDS).toContain(pickSound());
  });

  it('never plays the same clip twice in a row', () => {
    let previous = pickSound();
    for (let i = 0; i < 50; i += 1) {
      const next = pickSound();
      expect(next).not.toBe(previous);
      previous = next;
    }
  });

  it('preloads exactly the clip that plays next', () => {
    const upcoming = peekNextSound();
    expect(pickSound()).toBe(upcoming);
  });

  it('has every listed clip on disk', () => {
    for (const sound of SOUNDS) {
      const file = resolve(process.cwd(), 'public/memes', sound);
      expect(existsSync(file), sound).toBe(true);
    }
  });
});
