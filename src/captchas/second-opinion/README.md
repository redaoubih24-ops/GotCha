# Second Opinion

A CAPTCHA with trust issues about its own eyes. The first three images each have two valid interpretations. The verifier rejects your choice once per image, claims the opposite answer was correct, and immediately moves on. After three corrections, it brings out an obvious circle and finally accepts either answer.

Open `/?captcha=second-opinion` and start the fake login to try the full flow, or launch **Second Opinion** from `/playground` to inspect its result in isolation.

## What happens

1. On the vase/faces image, choose either interpretation and select **Verify**. Your answer is rejected, the opposite of your actual choice is given as the correction, and the next image appears immediately.
2. Do the same for the cube and duck/rabbit images. Each is rejected exactly once before advancing. There are **three corrections across four images**, with no retries on the same image and no separate **Next image** button.
3. While the next image is shown, the correction stays visible and explicitly refers to the **previous image**. It does not claim to describe the image currently on screen. The next verification replaces that correction.
4. The fourth image is an obvious circle. For **“What shape is this?”**, both **Circle** and **Definitely a circle** are valid and accepted. Choose either and select **Verify** to receive the acceptance.
5. Choose **Finish verification** after the circle is accepted. Only this final action calls `onComplete`, with `outcome: 'pass'` and `memeTag: 'second-opinion'`.

You cannot skip an image: each requires a selection and verification before the sequence advances. Intermediate corrections never complete the CAPTCHA. The final circle cannot produce a losing answer.

The existing app handles the meme, sound, return to login, and a different random CAPTCHA on the next login attempt. Remove the `?captcha=second-opinion` development override to restore random selection. The playground intentionally displays the result instead of running the meme/login sequence.

## Change your own version

- **Images, questions, and answer labels:** edit the four entries in `FIGURES` in `content.ts`. Each imports a local SVG from `assets/` and supplies `question`, `caption`, and exactly two valid `answers`. The first three entries use `kind: 'ambiguous'`; the final `circle.svg` entry uses `kind: 'obvious'`.
- **Sequence and verdicts:** edit the commented verification handler in `index.tsx`. An ambiguous image gets one rejection, using the opposite of the answer just submitted, then advances immediately. The obvious image accepts either answer. There is no per-image rejection counter.
- **Correction wording:** keep the previous image and the actual submitted answer identified in the correction so it remains clear after automatic advancement.
- **Layout and colors:** edit `second-opinion.css`. The diagrams stay in one shared frame, with enough room for the answer choices and the previous image's correction.
- **Final result and meme tag:** edit the completion handler in `index.tsx`. Keep the callback there so intermediate rejections do not dismiss the CAPTCHA.
- **Registry metadata:** edit the default-exported module at the bottom of `index.tsx`. A copied version needs a unique `id`.

Keep implementation changes in this folder. Tests live here too; update them when intentionally changing the rules.

## Add your meme later

The CAPTCHA already sends the tag `second-opinion`. Until a matching meme exists, the app uses its normal default transition.

The following is a placeholder example for your future meme, not an active asset. When you have the files, place them in `public/memes/` and ask the meme owner to add an entry like this to the existing `memes` array in `public/memes/manifest.json`:

```json
{
  "id": "second-opinion-meme",
  "tags": ["second-opinion"],
  "image": "second-opinion-meme.gif",
  "stillImage": "second-opinion-meme-still.png",
  "audio": "tiny-trombone.mp3",
  "alt": "Describe the meme you add here.",
  "caption": "Three wrong answers. We brought out the circle."
}
```

Use filenames that exist in `public/memes/`. The existing audio can stay until you add your own sound. A static `stillImage` lets the app respect reduced-motion preferences. Keep the manifest's media provenance accurate when adding your own files.

## Image sources

These diagrams are bundled locally, so the CAPTCHA needs no image downloads or backend. See `assets/README.md` for the individual figures and their source notes.
