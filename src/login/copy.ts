/**
 * Jokes for the login page. Anyone can add lines here.
 *
 * To avoid merge conflicts, add your line on its own line, anywhere in the list.
 * Order doesn't matter: lines are sorted by `from` at runtime.
 *
 * House rules (see src/brand/voice.md): short, dry, suspicious of the
 * machine, never mean about the person.
 */

export interface AttemptLine {
  /** Shown once the user has failed at least this many times. */
  from: number;
  text: string;
}

export const attemptLines: AttemptLine[] = [
  { from: 1, text: 'Hmm. Let’s call that a warm-up.' },
  { from: 2, text: 'Our totally scientific system has concerns.' },
  { from: 3, text: 'Still here?' },
  { from: 4, text: 'Bold of you to keep being a person.' },
  { from: 5, text: 'We’ve escalated this to a more suspicious checkbox.' },
  { from: 6, text: 'Your persistence has been noted. In red pen.' },
  { from: 7, text: 'We’ve notified your mother.' },
  { from: 9, text: 'The robots have started rooting for you.' },
  { from: 12, text: 'At this point you’re basically staff.' },
  { from: 20, text: 'We’re legally required to call this a hobby now.' },
];

/** Cycled through, in order, each time someone clicks “Forgot password?”. */
export const forgotPasswordLines: string[] = [
  'Have you tried remembering harder?',
  'Reset link sent to a fax machine in 2009.',
  'Your password hint is: it’s your password.',
  'We forgot it too. We’re in this together.',
  'Try the one from your Neopets account.',
  'A carrier pigeon has been dispatched. It is also lost.',
];

/** The funniest line the user has earned, or undefined before their first failure. */
export function lineForAttempt(
  attemptCount: number,
  lines: readonly AttemptLine[] = attemptLines,
): string | undefined {
  let best: AttemptLine | undefined;
  for (const line of lines) {
    if (line.from <= attemptCount && (!best || line.from >= best.from)) best = line;
  }
  return best?.text;
}
