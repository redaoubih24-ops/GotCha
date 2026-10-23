import { useState } from 'react';
import { getAllCaptchas } from '../captchas/registry';
import type { CaptchaModule, CaptchaResult } from '../captchas/types';
import ChallengeDialog from './ChallengeDialog';

export default function Playground() {
  const [active, setActive] = useState<CaptchaModule>();
  const [result, setResult] = useState<CaptchaResult>();
  const [attempt, setAttempt] = useState(0);
  const captchas = getAllCaptchas();
  const Component = active?.Component;

  function close() {
    setActive(undefined);
    setResult(undefined);
  }

  return (
    <main className="playground">
      <p className="eyebrow">THE DEVELOPER SANDBOX</p>
      <h1>
        Small tests.
        <br />
        <em>Big trust issues.</em>
      </h1>
      <p className="playground-intro">
        Every challenge, in isolation. Launch one, inspect its result, repeat as needed.
      </p>
      <div className="captcha-grid">
        {captchas.map((captcha, index) => (
          <article className="captcha-card" key={captcha.id}>
            <span className="eyebrow">EXPERIMENT {String(index + 1).padStart(2, '0')}</span>
            <h2>{captcha.title}</h2>
            <p>By {captcha.author}</p>
            <code>{captcha.id}</code>
            <button
              className="primary-button"
              onClick={() => {
                setActive(captcha);
                setResult(undefined);
              }}
            >
              Launch challenge <span aria-hidden="true">↗</span>
            </button>
            <a className="text-link" href={`/?captcha=${encodeURIComponent(captcha.id)}`}>
              Test the full loop →
            </a>
          </article>
        ))}
      </div>
      {captchas.length === 0 && (
        <p>
          No challenges yet. Copy <code>src/captchas/_template</code> to get started.
        </p>
      )}
      {active && Component && (
        <ChallengeDialog title={active.title} onClose={close}>
          {result ? (
            <section className="isolated-result" aria-live="polite">
              <p className="eyebrow">RESULT RECEIVED</p>
              <h2>
                {result.outcome === 'fail' ? 'A beautiful failure.' : 'A suspicious success.'}
              </h2>
              <dl>
                <dt>Outcome</dt>
                <dd>{result.outcome}</dd>
                <dt>Reason</dt>
                <dd>{result.reason}</dd>
                <dt>Meme tag</dt>
                <dd>{result.memeTag ?? '(none)'}</dd>
              </dl>
              <button
                className="primary-button"
                onClick={() => {
                  setAttempt((value) => value + 1);
                  setResult(undefined);
                }}
              >
                Run again ↻
              </button>
              <button className="secondary-button" onClick={close}>
                Back to playground
              </button>
            </section>
          ) : (
            <Component key={`${active.id}-${attempt}`} onComplete={setResult} />
          )}
        </ChallengeDialog>
      )}
    </main>
  );
}
