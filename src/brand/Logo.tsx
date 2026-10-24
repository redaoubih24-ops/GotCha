interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <span className={`brand-logo ${className}`} aria-label="GotCha">
      <svg viewBox="0 0 32 32" aria-hidden="true" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="8" fill="currentColor" />
        <path
          d="m9 16 4.5 4.5L23 11"
          stroke="var(--color-accent, #ff5cad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span aria-hidden="true">
        GotCha<span style={{ color: 'var(--color-accent-strong, #ff2e93)' }}>.</span>
      </span>
    </span>
  );
}

export default Logo;
