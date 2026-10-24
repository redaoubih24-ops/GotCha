import { useId, useRef, useState } from 'react';
import type { CaptchaModule, CaptchaProps } from '../types';
// Replace this one file to change the photo. Every tile intentionally repeats it unchanged.
// Keep the extension lowercase so Vite's image type declarations recognize it.
import duckImage from './duck.png';
import './duck-tax-fraud.css';

// Change the copy here when making your own version of this CAPTCHA.
const QUESTION = 'Which duck committed tax fraud?';
const FAILURE_REASON = 'Incorrect. That duck is merely an accountant.';
// Nine suspects make a 3 × 3 grid. If you change this count, check the grid rule in the CSS too.
const DUCK_COUNT = 9;

function DuckTaxFraud({ onComplete }: CaptchaProps) {
  const groupId = useId();
  // Native radios keep selection and arrow-key navigation familiar; selection alone does not finish.
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const completed = useRef(false);

  function verify() {
    // Tell the app the result once, even if someone submits twice before the modal disappears.
    if (selected === null || completed.current) return;
    completed.current = true;
    setSubmitted(true);
    // Change outcome/reason to customize the verdict. The app handles the meme and return to login.
    onComplete({ outcome: 'fail', reason: FAILURE_REASON, memeTag: 'default' });
  }

  return (
    <section className="duck-tax" aria-labelledby={`${groupId}-question`}>
      <p className="duck-tax__eyebrow">Department of suspicious deductions</p>
      <h2 className="duck-tax__title" id={`${groupId}-question`}>
        {QUESTION}
      </h2>
      <p className="duck-tax__instruction" id={`${groupId}-instruction`}>
        Select the financially suspicious duck.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          verify();
        }}
      >
        <fieldset
          className="duck-tax__fieldset"
          aria-labelledby={`${groupId}-question`}
          aria-describedby={`${groupId}-instruction`}
          disabled={submitted}
        >
          <legend className="duck-tax__sr-only">Choose one duck</legend>
          <div className="duck-tax__grid">
            {Array.from({ length: DUCK_COUNT }, (_, index) => (
              <label className="duck-tax__tile" key={index}>
                <input
                  className="duck-tax__radio"
                  type="radio"
                  name={`${groupId}-suspect`}
                  value={index}
                  aria-label={`Duck ${index + 1}`}
                  checked={selected === index}
                  onChange={() => setSelected(index)}
                />
                <span className="duck-tax__image-frame">
                  <img
                    className="duck-tax__image"
                    src={duckImage}
                    alt="A duck with no obvious tax records."
                  />
                  {selected === index && (
                    <span className="duck-tax__selected" aria-hidden="true">
                      ✓ Selected
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="duck-tax__footer">
          <p>{DUCK_COUNT} suspects. 0 receipts.</p>
          <button
            className="duck-tax__verify"
            type="submit"
            disabled={selected === null || submitted}
          >
            Verify <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </section>
  );
}

// For your own CAPTCHA, give id a unique folder-friendly name and credit the author.
// weight controls relative random-pick odds; 1 is the normal default.
const captcha: CaptchaModule = {
  id: 'duck-tax-fraud',
  title: 'Duck Tax Fraud',
  author: 'GotCha team',
  weight: 1,
  Component: DuckTaxFraud,
};

export default captcha;
