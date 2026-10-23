import { useRef, useState } from 'react';
import type { CaptchaModule, CaptchaProps } from '../types';
import './stable-handshake.css';

function StableHandshake({ onComplete }: CaptchaProps) {
  const completed = useRef(false);
  const [checked, setChecked] = useState(false);

  function verify() {
    if (completed.current) return;
    completed.current = true;
    setChecked(true);
    onComplete({
      outcome: 'fail',
      reason: 'Your click was suspiciously accurate. Please install a little more human error.',
      memeTag: 'robot',
    });
  }

  return (
    <section className="handshake-captcha" aria-labelledby="handshake-title">
      <div className="handshake-captcha__art" aria-hidden="true">
        <span>☞</span>
        <span>☜</span>
      </div>
      <p className="handshake-captcha__eyebrow">Human verification · probably</p>
      <h2 id="handshake-title">Stable Handshake</h2>
      <p className="handshake-captcha__description">
        Check the box with the natural, imperfect confidence of a human who has definitely paid
        taxes.
      </p>
      <label className="handshake-captcha__check">
        <input type="checkbox" checked={checked} disabled={checked} onChange={verify} />
        <span>I am a perfectly normal human.</span>
        <span className="handshake-captcha__seal" aria-hidden="true">
          HUMAN™
        </span>
      </label>
      <p className="handshake-captcha__fine-print">Precision tolerance: emotionally unavailable.</p>
    </section>
  );
}

const captcha: CaptchaModule = {
  id: 'stable-handshake',
  title: 'Stable Handshake',
  author: 'GotCha team',
  Component: StableHandshake,
};

export default captcha;
