import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CaptchaResult } from '../captchas/types';
import { assetUrl, loadMemes, pickMeme, type MemeAsset } from './assets';
import { MemeArtwork } from './MemeArtwork';
import './meme.css';

export interface MemeTransitionProps {
  open: boolean;
  result: CaptchaResult;
  onDone: () => void;
}
const MINIMUM_MS = 3500;
const FADE_MS = 600;
const MUTE_KEY = 'gotcha:meme-muted';

export function MemeTransition(props: MemeTransitionProps) {
  return props.open ? <ActiveMeme result={props.result} onDone={props.onDone} /> : null;
}

// The adapter also accepts the existing app's session-level mute preference.
export function ActiveMeme({
  result,
  onDone,
  forceMuted = false,
}: Omit<MemeTransitionProps, 'open'> & { forceMuted?: boolean }) {
  const [meme, setMeme] = useState<MemeAsset>();
  const [muted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [leaving, setLeaving] = useState(false);
  const fadeTimer = useRef<number>();
  const [closed, setClosed] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );
  const dialog = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const clip = useRef<HTMLAudioElement>();
  const finished = useRef(false);
  const callback = useRef(onDone);
  const completeAudio = useRef<() => void>(() => {});

  const id = useId();
  useEffect(() => {
    callback.current = onDone;
  }, [onDone]);

  function finish() {
    if (finished.current) return;
    finished.current = true;
    window.clearTimeout(fadeTimer.current);
    clip.current?.pause();
    setClosed(true);
    callback.current();
  }
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });
  function fadeOut() {
    if (finished.current || fadeTimer.current !== undefined) return;
    setLeaving(true);
    fadeTimer.current = window.setTimeout(() => finishRef.current(), reduced ? 0 : FADE_MS);
  }
  const fadeRef = useRef(fadeOut);
  useEffect(() => {
    fadeRef.current = fadeOut;
  });
  useEffect(() => () => window.clearTimeout(fadeTimer.current), []);

  useEffect(() => {
    const controller = new AbortController();
    // A stalled manifest request must not leave an empty modal indefinitely.
    const timeout = window.setTimeout(() => controller.abort(), 1500);
    void loadMemes(controller.signal).then((entries) => {
      if (disposed) return;
      const chosen = pickMeme(entries, result.memeTag);
      setMeme(chosen);
      const next =
        entries.find(
          (entry) =>
            entry.id !== chosen.id && result.memeTag && entry.tags.includes(result.memeTag),
        ) ?? entries.find((entry) => entry.id !== chosen.id);
      if (next) {
        preload = new Audio(assetUrl(next.sound));
        preload.preload = 'auto';
      }
    });
    let disposed = false;
    let preload: HTMLAudioElement | undefined;
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timeout);
      preload?.pause();
    };
  }, [result.memeTag]);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media?.matches ?? false);
    media?.addEventListener('change', change);
    return () => media?.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    if (closed) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    button.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finishRef.current();
      }
      if (event.key !== 'Tab') return;
      const controls =
        dialog.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || !dialog.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !dialog.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    const focusin = (event: FocusEvent) => {
      if (!dialog.current?.contains(event.target as Node)) button.current?.focus();
    };
    document.addEventListener('keydown', keydown);
    document.addEventListener('focusin', focusin);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('focusin', focusin);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [closed]);

  useEffect(() => {
    if (!meme || closed) return;
    let active = true,
      minimumElapsed = false,
      audioEnded = muted || forceMuted;
    const done = () => {
      audioEnded = true;
      if (minimumElapsed && active) fadeRef.current();
    };
    completeAudio.current = done;
    const timer = window.setTimeout(() => {
      minimumElapsed = true;
      if (audioEnded) fadeRef.current();
    }, MINIMUM_MS);
    const sound = new Audio(assetUrl(meme.sound));
    clip.current = sound;
    sound.preload = 'auto';
    sound.volume = 0.35;
    sound.muted = muted || forceMuted;
    sound.onended = done;
    sound.onerror = done;
    // Treat a stalled/never-starting download as unavailable; never cut off playing audio.
    const startup = window.setTimeout(() => {
      if (sound.paused) done();
    }, MINIMUM_MS);
    if (!sound.muted) {
      try {
        void sound.play().catch(() => {
          if (active) {
            done();
          }
        });
      } catch {
        queueMicrotask(() => {
          if (active) {
            done();
          }
        });
      }
    }
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(startup);
      sound.onended = null;
      sound.onerror = null;
      sound.pause();
      clip.current = undefined;
    };
    // Mute changes affect this clip in place without restarting the minimum display time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meme, closed]);

  useEffect(() => {
    if (clip.current) clip.current.muted = muted || forceMuted;
    if (muted || forceMuted) completeAudio.current();
  }, [muted, forceMuted]);

  if (closed) return null;
  return createPortal(
    <div className={`meme-cinema${leaving ? ' meme-cinema--leaving' : ''}`} onClick={finish}>
      <div
        className="meme-cinema__scene"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={
          result.outcome === 'pass' ? 'A human? In this economy?' : 'Certified suspicious.'
        }
        aria-describedby={`${id}-reason`}
      >
        {meme && (
          <div className="meme-cinema__image">
            <MemeArtwork meme={meme} reduced={reduced} />
          </div>
        )}
        <p className="meme-visually-hidden" id={`${id}-reason`} aria-live="polite">
          {result.reason}
        </p>
        <button className="meme-visually-hidden" ref={button} onClick={finish}>
          Try again
        </button>
        <div className="meme-cinema__flash" aria-hidden="true" />
      </div>
    </div>,
    document.body,
  );
}
export default MemeTransition;
