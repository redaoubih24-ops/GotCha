import type { CaptchaResult } from '../captchas/types';
import { ActiveMeme } from './MemeTransition';
import './playgroundRoute';

export interface MemeModalProps {
  result: CaptchaResult;
  onContinue: () => void;
  muted?: boolean;
}
/** Compatibility adapter for the existing flow; new callers use MemeTransition. */
export function MemeModal({ result, onContinue, muted = false }: MemeModalProps) {
  return <ActiveMeme result={result} onDone={onContinue} forceMuted={muted} />;
}
export default MemeModal;
