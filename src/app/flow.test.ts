import { describe, expect, it } from 'vitest';
import type { CaptchaModule, CaptchaResult } from '../captchas/types';
import { flowReducer, initialFlow } from './flow';

const captcha: CaptchaModule = {
  id: 'test',
  title: 'Test',
  author: 'GotCha',
  Component: () => null,
};

const fail: CaptchaResult = { outcome: 'fail', reason: 'Humanity uncertain.' };

describe('login flow', () => {
  it.each(['fail', 'pass'] as const)(
    'walks login → captcha → meme → login after a %s',
    (outcome) => {
      const result = { outcome, reason: 'Humanity uncertain.' };
      const started = flowReducer(initialFlow, { type: 'SUBMIT', captcha });
      expect(started).toMatchObject({ stage: 'captcha', captcha, attemptCount: 0 });

      const completed = flowReducer(started, { type: 'COMPLETE', result });
      expect(completed).toMatchObject({
        stage: 'meme',
        result,
        attemptCount: 1,
        lastCaptchaId: 'test',
      });

      expect(flowReducer(completed, { type: 'DONE' })).toEqual({
        stage: 'login',
        attemptCount: 1,
        lastCaptchaId: 'test',
        lastResult: result,
      });
    },
  );

  it('counts every completed attempt', () => {
    let state = initialFlow;
    for (let i = 0; i < 3; i += 1) {
      state = flowReducer(state, { type: 'SUBMIT', captcha });
      state = flowReducer(state, { type: 'COMPLETE', result: fail });
      state = flowReducer(state, { type: 'DONE' });
    }
    expect(state).toMatchObject({ stage: 'login', attemptCount: 3 });
  });

  it('ignores actions that arrive in the wrong state', () => {
    expect(flowReducer(initialFlow, { type: 'COMPLETE', result: fail })).toBe(initialFlow);
    expect(flowReducer(initialFlow, { type: 'DONE' })).toBe(initialFlow);

    const started = flowReducer(initialFlow, { type: 'SUBMIT', captcha });
    expect(flowReducer(started, { type: 'SUBMIT', captcha })).toBe(started);
    expect(flowReducer(started, { type: 'DONE' })).toBe(started);

    const completed = flowReducer(started, { type: 'COMPLETE', result: fail });
    expect(
      flowReducer(completed, { type: 'COMPLETE', result: { outcome: 'pass', reason: 'Late' } }),
    ).toBe(completed);
    expect(flowReducer(completed, { type: 'SUBMIT', captcha })).toBe(completed);
  });
});
