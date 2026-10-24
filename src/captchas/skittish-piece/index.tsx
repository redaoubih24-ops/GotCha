import type { CaptchaModule } from '../types';
import SkittishPieceCaptcha from './SkittishPieceCaptcha';

const captcha: CaptchaModule = {
  id: 'skittish-piece',
  title: 'Fit the Puzzle Piece',
  author: 'Thomas',
  weight: 1,
  order: 2,
  Component: SkittishPieceCaptcha,
};

export default captcha;
