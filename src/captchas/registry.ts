import { pickWeightedCaptcha } from './selection';
import type { CaptchaModule } from './types';
import { validateCaptchaModules } from './validation';

const discovered = import.meta.glob('./*/index.tsx', { eager: true });

// Sorted by `order` (unordered ones last), then by folder name.
const captchas = sortByOrder(
  validateCaptchaModules(
    Object.entries(discovered)
      .filter(([path]) => !path.split('/')[1]?.startsWith('_'))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([path, module]) => ({ path, module })),
  ),
);

export function sortByOrder(modules: readonly CaptchaModule[]): CaptchaModule[] {
  // Array.prototype.sort is stable, so equal orders keep their folder-name order.
  return [...modules].sort(
    (left, right) => (left.order ?? Infinity) - (right.order ?? Infinity) || 0,
  );
}

/** The CAPTCHA after `lastId` in the sequence, looping back to the first. */
export function nextInSequence(
  modules: readonly CaptchaModule[],
  lastId?: string,
): CaptchaModule | undefined {
  const index = modules.findIndex(({ id }) => id === lastId);
  return modules[(index + 1) % modules.length];
}

export function getAllCaptchas(): CaptchaModule[] {
  return [...captchas];
}

export function getCaptchaById(id: string): CaptchaModule | undefined {
  return captchas.find((captcha) => captcha.id === id);
}

/** What the login flow uses: the CAPTCHAs in `order`, one after another. */
export function pickNextCaptcha(lastId?: string): CaptchaModule | undefined {
  return nextInSequence(captchas, lastId);
}

/** Weighted random pick. Not used by the flow right now; kept for a shuffle mode. */
export function pickRandomCaptcha(excludeId?: string): CaptchaModule | undefined {
  return pickWeightedCaptcha(captchas, excludeId);
}
