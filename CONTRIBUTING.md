# Contributing to GotCha

The goal is to make delightfully absurd CAPTCHA games while keeping parallel work independent.

## Own a small area

- CAPTCHA developers work only in `src/captchas/<their-slug>/`, including that challenge's tests, styles, and assets.
- One designated owner each maintains `src/app/`, `src/login/`, `src/meme/`, and `src/brand/`.
- Coordinate changes to shared tooling, dependencies, the lockfile, and `public/memes/` before editing them. Open a separate PR for shared changes.
- The team lead replaces the commented ownership examples in `.github/CODEOWNERS` with actual GitHub users or teams.

No registry edits are needed when adding a CAPTCHA. Copy `_template`, default-export your module, and automatic discovery handles the rest. Folders starting with `_` are excluded from the playable pool.

## Start a change

1. Sync your local `main` with the repository.
2. Create a branch named `captcha/<name>` for a new CAPTCHA. Use `fix/<name>`, `chore/<name>`, or `docs/<name>` for other focused work.
3. Follow the [five-step CAPTCHA guide](README.md#add-a-captcha-in-5-steps).
4. Keep commits focused and avoid unrelated formatting or dependency changes.

## CAPTCHA boundary

A CAPTCHA implementation may import only its own folder, `src/captchas/types.ts`, and `src/brand/`, plus React runtime/types. Use type-only imports for the shared interfaces. Do not reach into sibling CAPTCHA folders, app flow, login, meme, or registry code. Do not add new packages as an individual CAPTCHA change. ESLint checks the folder-specific import rules.

Use `CaptchaProps.onComplete` to report a result. Call it once, then let the app handle the meme and login flow. Provide a clear `reason`; use `memeTag` only when useful. Clean up timers and listeners on unmount. Keep CSS scoped to your component and use the brand tokens.

This is a fake login with no backend. Never collect real credentials, add telemetry, or send user input to external services. Keep challenge assets local, and use media you have permission to distribute. Avoid flashing effects and offer controls that work with a keyboard.

## Verify and open a PR

```sh
npm ci
npm run check
```

Try your CAPTCHA from `/playground`, then test the complete login sequence with `/?captcha=<your-id>`. Check narrow and wide screens, keyboard interaction, repeat launches, and cleanup after leaving the challenge. Tests should verify useful behavior and completion outcomes.

Open a PR against `main`, fill in the provided template, and attach a short screen recording. Describe the challenge and any shared changes clearly. Get a teammate review and wait for CI before merging. Prefer squash merging, then delete the merged branch.

If another developer needs shared code, agree on a small contract with the relevant owner and land that change separately before depending on it. Do not solve a shared need by importing another developer's CAPTCHA internals.
