import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import captcha from './index';
import { CHASE_TIMEOUT_MS, REASONS, SELECT_TIMEOUT_MS } from './RunawayLightCaptcha';
import { TILES } from './tiles';
import { makeTrack, nearestDistance, pointAt } from './track';

const Captcha = captcha.Component;
const lights = TILES.filter((tile) => tile.hasLight);
const runner = () => screen.getByRole('button', { name: /catch the runaway traffic light/i });

function selectAllLights() {
  for (const tile of lights) fireEvent.click(screen.getByRole('button', { name: tile.label }));
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('runaway traffic light', () => {
  it('escapes on the last light, then fails after exactly three catches', () => {
    const onComplete = vi.fn();
    render(<Captcha onComplete={onComplete} />);
    expect(screen.queryByRole('button', { name: /catch/i })).not.toBeInTheDocument();

    selectAllLights();
    expect(runner()).toBeInTheDocument();
    expect(screen.getByText('Out for a run')).toBeInTheDocument();

    // Clicks while it's still sprouting legs don't count.
    fireEvent.click(runner());
    act(() => vi.advanceTimersByTime(800));

    for (let i = 0; i < 2; i += 1) {
      fireEvent.click(runner());
      act(() => vi.advanceTimersByTime(800));
    }
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /1 more time\b/i }));
    act(() => vi.advanceTimersByTime(2000));
    expect(onComplete).toHaveBeenCalledExactlyOnceWith({
      outcome: 'fail',
      reason: REASONS.caught,
      memeTag: 'robot',
    });
  });

  it('ignores double-clicks while it is stunned', () => {
    const onComplete = vi.fn();
    render(<Captcha onComplete={onComplete} />);
    selectAllLights();
    act(() => vi.advanceTimersByTime(800));
    fireEvent.click(runner());
    fireEvent.click(runner());
    fireEvent.click(runner());
    expect(runner()).toHaveAccessibleName(/2 more times/i);
  });

  it('heckles an early verify and keeps going', () => {
    const onComplete = vi.fn();
    render(<Captcha onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    expect(screen.getByText(/select all images with traffic lights\./i)).toBeInTheDocument();

    selectAllLights();
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    expect(screen.getByText(/one of your selections has left/i)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('lets non-light tiles toggle without triggering the escape', () => {
    render(<Captcha onComplete={vi.fn()} />);
    const bus = screen.getByRole('button', { name: 'A city bus' });
    fireEvent.click(bus);
    expect(bus).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(bus);
    expect(bus).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: /catch/i })).not.toBeInTheDocument();
  });

  it('gives up if the runner is never caught', () => {
    const onComplete = vi.fn();
    render(<Captcha onComplete={onComplete} />);
    selectAllLights();
    act(() => vi.advanceTimersByTime(CHASE_TIMEOUT_MS + 10));
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ outcome: 'fail', reason: REASONS.escaped }),
    );
  });

  it('gives up if nobody selects anything', () => {
    const onComplete = vi.fn();
    render(<Captcha onComplete={onComplete} />);
    act(() => vi.advanceTimersByTime(SELECT_TIMEOUT_MS + 10));
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ reason: REASONS.idle }),
    );
  });
});

describe('track', () => {
  const track = makeTrack(400, 300, 80, 100);

  it('goes clockwise around the screen edge and wraps', () => {
    expect(pointAt(track, 0)).toEqual({ x: track.x0, y: track.y0 });
    expect(pointAt(track, track.width)).toEqual({ x: track.x1, y: track.y0 });
    expect(pointAt(track, track.width + track.height)).toEqual({ x: track.x1, y: track.y1 });
    expect(pointAt(track, track.length)).toEqual(pointAt(track, 0));
    expect(pointAt(track, -1)).toEqual(pointAt(track, track.length - 1));
  });

  it('finds the closest edge to start running on', () => {
    const s = nearestDistance(track, track.x1 - 5, 150);
    expect(pointAt(track, s)).toEqual({ x: track.x1, y: 150 });
  });
});
