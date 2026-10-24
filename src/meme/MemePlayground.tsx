import { useEffect, useState } from 'react';
import { assetUrl, loadMemes, type MemeAsset } from './assets';
import MemeTransition from './MemeTransition';
import { MemeArtwork } from './MemeArtwork';

export default function MemePlayground() {
  const [entries, setEntries] = useState<MemeAsset[]>([]);
  const [preview, setPreview] = useState<MemeAsset>();
  useEffect(() => {
    const controller = new AbortController();
    void loadMemes(controller.signal).then((memes) => {
      if (!controller.signal.aborted) setEntries(memes);
    });
    return () => controller.abort();
  }, []);
  return (
    <main className="meme-playground">
      <a href="/playground">← Challenge playground</a>
      <p className="meme-eyebrow">THE SOUND JUDGMENT DEPARTMENT</p>
      <h1>
        Every reaction.
        <br />
        Questionable reasoning.
      </h1>
      <p>Hackathon pictures, questionable captions. Play each sound or test the full transition.</p>
      <div className="meme-grid">
        {entries.map((meme) => (
          <article key={meme.id}>
            <MemeArtwork meme={meme} reduced />
            <h2>{meme.id}</h2>
            <p>{meme.caption ?? 'The machine has concerns.'}</p>
            <p>{meme.tags.join(' · ')}</p>
            <audio
              controls
              preload="none"
              src={assetUrl(meme.sound)}
              aria-label={`Sound for ${meme.id}`}
              onPlay={(event) => {
                const current = event.currentTarget;
                document.querySelectorAll('audio').forEach((audio) => {
                  if (audio !== current) audio.pause();
                });
              }}
            />
            <button className="meme-continue" onClick={() => setPreview(meme)}>
              Preview transition
            </button>
          </article>
        ))}
      </div>
      {preview && (
        <MemeTransition
          open
          result={{
            outcome: 'fail',
            reason: preview.caption ?? 'Our totally scientific system has concerns.',
            memeTag: preview.tags[0],
          }}
          onDone={() => setPreview(undefined)}
        />
      )}
    </main>
  );
}
