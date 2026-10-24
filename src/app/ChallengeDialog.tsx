import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface ChallengeDialogProps {
  children: ReactNode;
  /** The CAPTCHA's title. Also the dialog's accessible name. */
  title: string;
  /** Shown as “Captcha by {author}”. */
  author: string;
  /** Optional small print on the right of the footer, e.g. the attempt number. */
  footnote?: string;
  onClose: () => void;
}

/**
 * The consistent “verification” frame every CAPTCHA renders inside.
 * Uses the native <dialog> for focus trapping, Escape handling and the backdrop.
 */
export default function ChallengeDialog({
  children,
  title,
  author,
  footnote,
  onClose,
}: ChallengeDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previous = document.activeElement;
    if (!element.open) element.showModal();
    return () => {
      element.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);

  return (
    <dialog
      className="challenge-dialog"
      ref={dialog}
      aria-labelledby="challenge-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="challenge-header">
        <span className="challenge-shield" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z"
              fill="var(--color-accent)"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="m9 12 2 2 4-4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="challenge-heading">
          <p className="challenge-eyebrow">Verify you are human</p>
          <h2 id="challenge-title">{title}</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onClose}
          aria-label="Close challenge"
        >
          ×
        </button>
      </header>
      <div className="challenge-body">{children}</div>
      <footer className="challenge-footer">
        <span>
          Captcha by <strong>{author}</strong>
        </span>
        {footnote && <span>{footnote}</span>}
      </footer>
    </dialog>
  );
}
