import './login.css';

export interface LoginPageProps {
  onSubmit: () => void;
}

function CheckboxMascot() {
  return (
    <div className="login-mascot" aria-hidden="true">
      <svg viewBox="0 0 360 236" fill="none">
        <ellipse cx="183" cy="218" rx="100" ry="10" fill="#18221a" opacity="0.07" />
        <path
          d="M113 149c-26 5-34 24-52 17m191-25c26-18 41-9 49-29"
          stroke="#18221a"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="m144 185-11 26-21 1m103-27 10 26 22 1"
          stroke="#18221a"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="105"
          y="30"
          width="151"
          height="160"
          rx="37"
          transform="rotate(-7 105 30)"
          fill="#d4f57a"
          stroke="#18221a"
          strokeWidth="3"
        />
        <path
          d="m128 57 15-2m-17 11 8-1"
          stroke="#18221a"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.25"
        />
        <ellipse cx="153" cy="100" rx="16" ry="22" transform="rotate(-7 153 100)" fill="#fffef9" />
        <ellipse cx="202" cy="94" rx="16" ry="22" transform="rotate(-7 202 94)" fill="#fffef9" />
        <ellipse cx="157" cy="103" rx="7" ry="11" transform="rotate(-7 157 103)" fill="#18221a" />
        <ellipse cx="206" cy="97" rx="7" ry="11" transform="rotate(-7 206 97)" fill="#18221a" />
        <path d="M163 139c11 10 24 8 32-4" stroke="#18221a" strokeWidth="4" strokeLinecap="round" />
        <path
          d="m271 43 7-13m9 26 14-3M80 74 67 65"
          stroke="#18221a"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="login-mascot-note">seems legit.</span>
    </div>
  );
}

export function LoginPage({ onSubmit }: LoginPageProps) {
  return (
    <main className="login-page">
      <section className="login-intro" aria-labelledby="login-title">
        <p className="login-eyebrow">
          <span /> Authentically questionable
        </p>
        <h1 id="login-title">
          You had us
          <br />
          at <span>human.</span>
        </h1>
        <p className="login-description">
          A login page with trust issues.
          <br />
          Prove you’re human. Regret everything.
        </p>
        <CheckboxMascot />
        <p className="login-fine-print">Built to keep bots out. And, apparently, everyone else.</p>
      </section>

      <section className="login-card" aria-labelledby="login-card-title">
        <div className="login-card-topline">
          <span className="login-card-label">YOUR VERY IMPORTANT ACCOUNT</span>
          <span className="login-card-lock" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect
                x="6"
                y="10"
                width="12"
                height="10"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M9 10V7a3 3 0 0 1 6 0v3m-3 4v2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>
        <h2 id="login-card-title">
          Welcome back.
          <br />
          <span>Probably.</span>
        </h2>
        <p className="login-card-description">
          Just one tiny security check between you and absolutely nothing.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <label className="login-field" htmlFor="demo-email">
            Email address
            <span className="login-field-status">PRE-FILLED, FOR YOUR SAFETY</span>
          </label>
          <input
            id="demo-email"
            className="login-input"
            type="text"
            value="human.ish@example.test"
            readOnly
            aria-describedby="login-demo-note"
            autoComplete="off"
          />
          <label className="login-field login-password-label" htmlFor="demo-password">
            Extremely secure password
          </label>
          <input
            id="demo-password"
            className="login-input login-fake-password"
            type="text"
            value="••••••••••••"
            readOnly
            aria-describedby="login-demo-note"
            autoComplete="off"
          />
          <div className="login-human-note">
            <span className="login-check-icon" aria-hidden="true">
              ✓
            </span>
            I am, to the best of my knowledge, human.
          </div>
          <button className="login-submit" type="submit">
            Let’s prove it <span aria-hidden="true">↗</span>
          </button>
        </form>

        <div className="login-demo-note" id="login-demo-note">
          <span className="login-demo-badge">JUST A DEMO</span>
          <p>
            No real account. No real credentials.
            <br />
            Just a deeply unreasonable CAPTCHA.
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
