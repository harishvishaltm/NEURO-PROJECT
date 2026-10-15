import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Guarantee light mode and prevent external dark extensions
try {
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.add('light');
  document.documentElement.style.colorScheme = 'light';
  if (!document.querySelector('meta[name="darkreader-lock"]')) {
    const meta = document.createElement('meta');
    meta.name = 'darkreader-lock';
    meta.content = 'darkreader-lock';
    document.head.appendChild(meta);
  }
} catch (e) {
  console.warn('Theme init:', e);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

