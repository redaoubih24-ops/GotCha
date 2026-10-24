import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import captcha from './index';
import {
  FEAR_RADIUS,
  HOLE,
  MARGIN,
  START,
  centerOf,
  distanceToHole,
  isSettled,
  step,
} from './physics';
import type { PieceState } from './physics';
import { REASONS, SkittishPiece, TIMEOUT_MS } from './SkittishPieceCaptcha';

const still = (x: number, y: number): PieceState => ({ x, y, vx: 0, vy: 0, leapCooldown: 0 });

/** Run the physics for `seconds` with a fixed pointer. */
function simulate(piece: PieceState, pointer: { x: number; y: number } | null, seconds: number) {
  let state = piece;
  let leaps = 0;
  for (let t = 0; t < seconds; t += 1 / 60) {
    const next = step(state, pointer, 1 / 60, () => 0.5);
    state = next.piece;
    if (next.leapt) leaps += 1;
  }
  return { state, leaps };
}

describe('skittish piece physics', () => {
  it('backs away from a cursor approaching from the left', () => {
    const piece = still(100, 100);
    const center = centerOf(piece);
    const { state } = simulate(piece, { x: center.x - 50, y: center.y }, 0.5);
    expect(state.x).toBeGreaterThan(piece.x + 10);
  });

  it('leaps when the cursor gets too close', () => {
    const piece = still(100, 100);
    const center = centerOf(piece);
    const { leaps } = simulate(piece, { x: center.x - 10, y: center.y }, 0.1);
    expect(leaps).toBe(1);
  });

  it('ignores a cursor that is far away', () => {
    const piece = still(60, 60);
    const { state } = simulate(piece, { x: 60 + 20 + FEAR_RADIUS + 20, y: 80 }, 1);
    expect(state.x).toBeCloseTo(60);
    expect(state.y).toBeCloseTo(60);
  });

  it('never leaves the board, however hard it is chased', () => {
    let piece = still(10, 10);
    for (let i = 0; i < 600; i += 1) {
      piece = step(piece, { x: 300, y: 190 }, 1 / 60, Math.random).piece;
      expect(piece.x).toBeGreaterThanOrEqual(0);
      expect(piece.y).toBeGreaterThanOrEqual(0);
      expect(piece.x).toBeLessThanOrEqual(320 - 40);
      expect(piece.y).toBeLessThanOrEqual(200 - 40);
    }
  });

  it('eases into the hole once herded close and left alone', () => {
    const { state } = simulate(still(HOLE.x - 15, HOLE.y + 8), null, 3);
    expect(distanceToHole(state)).toBeLessThanOrEqual(MARGIN);
    expect(isSettled(state)).toBe(true);
  });

  it('does not count as settled while far away or still moving', () => {
    expect(isSettled(START)).toBe(false);
    expect(isSettled({ ...still(HOLE.x, HOLE.y), vx: 200 })).toBe(false);
  });
});

describe('skittish piece captcha', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders a normal-looking slider captcha', () => {
    render(<captcha.Component onComplete={vi.fn()} />);
    expect(screen.getByText('Slide the piece into the gap')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /puzzle board/i })).toHaveAttribute('tabindex', '0');
  });

  it('passes, with no meme tag, once the piece settles in the hole', () => {
    const onComplete = vi.fn();
    render(<SkittishPiece onComplete={onComplete} start={still(HOLE.x + 2, HOLE.y)} />);
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText(/verifying your sheepdog credentials/i)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1500));
    expect(onComplete).toHaveBeenCalledExactlyOnceWith({ outcome: 'pass', reason: REASONS.pass });
  });

  it('fails, with no meme tag, if nobody gets it in on time', () => {
    const onComplete = vi.fn();
    render(<captcha.Component onComplete={onComplete} />);
    act(() => vi.advanceTimersByTime(TIMEOUT_MS + 10));
    expect(onComplete).toHaveBeenCalledExactlyOnceWith({
      outcome: 'fail',
      reason: REASONS.timeout,
    });
  });

  it('the slider is decorative and says so', () => {
    render(<captcha.Component onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /slide to complete/i }));
    expect(screen.getByText(/slider is on strike/i)).toBeInTheDocument();
  });

  it('can be herded with the arrow keys', () => {
    render(<captcha.Component onComplete={vi.fn()} />);
    const board = screen.getByRole('group', { name: /puzzle board/i });
    board.focus();
    fireEvent.keyDown(board, { key: 'ArrowRight' });
    expect(document.querySelector('.sp-shepherd-on')).toBeInTheDocument();
  });
});
