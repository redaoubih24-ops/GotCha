import { useRef, useState } from 'react';
import type { CaptchaModule, CaptchaProps } from '../types';
import './terms-and-conditions.css';

function TermsAndConditions({ onComplete }: CaptchaProps) {
  const completed = useRef(false);
  const [agreed, setAgreed] = useState(false);

  function sign() {
    if (!agreed || completed.current) return;
    completed.current = true;
    onComplete({
      outcome: 'fail',
      reason: 'You read the terms. Our lawyers have confirmed that no real human does that.',
      memeTag: 'terms',
    });
  }

  return (
    <section className="terms-captcha" aria-labelledby="terms-title">
      <p className="terms-captcha__eyebrow">Department of unnecessary paperwork</p>
      <h2 id="terms-title">Terms &amp; Conditions</h2>
      <p>One tiny agreement stands between you and being a person.</p>
      <div className="terms-captcha__contract" role="region" aria-label="Absurd terms of service">
        <span className="terms-captcha__stamp" aria-hidden="true">
          LEGALLY SILLY
        </span>
        <p>By proceeding, you hereby agree to:</p>
        <ol>
          <li>Return every borrowed pen, including the one from 2014.</li>
          <li>Maintain eye contact with the loading spinner.</li>
          <li>Appoint one emotional support spreadsheet.</li>
          <li>Accept cookies. Specifically, oatmeal raisin.</li>
        </ol>
        <p className="terms-captcha__footnote">Section 42(b): this agreement agrees with itself.</p>
      </div>
      <label className="terms-captcha__agreement">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        <span>I have read, understood, and emotionally processed the terms.</span>
      </label>
      <button className="terms-captcha__submit" type="button" disabled={!agreed} onClick={sign}>
        I agree to absolutely everything <span aria-hidden="true">↗</span>
      </button>
    </section>
  );
}

const captcha: CaptchaModule = {
  id: 'terms-and-conditions',
  title: 'Terms & Conditions',
  author: 'GotCha team',
  weight: 1,
  Component: TermsAndConditions,
};

export default captcha;
