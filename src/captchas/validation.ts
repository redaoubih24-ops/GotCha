import type { CaptchaModule } from './types';

export interface DiscoveredCaptcha {
  path: string;
  module: unknown;
}

function invalid(path: string, problem: string): never {
  throw new Error(`Invalid CAPTCHA at ${path}: ${problem}`);
}

/** Validate the files found by Vite before exposing them to the app. */
export function validateCaptchaModules(entries: DiscoveredCaptcha[]): CaptchaModule[] {
  const ids = new Map<string, string>();

  return entries.map(({ path, module }) => {
    if (typeof module !== 'object' || module === null || !('default' in module)) {
      return invalid(path, 'index.tsx must default-export a CaptchaModule.');
    }

    const candidate: unknown = module.default;

    if (typeof candidate !== 'object' || candidate === null) {
      return invalid(path, 'the default export must be a CaptchaModule object.');
    }

    const fields = candidate as Record<string, unknown>;

    for (const field of ['id', 'title', 'author'] as const) {
      const value = fields[field];
      if (typeof value !== 'string' || value.trim().length === 0) {
        return invalid(path, `"${field}" must be a nonempty string.`);
      }
    }

    if (typeof fields.Component !== 'function') {
      return invalid(path, '"Component" must be a React function component.');
    }

    if (
      fields.weight !== undefined &&
      (typeof fields.weight !== 'number' || !Number.isFinite(fields.weight) || fields.weight <= 0)
    ) {
      return invalid(path, '"weight" must be a finite number greater than zero.');
    }

    // The checks above validate each field in the shared TypeScript contract.
    const captcha = candidate as unknown as CaptchaModule;
    const previousPath = ids.get(captcha.id);

    if (previousPath !== undefined) {
      return invalid(
        path,
        `duplicate id "${captcha.id}" is also used by ${previousPath}. Choose a unique id.`,
      );
    }

    ids.set(captcha.id, path);
    return captcha;
  });
}
