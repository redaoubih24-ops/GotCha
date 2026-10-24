import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/bangers/400.css';
import '@fontsource/comic-neue/400.css';
import '@fontsource/comic-neue/700.css';
import App from './app/App';
import './brand/tokens.css';
import './app/app.css';
import './brand/rough.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
