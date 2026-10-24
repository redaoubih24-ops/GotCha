import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Explosion } from './Explosion';

afterEach(() => vi.restoreAllMocks());

describe('Explosion overlay', () => {
  it('plays the fireball muted, then removes itself when it ends', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const { container } = render(<Explosion />);
    const video = container.querySelector('video')!;

    expect(video).toHaveClass('meme-cinema__explosion');
    const sources = [...video.querySelectorAll('source')].map((source) =>
      source.getAttribute('src'),
    );
    expect(sources).toEqual([
      expect.stringMatching(/memes\/effects\/explosion\.webm$/),
      expect.stringMatching(/memes\/effects\/explosion\.mp4$/),
    ]);
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute('aria-hidden', 'true');
    await vi.waitFor(() => expect(play).toHaveBeenCalledOnce());

    fireEvent.ended(video);
    expect(container.querySelector('video')).toBeNull();
  });

  it('gets out of the way if the clip fails to load', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const { container } = render(<Explosion />);
    const sources = container.querySelectorAll('source');
    fireEvent.error(sources[0]);
    expect(container.querySelector('video')).not.toBeNull();
    fireEvent.error(sources[sources.length - 1]);
    expect(container.querySelector('video')).toBeNull();
  });

  it('gets out of the way if autoplay is blocked', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('blocked'));
    const { container, findByText } = render(
      <>
        <Explosion />
        <span>meme</span>
      </>,
    );
    await findByText('meme');
    await vi.waitFor(() => expect(container.querySelector('video')).toBeNull());
  });
});
