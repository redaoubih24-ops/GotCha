import { useCallback, useReducer, useState } from 'react';
import Logo from '../brand/Logo';
import { getCaptchaById, pickNextCaptcha } from '../captchas/registry';
import type { CaptchaResult } from '../captchas/types';
import LoginPage from '../login/LoginPage';
import CaptchaErrorBoundary, { CRASH_RESULT } from './CaptchaErrorBoundary';
import ChallengeDialog from './ChallengeDialog';
import MemeTransition from './MemeTransition';
import Playground from './Playground';
import { flowReducer, initialFlow } from './flow';

/** Closing the challenge early is also a failure. Obviously. */
export const QUIT_RESULT: CaptchaResult = {
  outcome: 'fail',
  reason: 'Leaving early is exactly what a bot would do.',
  memeTag: 'quitter',
};

function readLocation() {
  const isPlayground = window.location.pathname.replace(/\/$/, '') === '/playground';
  const requestedId = new URLSearchParams(window.location.search).get('captcha');
  return { isPlayground, requestedId };
}

export default function App() {
  const [flow, dispatch] = useReducer(flowReducer, initialFlow);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');
  const [{ isPlayground, requestedId }] = useState(readLocation);
  const forcedCaptcha = requestedId ? getCaptchaById(requestedId) : undefined;

  // Stable callbacks, so CAPTCHAs can safely list onComplete in effect dependencies.
  const complete = useCallback(
    (result: CaptchaResult) => dispatch({ type: 'COMPLETE', result }),
    [],
  );
  const crash = useCallback(() => dispatch({ type: 'COMPLETE', result: CRASH_RESULT }), []);
  const quit = useCallback(() => dispatch({ type: 'COMPLETE', result: QUIT_RESULT }), []);
  const done = useCallback(() => dispatch({ type: 'DONE' }), []);

  function start() {
    if (requestedId && !forcedCaptcha) {
      setError(`No CAPTCHA named “${requestedId}”. Open the playground to find an available ID.`);
      return;
    }
    const captcha = forcedCaptcha ?? pickNextCaptcha(flow.lastCaptchaId);
    if (!captcha) {
      setError('No CAPTCHAs are registered yet. Copy the template to add one.');
      return;
    }
    setError('');
    dispatch({ type: 'SUBMIT', captcha });
  }

  const memeResult = flow.stage === 'meme' ? flow.result : flow.lastResult;

  return (
    <div className="app-shell" data-stage={flow.stage}>
      <header className="site-header">
        <a className="brand-link" href="/" aria-label="GotCha home">
          <Logo />
        </a>
        <nav aria-label="Main navigation">
          <button
            className="sound-toggle"
            type="button"
            onClick={() => setMuted((value) => !value)}
            aria-pressed={muted}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          >
            <span aria-hidden="true">{muted ? '◌' : '◉'}</span> Sound {muted ? 'off' : 'on'}
          </button>
          <a className="nav-link" href={isPlayground ? '/' : '/playground'}>
            {isPlayground ? 'Back to login' : 'The playground'} <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      {isPlayground ? (
        <Playground />
      ) : (
        <>
          {requestedId && (
            <p className="dev-banner" role="status">
              DEV OVERRIDE / {forcedCaptcha?.title ?? `Unknown ID: ${requestedId}`}
            </p>
          )}
          {error && (
            <p className="app-error" role="alert">
              {error}
            </p>
          )}
          <LoginPage onSubmit={start} attemptCount={flow.attemptCount} />
        </>
      )}
      <footer className="site-footer">
        <span>GotCha © 2026</span>
        <span>
          Human, allegedly. <span className="status-dot" aria-hidden="true" /> All systems
          suspicious.
        </span>
        <span>A deeply unserious hackathon project.</span>
      </footer>
      {flow.stage === 'captcha' && (
        <ChallengeDialog
          key={`${flow.captcha.id}-${flow.attemptCount}`}
          title={flow.captcha.title}
          author={flow.captcha.author}
          footnote={`Attempt ${flow.attemptCount + 1}`}
          onClose={quit}
        >
          <CaptchaErrorBoundary onCrash={crash}>
            <flow.captcha.Component onComplete={complete} />
          </CaptchaErrorBoundary>
        </ChallengeDialog>
      )}
      {memeResult && (
        <MemeTransition
          open={flow.stage === 'meme'}
          result={memeResult}
          onDone={done}
          muted={muted}
        />
      )}
    </div>
  );
}
