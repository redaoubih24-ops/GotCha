# Duck Tax Fraud

Open `/?captcha=duck-tax-fraud` and start the fake login, or launch **Duck Tax Fraud** from `/playground`.

## Make it yours

- **Question and failure message:** edit the named constants near the top of `index.tsx`.
- **Duck photo:** replace `duck.png` with your own photo, or change its import in `index.tsx`. Keep the extension lowercase (`.png` or `.jpg`) so Vite's TypeScript declarations recognize it. Every tile intentionally uses this same file.
- **Selection and result:** the component remembers one selected duck. The verify handler always calls `onComplete` with a failure; change that handler to try different rules. The app handles the meme, sound, and return to login.
- **Appearance:** edit `duck-tax-fraud.css`. Its comments identify the three-column grid, tile sizes, selected state, and verify button.
- **Registry details:** change `id`, `title`, `author`, or `weight` in the module at the bottom of `index.tsx`. If you copy this folder, give the new CAPTCHA a unique ID. Update your own tests when changing the intended behavior.

Keep your code, tests, and assets in this folder. No shared registry, app, or meme changes are needed.

## Photo provenance

The current project image is `duck.png`. The browser downloads this one local photo and reuses it in all nine tiles. Its extension was normalized from `.PNG` without changing the image bytes.

The original starter photo was created with the built-in image generator for this project. Its prompt is retained below as a reference if you want to generate another version.

Generation prompt:

> Use case: photorealistic-natural. Asset type: one square photograph for a deliberately absurd duck CAPTCHA game. Primary request: an ordinary adult male mallard duck with emerald green head, yellow bill, brown breast and gray body, standing on a quiet grassy pond bank. Eye-level wildlife photograph, single duck clearly centered and filling most of the frame, entire head and body visible, soft natural daylight, shallow depth of field and softly blurred pond reeds behind it. Realistic feathers, natural anatomy, natural colors. Its expression is calmly inscrutable. This single picture will be repeated identically nine times by the application's code; generate ONLY ONE photographic image, not a grid, collage, screenshot or UI. No lettering, numbers, logos, watermark, clothing, human hands, extra ducks or accessories. Opaque full image, square composition.
