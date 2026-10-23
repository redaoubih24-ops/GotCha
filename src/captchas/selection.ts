import type { CaptchaModule } from './types';

/** Pick from validated modules; exclusions only apply when another module exists. */
export function pickWeightedCaptcha(
  captchas: readonly CaptchaModule[],
  excludeId?: string,
): CaptchaModule | undefined {
  const alternatives = captchas.filter(({ id }) => id !== excludeId);
  const candidates = alternatives.length > 0 ? alternatives : captchas;

  if (candidates.length === 0) return undefined;

  // Normalizing prevents the sum of individually valid weights from overflowing.
  const maxWeight = Math.max(...candidates.map(({ weight = 1 }) => weight));
  const weights = candidates.map(({ weight = 1 }) => weight / maxWeight);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const target = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (const [index, captcha] of candidates.entries()) {
    cumulativeWeight += weights[index] ?? 0;
    if (target < cumulativeWeight) return captcha;
  }

  // Floating-point rounding at the upper boundary must still produce a module.
  return candidates[candidates.length - 1];
}
