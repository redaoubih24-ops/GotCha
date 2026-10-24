import { assetUrl, type MemeAsset } from './assets';

/** The captions are part of the meme itself, not surrounding application UI. */
export function MemeArtwork({ meme, reduced = false }: { meme: MemeAsset; reduced?: boolean }) {
  return (
    <div className="meme-artwork">
      <img
        src={assetUrl(reduced ? (meme.stillImage ?? meme.image) : meme.image)}
        alt={meme.alt ?? 'The security system questions its own judgment.'}
        onError={(event) => {
          const fallback = assetUrl('hackathon-human-enough.jpg');
          if (!event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback;
        }}
      />
      {meme.caption && <p className="meme-artwork__text meme-artwork__text--top">{meme.caption}</p>}
      {meme.bottomText && (
        <p className="meme-artwork__text meme-artwork__text--bottom">{meme.bottomText}</p>
      )}
    </div>
  );
}
