# Local meme assets

Every asset in this directory is original work made for the GotCha starter and
covered by the repository’s MIT license. No external images, samples, or
recordings are used. The sound is synthesized from sine waves.

- `identity-crisis.svg`: original worried-checkbox illustration.
- `fine-print.svg`: original terms-and-conditions illustration.
- `suspicion.gif`: original animated checkbox; 640 × 360, three frames.
- `tiny-trombone.mp3`: original descending three-note sound, 1.25 seconds, mono,
  96 kbps. This is the file played by the modal.
- `tiny-trombone.wav`: the original PCM source of the same synthesized sound,
  retained for editing. WAV and MP3 both work in the manifest.

Add entries to `manifest.json` with unique `id`, `tags`, `image`, `audio`, `alt`,
and `caption` fields. For animation, include a `stillImage` for people who prefer
reduced motion. Paths are filenames relative to this folder. `memeTag`
from a CAPTCHA selects a matching entry; the `default` tag supplies a fallback.
Use local relative filenames. Keep audio short, provide meaningful alt text, and
record the author, source, and license here for any new assets. Avoid hotlinks.

The modal respects the header’s sound toggle. If browser autoplay is blocked,
the **Replay sound** button provides a user gesture. The visual joke and caption
always work without audio.
