import { useReducer, useState } from 'react';
import Logo from '../brand/Logo';
import { getCaptchaById, pickRandomCaptcha } from '../captchas/registry';
import LoginPage from '../login/LoginPage';
import MemeModal from '../meme/MemeModal';
import ChallengeDialog from './ChallengeDialog';
import Playground from './Playground';
import { flowReducer, initialFlow } from './flow';

export default function App() {
  const [flow, dispatch] = useReducer(flowReducer, initialFlow);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');
  const isPlayground = window.location.pathname.replace(/\/$/, '') === '/playground';
  const requestedId = new URLSearchParams(window.location.search).get('captcha');
  const forcedCaptcha = requestedId ? getCaptchaById(requestedId) : undefined;
  const ActiveCaptcha = flow.stage === 'captcha' ? flow.captcha.Component : undefined;

  function start() {
    if (requestedId && !forcedCaptcha) {
      setError(`No CAPTCHA named “${requestedId}”. Open the playground to find an available ID.`);
      return;
    }
    const captcha =
      forcedCaptcha ?? pickRandomCaptcha(flow.stage === 'login' ? flow.lastCaptchaId : undefined);
    if (captcha) dispatch({ type: 'START', captcha });
    else setError('No CAPTCHAs are registered yet. Copy the template to add one.');
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand-link" href="/" aria-label="GotCha home">
          <Logo />
        </a>
        <nav aria-label="Main navigation">
          <button
            className="sound-toggle"
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
          <LoginPage onSubmit={start} />
          {error && (
            <p className="app-error" role="alert">
              {error}
            </p>
          )}
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
      {flow.stage === 'captcha' && ActiveCaptcha && (
        <ChallengeDialog title={flow.captcha.title} onClose={() => dispatch({ type: 'RESET' })}>
          <ActiveCaptcha onComplete={(result) => dispatch({ type: 'COMPLETE', result })} />
        </ChallengeDialog>
      )}
      {flow.stage === 'meme' && (
        <MemeModal
          result={flow.result}
          muted={muted}
          onContinue={() => dispatch({ type: 'RESET' })}
        />
      )}
    </div>
  );
}
