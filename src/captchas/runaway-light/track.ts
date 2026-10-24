/**
 * The runner's track: a rectangle just inside the edges of the screen.
 * Distance along the track (`s`) goes clockwise from the top-left corner.
 */

export interface Track {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
  length: number;
}

export interface Point {
  x: number;
  y: number;
}

const EDGE = 12;
/** Extra room at the top so the runner's speech bubble stays on screen. */
const TOP_EDGE = 40;

export function makeTrack(
  viewportWidth: number,
  viewportHeight: number,
  w: number,
  h: number,
): Track {
  const x0 = EDGE;
  const y0 = TOP_EDGE;
  const x1 = Math.max(x0, viewportWidth - w - EDGE);
  const y1 = Math.max(y0, viewportHeight - h - EDGE);
  const width = x1 - x0;
  const height = y1 - y0;
  return { x0, y0, x1, y1, width, height, length: Math.max(1, 2 * (width + height)) };
}

export function wrap(s: number, length: number): number {
  return ((s % length) + length) % length;
}

export function pointAt(track: Track, distance: number): Point {
  const { x0, y0, x1, y1, width, height } = track;
  let s = wrap(distance, track.length);
  if (s <= width) return { x: x0 + s, y: y0 };
  s -= width;
  if (s <= height) return { x: x1, y: y0 + s };
  s -= height;
  if (s <= width) return { x: x1 - s, y: y1 };
  s -= width;
  return { x: x0, y: y1 - s };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Distance along the track of the track point closest to (x, y). */
export function nearestDistance(track: Track, x: number, y: number): number {
  const { x0, y0, x1, y1, width, height } = track;
  const cx = clamp(x, x0, x1);
  const cy = clamp(y, y0, y1);
  const options = [
    { gap: Math.abs(y - y0), s: cx - x0 },
    { gap: Math.abs(x - x1), s: width + (cy - y0) },
    { gap: Math.abs(y - y1), s: width + height + (x1 - cx) },
    { gap: Math.abs(x - x0), s: 2 * width + height + (y1 - cy) },
  ];
  return options.reduce((best, option) => (option.gap < best.gap ? option : best)).s;
}
