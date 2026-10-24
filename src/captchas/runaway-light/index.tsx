import type { CaptchaModule } from '../types';
import RunawayLightCaptcha from './RunawayLightCaptcha';

const captcha: CaptchaModule = {
  id: 'runaway-light',
  title: 'Select the Traffic Lights',
  author: 'Thomas',
  weight: 1,
  order: 1,
  Component: RunawayLightCaptcha,
};

export default captcha;
