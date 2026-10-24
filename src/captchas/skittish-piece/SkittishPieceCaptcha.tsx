import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { CaptchaProps } from '../types';
import Pasture from './Pasture';
import {
  BOARD,
  FEAR_RADIUS,
  HOLE,
  MARGIN,
  START,
  centerOf,
  distanceToHole,
  isSettled,
  step,
} from './physics';
import type { PieceState, Point } from './physics';
import './skittish-piece.css';

export const TIMEOUT_MS = 45_000;
const SNAP_PAUSE_MS = 1_200;
const KEY_STEP = 10;

/** A jigsaw piece: 40 × 40 with a knob on the top and on the right. */
const PIECE_PATH = 'M0 0 H14 A6 6 0 1 1 26 0 H40 V14 A6 6 0 1 1 40 26 V40 H0 Z';

const SQUEAKS = ['eep!', 'nope', 'no thank you', 'AAA', 'personal space!', 'why'];

export const REASONS = {
  pass: 'Puzzle solved by herding the piece like a sheepdog. Sheepdogs are not human.',
  timeout: 'The piece has declared independence.',
};

type Phase = 'herding' | 'snapped';

interface SkittishPieceProps extends CaptchaProps {
  /** For tests: where the piece starts. */
  start?: PieceState;
}

export function SkittishPiece({ onComplete, start = START }: SkittishPieceProps) {
  const ids = useId().replace(/:/g, '');
  const sceneId = `sp-scene-${ids}`;
  const shapeId = `sp-shape-${ids}`;
  const clipId = `sp-clip-${ids}`;

  const [phase, setPhase] = useState<Phase>('herding');
  const [squeak, setSqueak] = useState('');
  const [notice, setNotice] = useState('');
  const [keyboardHerding, setKeyboardHerding] = useState(false);

  const board = useRef<SVGSVGElement>(null);
  const pieceGroup = useRef<SVGGElement>(null);
  const pieceBody = useRef<SVGGElement>(null);
  const pupils = useRef<(SVGCircleElement | null)[]>([]);
  const shepherd = useRef<SVGGElement>(null);
  const readout = useRef<HTMLElement>(null);

  const piece = useRef<PieceState>({ ...start });
  const pointer = useRef<Point | null>(null);
  const phaseRef = useRef<Phase>('herding');
  const finished = useRef(false);
  const squeakTimer = useRef<number>();

  const finish = useCallback(
    (outcome: 'pass' | 'fail', reason: string) => {
      if (finished.current) return;
      finished.current = true;
      // No memeTag on purpose: every outcome gets a fully random meme.
      onComplete({ outcome, reason });
    },
    [onComplete],
  );

  // Physics loop. Writes straight to the SVG so React only renders on real events.
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let scaredBefore = false;

    const draw = (scared: boolean) => {
      const p = piece.current;
      pieceGroup.current?.setAttribute('transform', `translate(${p.x} ${p.y})`);
      if (scared !== scaredBefore) {
        pieceGroup.current?.classList.toggle('sp-scared', scared);
        scaredBefore = scared;
      }

      // Its eyes stay fixed on whatever is chasing it.
      const target = pointer.current;
      const center = centerOf(p);
      const dx = target ? target.x - center.x : 0;
      const dy = target ? target.y - center.y : 0;
      const length = Math.hypot(dx, dy) || 1;
      pupils.current.forEach((pupil, i) => {
        pupil?.setAttribute('cx', String((i === 0 ? 13 : 27) + (dx / length) * 1.8));
        pupil?.setAttribute('cy', String(17 + (dy / length) * 1.8));
      });

      const herder = pointer.current;
      if (herder) shepherd.current?.setAttribute('transform', `translate(${herder.x} ${herder.y})`);

      if (readout.current) {
        const off = phaseRef.current === 'snapped' ? 0 : Math.round(distanceToHole(p));
        readout.current.textContent = `${off}px`;
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.04, Math.max(0, (now - last) / 1000));
      last = now;
      let scared = false;

      if (phaseRef.current === 'herding') {
        const next = step(piece.current, pointer.current, dt);
        piece.current = next.piece;
        scared = next.scared;

        if (next.leapt) {
          setSqueak(SQUEAKS[Math.floor(Math.random() * SQUEAKS.length)]);
          window.clearTimeout(squeakTimer.current);
          squeakTimer.current = window.setTimeout(() => setSqueak(''), 650);
          pieceBody.current?.animate?.(
            [
              { transform: 'translateY(0) scale(1)' },
              { transform: 'translateY(-10px) scale(1.12, 0.9)' },
              { transform: 'translateY(0) scale(1)' },
            ],
            { duration: 280, easing: 'ease-out' },
          );
        }

        if (isSettled(piece.current)) {
          phaseRef.current = 'snapped';
          piece.current = { ...piece.current, x: HOLE.x, y: HOLE.y, vx: 0, vy: 0 };
          window.clearTimeout(squeakTimer.current);
          setSqueak('…fine.');
          setPhase('snapped');
        }
      }

      draw(scared);
      frame = requestAnimationFrame(tick);
    };

    draw(false);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(squeakTimer.current);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => (phase === 'snapped' ? finish('pass', REASONS.pass) : finish('fail', REASONS.timeout)),
      phase === 'snapped' ? SNAP_PAUSE_MS : TIMEOUT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [phase, finish]);

  function toBoard(event: PointerEvent<SVGSVGElement>): Point | null {
    const rect = board.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * BOARD.width,
      y: ((event.clientY - rect.top) / rect.height) * BOARD.height,
    };
  }

  function handlePointer(event: PointerEvent<SVGSVGElement>) {
    if (keyboardHerding) setKeyboardHerding(false);
    pointer.current = toBoard(event);
  }

  function releasePointer(event: PointerEvent<SVGSVGElement>) {
    // Lifting a finger (or leaving the board) stops the chase.
    if (event.pointerType !== 'mouse' || event.type === 'pointerleave') pointer.current = null;
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, Point> = {
      ArrowUp: { x: 0, y: -KEY_STEP },
      ArrowDown: { x: 0, y: KEY_STEP },
      ArrowLeft: { x: -KEY_STEP, y: 0 },
      ArrowRight: { x: KEY_STEP, y: 0 },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    if (!keyboardHerding) setKeyboardHerding(true);
    const from = pointer.current ?? { x: centerOf(piece.current).x - FEAR_RADIUS, y: 132 };
    pointer.current = {
      x: Math.min(BOARD.width, Math.max(0, from.x + move.x)),
      y: Math.min(BOARD.height, Math.max(0, from.y + move.y)),
    };
  }

  return (
    <section className="sp" aria-labelledby="sp-title">
      <header className="sp-header">
        <div>
          <p id="sp-title">Slide the piece into the gap</p>
          <small>Complete the puzzle to continue.</small>
        </div>
        <span className="sp-tolerance">±{MARGIN}px</span>
      </header>

      <div
        className="sp-board"
        tabIndex={0}
        role="group"
        aria-label="Puzzle board. The piece runs from your cursor. Use the arrow keys to move a herding cursor and chase it into the gap."
        onKeyDown={handleKey}
        onBlur={() => {
          if (keyboardHerding) pointer.current = null;
        }}
      >
        <svg
          ref={board}
          viewBox={`0 0 ${BOARD.width} ${BOARD.height}`}
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerUp={releasePointer}
          onPointerCancel={releasePointer}
          onPointerLeave={releasePointer}
          aria-hidden="true"
        >
          <defs>
            <g id={sceneId}>
              <Pasture />
            </g>
            <path id={shapeId} d={PIECE_PATH} />
            <clipPath id={clipId}>
              <use href={`#${shapeId}`} />
            </clipPath>
          </defs>

          <use href={`#${sceneId}`} />
          <g transform={`translate(${HOLE.x} ${HOLE.y})`} className="sp-hole">
            <use href={`#${shapeId}`} />
          </g>

          <g ref={pieceGroup} className={phase === 'snapped' ? 'sp-piece sp-snapped' : 'sp-piece'}>
            <g ref={pieceBody} className="sp-piece-body">
              <g clipPath={`url(#${clipId})`}>
                <use href={`#${sceneId}`} x={-HOLE.x} y={-HOLE.y} />
              </g>
              <use href={`#${shapeId}`} className="sp-piece-outline" />
              {[13, 27].map((cx, i) => (
                <g key={cx}>
                  <circle cx={cx} cy="17" r="5" className="sp-eye" />
                  <circle
                    ref={(node) => {
                      pupils.current[i] = node;
                    }}
                    cx={cx}
                    cy="17"
                    r="2.3"
                    className="sp-pupil"
                  />
                </g>
              ))}
              <path d="M15 28 q5 -4 10 0" className="sp-mouth" />
            </g>
            {squeak && (
              <g className="sp-squeak" transform="translate(20 -12)" key={squeak}>
                <rect
                  x={-(squeak.length * 3.4 + 8)}
                  y="-10"
                  width={squeak.length * 6.8 + 16}
                  height="16"
                  rx="8"
                />
                <text textAnchor="middle" y="2">
                  {squeak}
                </text>
              </g>
            )}
          </g>

          <g
            ref={shepherd}
            className={keyboardHerding ? 'sp-shepherd sp-shepherd-on' : 'sp-shepherd'}
          >
            <circle r="7" />
            <circle r="2" />
          </g>
        </svg>
      </div>

      <div className="sp-readout" aria-live="off">
        <span>
          Off by <strong ref={readout}>0px</strong>
        </span>
        <span>
          {phase === 'snapped' ? 'Click. Perfect fit.' : `Needs to be within ${MARGIN}px`}
        </span>
      </div>

      <footer className="sp-footer">
        <button
          type="button"
          className="sp-slider"
          onClick={() => setNotice('The slider is on strike. Herd the piece by hand.')}
          aria-label="Slide to complete"
        >
          <span className="sp-slider-handle" aria-hidden="true">
            →
          </span>
          <span className="sp-slider-label">Slide to complete</span>
        </button>
        <p className={phase === 'snapped' ? 'sp-notice sp-notice-ok' : 'sp-notice'} role="status">
          {phase === 'snapped' ? 'Puzzle complete. Verifying your sheepdog credentials…' : notice}
        </p>
      </footer>
    </section>
  );
}

export default function SkittishPieceCaptcha({ onComplete }: CaptchaProps) {
  return <SkittishPiece onComplete={onComplete} />;
}
