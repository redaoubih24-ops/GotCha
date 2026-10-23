# GotCha

A fake login. An absurd CAPTCHA. A humiliating meme. Back to square one.

GotCha is a hackathon playground for deliberately unfair CAPTCHA games. A user attempts a pretend login, receives a random challenge, usually fails, sees a meme transition with sound, and returns to the login screen. Several developers can ship challenges at the same time without editing a shared list.

Built with React 18, Vite, TypeScript, Vitest, React Testing Library, ESLint, Prettier, and npm. No backend. Use made-up login details; never enter or collect real credentials.

## Run locally

Install Node.js 24 (the version in `.nvmrc`) and npm, then:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The starter login, CAPTCHA, and meme transition work together from the first run.

| Command                | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Start Vite with live reload                           |
| `npm run build`        | Typecheck and create the production build             |
| `npm run preview`      | Preview the production build locally                  |
| `npm run lint`         | Check lint rules, including CAPTCHA import boundaries |
| `npm run typecheck`    | Check TypeScript without emitting files               |
| `npm test`             | Run tests once                                        |
| `npm run test:watch`   | Run tests in watch mode                               |
| `npm run format`       | Format the repo                                       |
| `npm run format:check` | Check formatting                                      |
| `npm run check`        | Run the full local quality gate                       |

## Where things live

```text
src/
  app/                 App shell, routes, and flow state
  brand/               Shared design tokens, logo, and brand voice
  captchas/
    _template/         Copyable starter; never selected at random
    <your-captcha>/    One developer's complete challenge
    registry.ts        Automatic discovery and weighted selection
    types.ts           Shared CAPTCHA contract
  login/               Pretend login screen
  meme/                Meme transition and audio
public/
  memes/               Bundled images, GIFs, audio, and manifest.json
```

The meme assets bundled with this scaffold are original placeholders. Add media and update the manifest through the meme owner so parallel CAPTCHA work stays isolated.

## Add a CAPTCHA in 5 steps

1. **Create your branch and folder.** Branch from current `main` as `captcha/<name>`, then copy `src/captchas/_template/` to `src/captchas/<your-slug>/`. Keep all your work in that new folder. Folder names starting with `_` are excluded from discovery.
2. **Make the module yours.** In your folder's `index.tsx`, rename the component and set a unique `id`, a human-readable `title`, and your `author` name. Default-export a `CaptchaModule`; optionally set a positive `weight` (default: `1`). You do not edit `registry.ts` or another central list.
3. **Build inside your boundary.** Keep styles, helpers, and assets in your own folder. Your implementation may import its own files, `src/captchas/types.ts`, and `src/brand/`. React runtime/type imports are also allowed. Do not import app state, login or meme components, the registry, sibling CAPTCHAs, or other packages. ESLint enforces the boundary for each CAPTCHA folder.
4. **Complete through the callback.** Receive `onComplete` through `CaptchaProps` and call it once with `{ outcome: 'fail', reason: 'Your ridiculous explanation', memeTag: 'optional-tag' }` or an occasional `'pass'`. The app owns the transition, sound, and return to login. Clean up timers and event listeners when your component unmounts.
5. **Try it and open a PR.** Visit `/playground` to launch your challenge in isolation, or use `/?captcha=<your-id>` to exercise the login flow with your challenge forced. Add useful behavior tests in your folder, run `npm run check`, record a short demo, and open a PR to `main` using the template.

The shared contract is:

```ts
export type CaptchaResult = {
  outcome: 'fail' | 'pass';
  reason: string;
  memeTag?: string;
};

export interface CaptchaProps {
  onComplete: (r: CaptchaResult) => void;
}

export interface CaptchaModule {
  id: string;
  title: string;
  author: string;
  weight?: number;
  Component: React.FC<CaptchaProps>;
}
```

Treat completion as the end of your challenge. Avoid real credential collection, external requests, global state, and global CSS selectors. Use the shared brand variables and namespace your component styles.

## Discovery and developer routes

`src/captchas/registry.ts` uses Vite's eager `import.meta.glob('./*/index.tsx', { eager: true })` to load modules. Folders beginning with `_` are skipped. The registry exports:

- `getAllCaptchas()` — all playable CAPTCHA modules.
- `getCaptchaById(id)` — find a module by its unique ID.
- `pickRandomCaptcha(excludeId?)` — select by relative `weight`, avoiding `excludeId` when another CAPTCHA is available. With only one CAPTCHA, that CAPTCHA can repeat.

The registry test checks every discovered module for required metadata, a component, valid weights, and duplicate IDs. Missing or invalid module exports fail the checks instead of silently disappearing.

- `/?captcha=<id>` forces a known CAPTCHA throughout the login flow; remove the query parameter to restore random selection.
- `/playground` lists every playable CAPTCHA and lets you launch, complete, and reset one without the login or meme sequence.

Static hosting must serve `index.html` for unknown paths so a direct visit to `/playground` works. Vite's development server handles this locally.

## Work together with minimal conflicts

Each CAPTCHA developer owns one new folder and uses a `captcha/<name>` branch. Put its tests and assets there too. Automatic discovery means adding a challenge never requires editing a central registry, route, stylesheet, or manifest.

Choose one owner each for `src/app/`, `src/login/`, `src/meme/`, and `src/brand/`. Ask those owners to handle shared changes in a separate PR. Keep dependency and lockfile changes coordinated. The team lead should replace the commented placeholders in `.github/CODEOWNERS` with real GitHub handles or teams before enabling required reviews.

PR flow: sync with `main`, make a focused change, run `npm run check`, open a PR to `main`, attach a screen recording, get a teammate review, and merge after CI passes. Prefer squash merging. See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete collaboration rules.

## Create the GitHub repository

Run these commands from this project directory after installing dependencies and checking the app. They create a public GitHub repository called `GotCha` under the account you select in GitHub CLI:

```sh
git init -b main
git add .
git commit -m "Initial GotCha hackathon scaffold"
gh auth login
gh repo create GotCha --public --source=. --remote=origin --push
```

If GitHub CLI is already authenticated, `gh auth status` can confirm the account before you run `gh repo create`.

## License

[MIT](LICENSE) © 2026 GotCha contributors.
