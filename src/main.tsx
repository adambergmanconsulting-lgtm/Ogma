import { Buffer } from 'buffer';
import process from 'process';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './index.css';

declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: typeof process;
  }
}

window.Buffer = Buffer;
window.process = process;

// Avoid React StrictMode double-mount for live WebRTC / Gun sessions.
createRoot(document.getElementById('root')!).render(<App />);
