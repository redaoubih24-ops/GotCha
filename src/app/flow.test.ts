import { describe, expect, it } from 'vitest';
import type { CaptchaModule } from '../captchas/types';
import { flowReducer, initialFlow } from './flow';

const captcha: CaptchaModule = {
  id: 'test',
  title: 'Test',
  author: 'GotCha',
  Component: () => null,
};

describe('login flow', () => {
  it.each(['fail', 'pass'] as const)(
    'returns to login after a %s and remembers the last challenge',
    (outcome) => {
      const started = flowReducer(initialFlow, { type: 'START', captcha });
      const completed = flowReducer(started, {
        type: 'COMPLETE',
        result: { outcome, reason: 'Humanity uncertain.' },
      });
      expect(completed.stage).toBe('meme');
      expect(flowReducer(completed, { type: 'RESET' })).toEqual({
        stage: 'login',
        lastCaptchaId: 'test',
      });
    },
  );

  it('ignores late completion callbacks and repeated start attempts', () => {
    expect(
      flowReducer(initialFlow, { type: 'COMPLETE', result: { outcome: 'fail', reason: 'Late' } }),
    ).toBe(initialFlow);
    const started = flowReducer(initialFlow, { type: 'START', captcha });
    expect(flowReducer(started, { type: 'START', captcha })).toBe(started);
    const completed = flowReducer(started, {
      type: 'COMPLETE',
      result: { outcome: 'fail', reason: 'First' },
    });
    expect(
      flowReducer(completed, {
        type: 'COMPLETE',
        result: { outcome: 'pass', reason: 'Duplicate' },
      }),
    ).toBe(completed);
  });
});
