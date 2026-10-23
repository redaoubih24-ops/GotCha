import type { CaptchaResult } from '../captchas/types';
import MemeModal from '../meme/MemeModal';

export interface MemeTransitionProps {
  open: boolean;
  result: CaptchaResult;
  onDone: () => void;
  /** Optional extra: the header's sound toggle. */
  muted?: boolean;
}

/**
 * The agreed meme interface: <MemeTransition open result onDone />.
 *
 * src/meme/ is owned by another developer and currently exports MemeModal with
 * slightly different props, so this adapter bridges the two. When src/meme/
 * ships its own MemeTransition, change the import in App.tsx to point there
 * and delete this file.
 */
export default function MemeTransition({
  open,
  result,
  onDone,
  muted = false,
}: MemeTransitionProps) {
  if (!open) return null;
  return <MemeModal result={result} onContinue={onDone} muted={muted} />;
}
