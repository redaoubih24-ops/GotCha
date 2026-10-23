import { useEffect, useRef, useState } from 'react';
import type { CaptchaResult } from '../captchas/types';
import './meme.css';

export interface MemeModalProps {
  result: CaptchaResult;
  onContinue: () => void;
  muted?: boolean;
}

interface MemeAsset {
  id: string;
  tags: string[];
  image: string;
  stillImage?: string;
  audio: string;
  alt: string;
  caption: string;
}

const RETURN_DELAY_MS = 4500;
const FALLBACK_MEME: MemeAsset = {
  id: 'identity-crisis',
  tags: ['robot', 'default'],
  image: 'identity-crisis.svg',
  audio: 'tiny-trombone.mp3',
  alt: 'A lime checkbox with worried eyes holds a sign saying: human-ish.',
  caption: 'the algorithm has a feeling about you.',
};

function assetUrl(file: string) {
  return `${import.meta.env.BASE_URL}memes/${file}`;
}

function isMemeAsset(value: unknown): value is MemeAsset {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<MemeAsset>;
  return (
    typeof entry.id === 'string' &&
    Array.isArray(entry.tags) &&
    entry.tags.every((tag) => typeof tag === 'string') &&
    typeof entry.image === 'string' &&
    (entry.stillImage === undefined || typeof entry.stillImage === 'string') &&
    typeof entry.audio === 'string' &&
    typeof entry.alt === 'string' &&
    typeof entry.caption === 'string'
  );
}

export function MemeModal({ result, onContinue, muted = false }: MemeModalProps) {
  const [meme, setMeme] = useState<MemeAsset>(FALLBACK_MEME);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );
  const continueButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const onContinueRef = useRef(onContinue);

  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadMeme = async () => {
      try {
        const response = await fetch(assetUrl('manifest.json'), { signal: controller.signal });
        if (!response.ok) return;
        const manifest = (await response.json()) as { memes?: unknown[] };
        const entries = manifest.memes?.filter(isMemeAsset) ?? [];
        const matching = entries.filter(
          (entry) => result.memeTag && entry.tags.includes(result.memeTag),
        );
        const pool = matching.length
          ? matching
          : entries.filter((entry) => entry.tags.includes('default'));
        if (pool.length && !controller.signal.aborted) {
          setMeme(pool[Math.floor(Math.random() * pool.length)]);
        }
      } catch {
        // The bundled fallback keeps the transition working offline or if the manifest is edited incorrectly.
      }
    };
    void loadMeme();
    return () => controller.abort();
  }, [result.memeTag]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    continueButton.current?.focus();
    const timer = window.setTimeout(() => onContinueRef.current(), RETURN_DELAY_MS);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onContinueRef.current();
      if (event.key !== 'Tab') return;
      const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    if (muted) return;
    const clip = new Audio(assetUrl(meme.audio));
    clip.volume = 0.35;
    audio.current = clip;
    let active = true;
    void clip
      .play()
      .then(() => {
        if (active) setSoundBlocked(false);
      })
      .catch(() => {
        if (active) setSoundBlocked(true);
      });
    return () => {
      active = false;
      clip.pause();
      clip.currentTime = 0;
      audio.current = null;
    };
  }, [meme.audio, muted]);

  const replaySound = () => {
    const clip = audio.current;
    if (!clip || muted) return;
    clip.currentTime = 0;
    void clip
      .play()
      .then(() => setSoundBlocked(false))
      .catch(() => setSoundBlocked(true));
  };

  return (
    <div className="meme-backdrop">
      <div
        className="meme-modal"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="meme-title"
        aria-describedby="meme-reason meme-return"
      >
        <p className="meme-eyebrow">Human verification: deeply inconclusive</p>
        <h2 id="meme-title">
          {result.outcome === 'pass' ? 'A human? In this economy?' : 'Certified suspicious.'}
        </h2>
        <p className="meme-reason" id="meme-reason">
          {result.reason}
        </p>
        <figure className="meme-figure">
          <img
            src={assetUrl(reducedMotion ? (meme.stillImage ?? meme.image) : meme.image)}
            alt={meme.alt}
            width="640"
            height="360"
          />
          <figcaption>{meme.caption}</figcaption>
        </figure>
        <div className="meme-actions">
          <button
            className="meme-continue"
            ref={continueButton}
            onClick={() => onContinueRef.current()}
          >
            Try again <span aria-hidden="true">↻</span>
          </button>
          {!muted && soundBlocked && (
            <button className="meme-replay" onClick={replaySound}>
              Replay sound
            </button>
          )}
        </div>
        <p className="meme-return" id="meme-return">
          Back to the login in a few seconds. As planned.
        </p>
        <div className="meme-timer" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}

export default MemeModal;
