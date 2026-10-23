import { pickWeightedCaptcha } from './selection';
import type { CaptchaModule } from './types';
import { validateCaptchaModules } from './validation';

const discovered = import.meta.glob('./*/index.tsx', { eager: true });

const captchas = validateCaptchaModules(
  Object.entries(discovered)
    .filter(([path]) => !path.split('/')[1]?.startsWith('_'))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, module]) => ({ path, module })),
);

export function getAllCaptchas(): CaptchaModule[] {
  return [...captchas];
}

export function getCaptchaById(id: string): CaptchaModule | undefined {
  return captchas.find((captcha) => captcha.id === id);
}

export function pickRandomCaptcha(excludeId?: string): CaptchaModule | undefined {
  return pickWeightedCaptcha(captchas, excludeId);
}
