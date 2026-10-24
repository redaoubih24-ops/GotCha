# GotCha memes

The active manifest uses 37 user-supplied pictures copied from `Hackathonpicss/` into this directory. The source folder is unchanged. These pictures are user-provided; their original authors and licenses have not been verified. They are not covered by the original placeholder artwork's provenance claim. Use original or royalty-free assets for any replacements and record their author, source, and license here.

Each entry in `manifest.json` contains `id`, `image`, `sound`, and `tags`. `caption` is the top meme text; `bottomText` is the bottom text. Both are rendered directly over the picture in large outlined letters. `alt` describes the picture for screen readers. An optional `stillImage` supplies a static alternative to animation.

Edit `caption` and `bottomText` to change a joke. **Sound:** every meme plays a random clip from `public/memes/sounds/` (never the same clip twice in a row), so the manifest's `sound` field is ignored by the transition. To add a clip, drop the file in `sounds/` and add it to `SOUNDS` in `src/meme/assets.ts`. The `/playground/memes` preview still plays each entry's manifest sound. Old original SVG placeholders and synthesized WAVs are retained as spare assets but are not in the active manifest.

Preview all captioned images and sounds at `/playground/memes`. The transition opens with a 1.5-second fireball (`effects/explosion.webm` and `.mp4`, fire on black, blended with `mix-blend-mode: screen` in `src/meme/Explosion.tsx`), then keeps the temporary blur, minimum 3.5-second display, and 600ms fade back to login. The white flash is still there but set to 0 brightness, since a white flash would hide the fire. Entrance settings are CSS variables at `.meme-cinema` in `src/meme/meme.css`. Reduced motion skips the effects. There are no visible app controls; captions are part of the meme.

The existing `MemeModal` adapter imports a standalone playground route bootstrap because the app route switch is outside this feature's edit scope. A future shared router can route `MemePlayground` directly and remove `playgroundRoute.tsx`. New callers can import `MemeTransition` from `src/meme` with `open`, `result`, and `onDone`.
