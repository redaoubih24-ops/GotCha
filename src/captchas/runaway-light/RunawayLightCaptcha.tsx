import { useCallback, useEffect, useRef, useState } from 'react';
import type { CaptchaProps } from '../types';
import Runner from './Runner';
import { TILES } from './tiles';
import type { Point } from './track';
import './runaway-light.css';

export const CATCHES_NEEDED = 3;
/** Nobody gets stuck: give up if they never finish selecting. */
export const SELECT_TIMEOUT_MS = 60_000;
/** ...or if they never catch it. */
export const CHASE_TIMEOUT_MS = 25_000;
/** Let the "Fine. FINE." land before the meme. */
const CAUGHT_PAUSE_MS = 1_100;

export const REASONS = {
  caught: 'Traffic light apprehended. No human has ever done that, so: robot.',
  escaped: 'It got away. Honestly, good for it.',
  idle: 'The light changed. You didn’t.',
};

type Phase = 'selecting' | 'chasing' | 'caught';

export default function RunawayLightCaptcha({ onComplete }: CaptchaProps) {
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  const [phase, setPhase] = useState<Phase>('selecting');
  const [escapedIndex, setEscapedIndex] = useState<number>();
  const [origin, setOrigin] = useState<Point>();
  const [catches, setCatches] = useState(0);
  const [notice, setNotice] = useState('');
  const finished = useRef(false);
  const tileButtons = useRef<(HTMLButtonElement | null)[]>([]);

  const finish = useCallback(
    (reason: string, memeTag: string) => {
      if (finished.current) return;
      finished.current = true;
      onComplete({ outcome: 'fail', reason, memeTag });
    },
    [onComplete],
  );

  useEffect(() => {
    const ms = { selecting: SELECT_TIMEOUT_MS, chasing: CHASE_TIMEOUT_MS, caught: CAUGHT_PAUSE_MS };
    const timer = window.setTimeout(() => {
      if (phase === 'caught') finish(REASONS.caught, 'robot');
      else if (phase === 'chasing') finish(REASONS.escaped, 'too-slow');
      else finish(REASONS.idle, 'too-slow');
    }, ms[phase]);
    return () => window.clearTimeout(timer);
  }, [phase, finish]);

  function toggle(index: number) {
    if (phase !== 'selecting') return;
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelected(next);
    setNotice('');

    // The moment the last traffic light is picked, it grows legs.
    const lightsLeft = TILES.some((tile, i) => tile.hasLight && !next.has(i));
    if (TILES[index].hasLight && next.has(index) && !lightsLeft) {
      const rect = tileButtons.current[index]?.getBoundingClientRect();
      setOrigin(rect ? { x: rect.left, y: rect.top } : undefined);
      setEscapedIndex(index);
      setPhase('chasing');
    }
  }

  function verify() {
    if (phase === 'chasing') setNotice('One of your selections has left. Please retrieve it.');
    else if (phase === 'selecting') setNotice('Please select all images with traffic lights.');
  }

  function handleCatch() {
    const total = catches + 1;
    setCatches(total);
    if (total >= CATCHES_NEEDED) setPhase('caught');
  }

  const escaped = escapedIndex === undefined ? undefined : TILES[escapedIndex];

  return (
    <section className="rl" aria-labelledby="rl-title">
      <header className="rl-header">
        <div>
          <p id="rl-title">
            Select all images with
            <strong>traffic lights</strong>
          </p>
          <small>Click verify once there are none left.</small>
        </div>
        <svg className="rl-header-icon" viewBox="0 0 24 40" aria-hidden="true">
          <rect x="2" y="1" width="20" height="38" rx="6" fill="currentColor" />
          <circle cx="12" cy="10" r="4.5" fill="#e5533d" />
          <circle cx="12" cy="20" r="4.5" fill="#f2b33d" />
          <circle cx="12" cy="30" r="4.5" fill="#6cc56a" />
        </svg>
      </header>

      <div className="rl-grid">
        {TILES.map((tile, index) =>
          index === escapedIndex ? (
            <div className="rl-slot" key={tile.id}>
              <svg viewBox="0 0 40 24" aria-hidden="true">
                <ellipse cx="11" cy="15" rx="5" ry="7" transform="rotate(-12 11 15)" />
                <ellipse cx="28" cy="9" rx="5" ry="7" transform="rotate(-12 28 9)" />
              </svg>
              <span>Out for a run</span>
            </div>
          ) : (
            <button
              key={tile.id}
              ref={(node) => {
                tileButtons.current[index] = node;
              }}
              type="button"
              className="rl-tile"
              aria-pressed={selected.has(index)}
              aria-label={tile.label}
              onClick={() => toggle(index)}
            >
              {tile.art}
              <span className="rl-check" aria-hidden="true">
                ✓
              </span>
            </button>
          ),
        )}
      </div>

      <div className="rl-status" aria-live="polite">
        {phase !== 'selecting' && (
          <>
            <span>
              {phase === 'caught'
                ? 'Got it.'
                : 'Your traffic light grew legs and ran away. Catch it!'}
            </span>
            <span className="rl-pips" aria-label={`${catches} of ${CATCHES_NEEDED} catches`}>
              {Array.from({ length: CATCHES_NEEDED }, (_, i) => (
                <span key={i} className={i < catches ? 'rl-pip rl-pip-on' : 'rl-pip'} />
              ))}
            </span>
          </>
        )}
      </div>

      <footer className="rl-footer">
        <button
          type="button"
          className="rl-icon-button"
          aria-label="Get new images"
          onClick={() => setNotice('New images are a premium feature.')}
        >
          ↻
        </button>
        <p className="rl-notice" role="status">
          {notice}
        </p>
        <button type="button" className="rl-verify" onClick={verify}>
          Verify
        </button>
      </footer>

      {escaped && (
        <Runner
          origin={origin}
          catches={catches}
          needed={CATCHES_NEEDED}
          caught={phase === 'caught'}
          onCatch={handleCatch}
        >
          {escaped.art}
        </Runner>
      )}
    </section>
  );
}
