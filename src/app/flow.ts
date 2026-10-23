import type { CaptchaModule, CaptchaResult } from '../captchas/types';

export type FlowState =
  | { stage: 'login'; lastCaptchaId?: string }
  | { stage: 'captcha'; captcha: CaptchaModule }
  | { stage: 'meme'; captcha: CaptchaModule; result: CaptchaResult };

export type FlowAction =
  | { type: 'START'; captcha: CaptchaModule }
  | { type: 'COMPLETE'; result: CaptchaResult }
  | { type: 'RESET' };

export const initialFlow: FlowState = { stage: 'login' };

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'START':
      return state.stage === 'login' ? { stage: 'captcha', captcha: action.captcha } : state;
    case 'COMPLETE':
      return state.stage === 'captcha'
        ? { stage: 'meme', captcha: state.captcha, result: action.result }
        : state;
    case 'RESET':
      return state.stage === 'login' ? state : { stage: 'login', lastCaptchaId: state.captcha.id };
  }
}
