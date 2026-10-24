import { useEffect, useRef, useState } from 'react';
import { assetUrl } from './assets';

/**
 * A 1.5s fireball over the meme. The clip is fire on pure black, blended with
 * `mix-blend-mode: screen`, so black disappears and the fire glows over the
 * picture. That works in every browser, unlike transparent video. If the clip
 * fails or autoplay is blocked, it shows black, which the blend makes invisible.
 */
// Two encodings of the same clip; each browser plays the first one it supports.
export const EXPLOSION_SOURCES = [
  { src: 'effects/explosion.webm', type: 'video/webm' },
  { src: 'effects/explosion.mp4', type: 'video/mp4' },
];

// Warm the browser cache at startup so the first meme doesn't wait for a download.
if (typeof window !== 'undefined' && import.meta.env.MODE !== 'test') {
  const probe = document.createElement('video');
  const playable = EXPLOSION_SOURCES.find(({ type }) => probe.canPlayType(type));
  if (playable) void fetch(assetUrl(playable.src)).catch(() => undefined);
}

export function Explosion() {
  const video = useRef<HTMLVideoElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    // Set muted as a property before play(): some browsers only allow muted autoplay.
    element.muted = true;
    // play() can return a rejected promise or (in old browsers) throw; either way, bow out.
    void Promise.resolve()
      .then(() => element.play())
      .catch(() => setDone(true));
  }, []);

  if (done) return null;
  return (
    <video
      ref={video}
      className="meme-cinema__explosion"
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      onEnded={() => setDone(true)}
    >
      {EXPLOSION_SOURCES.map(({ src, type }, index) => (
        <source
          key={src}
          src={assetUrl(src)}
          type={type}
          // With <source> children, failures fire on the source; the last one failing means none play.
          onError={index === EXPLOSION_SOURCES.length - 1 ? () => setDone(true) : undefined}
        />
      ))}
    </video>
  );
}
