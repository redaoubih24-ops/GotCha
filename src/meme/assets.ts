export interface MemeAsset {
  id: string;
  image: string;
  sound: string;
  tags: string[];
  caption?: string;
  bottomText?: string;
  alt?: string;
  stillImage?: string;
}

export const fallback: MemeAsset = {
  id: 'human-enough',
  image: '/memes/hackathon-human-enough.jpg',
  sound: '/memes/tiny-trombone.wav',
  tags: ['robot', 'confused'],
  caption: 'ME: CLICKS THE BOX',
  bottomText: 'GOTCHA: TOO ACCURATE',
  alt: 'A person with raised eyebrows and an uncertain smile.',
};

export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}memes/${path.replace(/^\/?memes\//, '')}`;
}

export async function loadMemes(signal?: AbortSignal): Promise<MemeAsset[]> {
  try {
    const response = await fetch(assetUrl('manifest.json'), { signal });
    if (!response.ok) return [fallback];
    const data: unknown = await response.json();
    const raw = Array.isArray(data) ? data : (data as { memes?: unknown[] })?.memes;
    const entries = (raw ?? []).flatMap((value: unknown) => {
      if (!value || typeof value !== 'object') return [];
      const entry = value as Record<string, unknown>;
      const sound = entry.sound ?? entry.audio; // Accept the starter manifest during migration.
      if (
        typeof entry.id !== 'string' ||
        typeof entry.image !== 'string' ||
        typeof sound !== 'string' ||
        !Array.isArray(entry.tags) ||
        !entry.tags.every((tag) => typeof tag === 'string')
      )
        return [];
      return [
        {
          id: entry.id,
          image: entry.image,
          sound,
          tags: entry.tags,
          caption: typeof entry.caption === 'string' ? entry.caption : undefined,
          bottomText: typeof entry.bottomText === 'string' ? entry.bottomText : undefined,
          alt: typeof entry.alt === 'string' ? entry.alt : undefined,
          stillImage: typeof entry.stillImage === 'string' ? entry.stillImage : undefined,
        },
      ];
    });
    return entries.length ? entries : [fallback];
  } catch {
    return [fallback];
  }
}

let previousId: string | undefined;
export function pickMeme(entries: MemeAsset[], tag?: string): MemeAsset {
  const fresh = entries.filter((entry) => entry.id !== previousId);
  const pool = fresh.length ? fresh : entries;
  const matching = pool.filter((entry) => tag && entry.tags.includes(tag));
  const choices = matching.length ? matching : pool;
  const chosen = choices[Math.floor(Math.random() * choices.length)] ?? fallback;
  previousId = chosen.id;
  return chosen;
}
