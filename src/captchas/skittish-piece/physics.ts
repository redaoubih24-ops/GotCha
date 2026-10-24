/**
 * Herding physics for a jigsaw piece with trust issues.
 * Everything is in board units (the SVG viewBox is 320 × 200), so it behaves
 * the same at any screen size.
 */

export interface Point {
  x: number;
  y: number;
}

export interface PieceState extends Point {
  vx: number;
  vy: number;
  /** Seconds until it can leap again. */
  leapCooldown: number;
}

export const BOARD = { width: 320, height: 200 };
/** The piece's square body. Its knobs stick out 6 units on the top and right. */
export const PIECE = 40;
/** Top-left of the hole the piece belongs in. */
export const HOLE: Point = { x: 228, y: 96 };
export const START: PieceState = { x: 34, y: 112, vx: 0, vy: 0, leapCooldown: 0 };

/** “Within a certain margin”: how close the piece must settle to count. */
export const MARGIN = 8;
/** It notices the cursor inside this radius and starts backing away. */
export const FEAR_RADIUS = 72;
/** Inside this radius it panics and leaps. */
export const LEAP_RADIUS = 40;

const FEAR_ACCEL = 2400;
const LEAP_SPEED = 250;
const LEAP_COOLDOWN = 0.5;
/** How sideways a leap can go, in radians. Keeps it unpredictable. */
const LEAP_SPREAD = 1.3;
const FRICTION = 3.4;
const MAX_SPEED = 420;
const BOUNCE = 0.55;
/** Near the hole and left alone, it eases into place like a real piece would. */
const SETTLE_RADIUS = 22;
const SETTLE_SPRING = 34;
const SETTLE_SPEED = 30;

const MIN_X = 2;
const MAX_X = BOARD.width - PIECE - 8;
const MIN_Y = 8;
const MAX_Y = BOARD.height - PIECE - 2;

export function centerOf(piece: Point): Point {
  return { x: piece.x + PIECE / 2, y: piece.y + PIECE / 2 };
}

export function distanceToHole(piece: Point): number {
  return Math.hypot(piece.x - HOLE.x, piece.y - HOLE.y);
}

export function isSettled(piece: PieceState): boolean {
  return distanceToHole(piece) <= MARGIN && Math.hypot(piece.vx, piece.vy) <= SETTLE_SPEED;
}

/** Advance the piece by `dt` seconds, fleeing `pointer` if it's close. */
export function step(
  piece: PieceState,
  pointer: Point | null,
  dt: number,
  random: () => number = Math.random,
): { piece: PieceState; leapt: boolean; scared: boolean } {
  let { x, y, vx, vy } = piece;
  let leapCooldown = Math.max(0, piece.leapCooldown - dt);
  let leapt = false;
  let scared = false;

  if (pointer) {
    const center = centerOf(piece);
    const dx = center.x - pointer.x;
    const dy = center.y - pointer.y;
    const distance = Math.hypot(dx, dy) || 0.001;

    if (distance < FEAR_RADIUS) {
      scared = true;
      const push = (1 - distance / FEAR_RADIUS) * FEAR_ACCEL * dt;
      vx += (dx / distance) * push;
      vy += (dy / distance) * push;

      if (distance < LEAP_RADIUS && leapCooldown === 0) {
        const angle = Math.atan2(dy, dx) + (random() - 0.5) * LEAP_SPREAD;
        vx += Math.cos(angle) * LEAP_SPEED;
        vy += Math.sin(angle) * LEAP_SPEED;
        leapCooldown = LEAP_COOLDOWN;
        leapt = true;
      }
    }
  }

  // Close to home and not being chased: drift into the hole.
  const toHoleX = HOLE.x - x;
  const toHoleY = HOLE.y - y;
  if (!scared && Math.hypot(toHoleX, toHoleY) < SETTLE_RADIUS) {
    vx += toHoleX * SETTLE_SPRING * dt;
    vy += toHoleY * SETTLE_SPRING * dt;
  }

  const friction = Math.exp(-FRICTION * dt);
  vx *= friction;
  vy *= friction;

  const speed = Math.hypot(vx, vy);
  if (speed > MAX_SPEED) {
    vx = (vx / speed) * MAX_SPEED;
    vy = (vy / speed) * MAX_SPEED;
  }

  x += vx * dt;
  y += vy * dt;

  if (x < MIN_X || x > MAX_X) {
    x = Math.min(MAX_X, Math.max(MIN_X, x));
    vx = -vx * BOUNCE;
  }
  if (y < MIN_Y || y > MAX_Y) {
    y = Math.min(MAX_Y, Math.max(MIN_Y, y));
    vy = -vy * BOUNCE;
  }

  return { piece: { x, y, vx, vy, leapCooldown }, leapt, scared };
}
