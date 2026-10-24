import type { CaptchaModule, CaptchaResult } from '../captchas/types';

/**
 * The whole app is one loop:
 *
 *   login --SUBMIT--> captcha --COMPLETE--> meme --DONE--> login
 *
 * Every state carries the running history so the login page can escalate its
 * copy and the picker can avoid repeating the previous challenge. Actions that
 * arrive in the wrong state (a late onComplete, a double-clicked submit, a
 * second onDone) return the current state unchanged.
 */

interface FlowHistory {
  /** Completed challenges so far. Every one counts as a failed login. */
  attemptCount: number;
  /** The challenge shown most recently, so the next pick can avoid it. */
  lastCaptchaId?: string;
  /** The most recent result, kept so the meme can animate out after DONE. */
  lastResult?: CaptchaResult;
}

export type FlowState =
  | ({ stage: 'login' } & FlowHistory)
  | ({ stage: 'captcha'; captcha: CaptchaModule } & FlowHistory)
  | ({ stage: 'meme'; result: CaptchaResult } & FlowHistory);

export type FlowStage = FlowState['stage'];

export type FlowAction =
  | { type: 'SUBMIT'; captcha: CaptchaModule }
  | { type: 'COMPLETE'; result: CaptchaResult }
  | { type: 'DONE' };

export const initialFlow: FlowState = { stage: 'login', attemptCount: 0 };

function history({ attemptCount, lastCaptchaId, lastResult }: FlowState): FlowHistory {
  return { attemptCount, lastCaptchaId, lastResult };
}

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'SUBMIT':
      if (state.stage !== 'login') return state;
      return { ...history(state), stage: 'captcha', captcha: action.captcha };

    case 'COMPLETE':
      if (state.stage !== 'captcha') return state;
      return {
        stage: 'meme',
        result: action.result,
        attemptCount: state.attemptCount + 1,
        lastCaptchaId: state.captcha.id,
        lastResult: action.result,
      };

    case 'DONE':
      if (state.stage !== 'meme') return state;
      return { ...history(state), stage: 'login' };
  }
}
