import { Component } from 'react';
import type { ReactNode } from 'react';
import type { CaptchaResult } from '../captchas/types';

/** What a crashed CAPTCHA reports. To the user, it's just another failure. */
export const CRASH_RESULT: CaptchaResult = {
  outcome: 'fail',
  reason: 'The captcha gave up on you.',
  memeTag: 'crash',
};

interface CaptchaErrorBoundaryProps {
  children: ReactNode;
  /** Called once when the CAPTCHA throws while rendering or in an effect. */
  onCrash: (error: unknown) => void;
}

interface CaptchaErrorBoundaryState {
  crashed: boolean;
}

/**
 * Keeps one broken CAPTCHA from blanking the whole site. React still logs the
 * original error to the console in development, so the author can find it.
 *
 * Note: React error boundaries don't catch errors thrown inside event handlers
 * or timers. Those don't unmount the tree, so the CAPTCHA's own timeout still applies.
 */
export default class CaptchaErrorBoundary extends Component<
  CaptchaErrorBoundaryProps,
  CaptchaErrorBoundaryState
> {
  state: CaptchaErrorBoundaryState = { crashed: false };

  static getDerivedStateFromError(): CaptchaErrorBoundaryState {
    return { crashed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onCrash(error);
  }

  render() {
    if (this.state.crashed) {
      return (
        <p className="challenge-crashed" role="status">
          This CAPTCHA has left the building.
        </p>
      );
    }
    return this.props.children;
  }
}
