import { useRef } from 'react';
import type { CaptchaModule, CaptchaProps } from '../types';
import './template.css';

function StarterCaptcha({ onComplete }: CaptchaProps) {
  const completed = useRef(false);

  function finish() {
    if (completed.current) return;
    completed.current = true;
    onComplete({
      outcome: 'fail',
      reason: 'The CAPTCHA has reviewed your application and chosen chaos.',
      memeTag: 'default',
    });
  }

  return (
    <section className="starter-captcha" aria-labelledby="starter-captcha-title">
      <p className="starter-captcha__eyebrow">A completely reasonable request</p>
      <h2 id="starter-captcha-title">Replace this with your impossible task.</h2>
      <p>Keep all your components, styles, and assets in this folder.</p>
      <button className="starter-captcha__button" type="button" onClick={finish}>
        Submit my best guess
      </button>
    </section>
  );
}

// Copy this entire folder, remove the leading underscore, and change these fields.
const captcha: CaptchaModule = {
  id: 'your-unique-captcha-id',
  title: 'Your absurd CAPTCHA',
  author: 'Your name',
  weight: 1,
  Component: StarterCaptcha,
};

export default captcha;
