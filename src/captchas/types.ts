import type React from 'react';

export type CaptchaResult = {
  outcome: 'fail' | 'pass';
  reason: string;
  memeTag?: string;
};

export interface CaptchaProps {
  onComplete: (r: CaptchaResult) => void;
}

export interface CaptchaModule {
  id: string;
  title: string;
  author: string;
  /** Relative odds of being selected. Must be finite and greater than zero. */
  weight?: number;
  Component: React.FC<CaptchaProps>;
}
