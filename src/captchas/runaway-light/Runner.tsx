import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { makeTrack, nearestDistance, pointAt } from './track';
import type { Point } from './track';

/** Pixels per second, indexed by how many times it has been caught. It panics. */
const SPEEDS = [320, 470, 660];
/** What it yells, indexed by catches so far (0 = as it escapes). */
const LINES = ['Nope!', 'Hey!', 'Rude.', 'Fine. FINE.'];
const SPROUT_MS = 750;
const STUN_MS = 550;

type RunnerState = 'sprouting' | 'running' | 'stunned' | 'caught';

interface RunnerProps {
  /** Where the tile was in the grid, so it starts from its old spot. */
  origin?: Point;
  catches: number;
  needed: number;
  caught: boolean;
  onCatch: () => void;
  children: ReactNode;
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export default function Runner({
  origin,
  catches,
  needed,
  caught,
  onCatch,
  children,
}: RunnerProps) {
  const button = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<RunnerState>('sprouting');
  const [line, setLine] = useState(LINES[0]);
  const reduced = useRef(prefersReducedMotion());
  const speed = useRef(SPEEDS[0]);
  const timers = useRef<number[]>([]);
  const motion = useRef({
    x: origin?.x ?? 24,
    y: origin?.y ?? 80,
    s: 0,
    dir: 1,
    mode: 'sprout' as 'sprout' | 'dash' | 'loop' | 'still',
    pausedUntil: 0,
    cooldownUntil: 0,
  });

  useEffect(() => {
    speed.current = SPEEDS[Math.min(catches, SPEEDS.length - 1)];
  }, [catches]);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function track() {
    const node = button.current;
    return makeTrack(
      document.documentElement.clientWidth || window.innerWidth,
      window.innerHeight,
      node?.offsetWidth ?? 0,
      node?.offsetHeight ?? 0,
    );
  }

  function place() {
    const { x, y } = motion.current;
    if (button.current) button.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function teleport() {
    const t = track();
    const p = pointAt(t, Math.random() * t.length);
    Object.assign(motion.current, p);
    place();
  }

  // Sprout legs, then run. Reduced motion: hop between spots instead of running.
  useEffect(() => {
    const m = motion.current;
    const pending = timers.current;
    place();
    button.current?.focus({ preventScroll: true });

    later(() => {
      setState('running');
      setLine('');
      if (reduced.current) {
        m.mode = 'still';
        teleport();
      } else {
        m.s = nearestDistance(track(), m.x, m.y);
        m.mode = 'dash';
      }
    }, SPROUT_MS);

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (!reduced.current && Date.now() >= m.pausedUntil) {
        const step = speed.current * dt;
        const t = track();
        if (m.mode === 'dash') {
          const target = pointAt(t, m.s);
          const dx = target.x - m.x;
          const dy = target.y - m.y;
          const gap = Math.hypot(dx, dy);
          const dashStep = step * 1.4;
          if (gap <= dashStep) {
            Object.assign(m, target, { mode: 'loop' });
          } else {
            m.x += (dx / gap) * dashStep;
            m.y += (dy / gap) * dashStep;
          }
        } else if (m.mode === 'loop') {
          m.s += m.dir * step;
          Object.assign(m, pointAt(t, m.s));
        }
        place();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      pending.forEach((id) => window.clearTimeout(id));
    };
    // Runs once per escape; the motion state lives in refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (caught) motion.current.mode = 'still';
  }, [caught]);

  const shownState: RunnerState = caught ? 'caught' : state;
  const shownLine = caught ? LINES[LINES.length - 1] : line;

  function handleClick() {
    const m = motion.current;
    const now = Date.now();
    if (caught || m.mode === 'sprout' || now < m.cooldownUntil) return;
    m.cooldownUntil = now + STUN_MS;
    m.pausedUntil = now + STUN_MS;
    m.dir *= -1;
    setState('stunned');
    setLine(LINES[Math.min(catches + 1, LINES.length - 1)]);
    later(() => {
      setState('running');
      setLine('');
      if (reduced.current) teleport();
    }, STUN_MS);
    onCatch();
  }

  const left = needed - catches;

  return (
    <button
      ref={button}
      type="button"
      className="rl-runner"
      data-state={shownState}
      onClick={handleClick}
      aria-label={
        caught
          ? 'The traffic light, caught'
          : `Catch the runaway traffic light. ${left} more ${left === 1 ? 'time' : 'times'}.`
      }
    >
      <span className="rl-runner-body">
        {shownLine && (
          <span className="rl-bubble" key={shownLine} aria-hidden="true">
            {shownLine}
          </span>
        )}
        <span className="rl-arm rl-arm-left" aria-hidden="true" />
        <span className="rl-arm rl-arm-right" aria-hidden="true" />
        <span className="rl-runner-tile">
          {children}
          <span className="rl-eyes" aria-hidden="true">
            <span className="rl-eye" />
            <span className="rl-eye" />
          </span>
        </span>
        <span className="rl-legs" aria-hidden="true">
          <span className="rl-leg" />
          <span className="rl-leg" />
        </span>
      </span>
    </button>
  );
}
