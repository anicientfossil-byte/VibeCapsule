import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

let mounted = false;
const mount = () => {
  if (mounted) return;
  mounted = true;
  createRoot(document.getElementById('root')!).render(<App />);
};

// The scroll intro (intro.js) asks the app to wait until the animation is nearly finished,
// so the heavy 3D scene does not run while the intro plays (important on phones).
if (window.__vcIntroPending && window.__vcIntro) {
  window.addEventListener('vc-intro-mount', mount, { once: true });
  setTimeout(mount, 20000); // safety net
} else {
  mount();
}
