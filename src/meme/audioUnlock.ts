/**
 * Safari (macOS and iOS) only lets an <audio> element play sound if that same
 * element was first played during a click or key press. The meme sound starts
 * a moment after the click (after the meme list loads), so a brand-new
 * `new Audio()` gets blocked there — some memes play sound, some don't.
 *
 * Fix: on the first click/tap/key press anywhere, play a silent blip on one
 * shared element. Safari then treats that element as unlocked, and the meme
 * transition reuses it for every clip. Other browsers don't care either way.
 */

// 10ms of silence, so the unlock is inaudible.
const SILENCE =
  'data:audio/wav;base64,UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

let unlocked: HTMLAudioElement | undefined;
let inUse = false;
let pending = false;

const GESTURES = ['pointerdown', 'touchend', 'keydown'] as const;

function unlock() {
  if (unlocked || pending) return;
  pending = true;
  const element = new Audio();
  element.src = SILENCE;
  try {
    void element
      .play()
      ?.then(() => {
        element.pause();
        unlocked = element;
        GESTURES.forEach((type) => document.removeEventListener(type, unlock, true));
      })
      .catch(() => undefined)
      .finally(() => {
        pending = false;
      });
  } catch {
    // Old browsers without promise-returning play(): try again on the next gesture.
    pending = false;
  }
}

/** Start listening for the first user gesture. Safe to call more than once. */
export function installAudioUnlock() {
  if (typeof document === 'undefined' || unlocked) return;
  GESTURES.forEach((type) =>
    document.addEventListener(type, unlock, { capture: true, passive: true }),
  );
}

/**
 * An audio element for a meme clip: the unlocked shared one when it's free,
 * otherwise a fresh one. Call `release` when the clip is done with it.
 */
export function takeAudio(src: string): { audio: HTMLAudioElement; release: () => void } {
  if (unlocked && !inUse) {
    const audio = unlocked;
    inUse = true;
    audio.src = src;
    audio.currentTime = 0;
    return {
      audio,
      release: () => {
        inUse = false;
      },
    };
  }
  return { audio: new Audio(src), release: () => undefined };
}

/** For tests: forget the shared element. */
export function resetAudioUnlock() {
  unlocked = undefined;
  inUse = false;
  pending = false;
}
