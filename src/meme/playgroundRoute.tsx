import { createRoot } from 'react-dom/client';
import MemePlayground from './MemePlayground';

// The shell imports MemeModal on every page. This isolated route registration keeps
// all meme work within its ownership boundary until the shell adopts a router.
if (
  typeof window !== 'undefined' &&
  window.location.pathname.replace(/\/$/, '') === '/playground/memes'
) {
  queueMicrotask(() => {
    if (document.getElementById('meme-playground-root')) return;
    const host = document.createElement('div');
    host.id = 'meme-playground-root';
    document.body.appendChild(host);
    const shell = document.getElementById('root');
    if (shell) {
      shell.hidden = true;
      shell.inert = true;
    }
    createRoot(host).render(<MemePlayground />);
  });
}
