import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface ChallengeDialogProps {
  children: ReactNode;
  title: string;
  onClose: () => void;
}

export default function ChallengeDialog({ children, title, onClose }: ChallengeDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previous = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (previous instanceof HTMLElement) previous.focus();
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
      <div className="challenge-toolbar">
        <span className="eyebrow">HUMAN VERIFICATION / QUESTIONABLE ACCURACY</span>
        <button className="icon-button" onClick={onClose} aria-label="Close challenge">
          ×
        </button>
      </div>
      <h2 className="sr-only" id="challenge-title">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
