import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Automatic auto-reload when a new deployment/chunk update fails (prevents stale chunk errors)
window.addEventListener('vite:preload-error', (event) => {
  console.log('Preload error detected. Automatically reloading for new deployment...');
  window.location.reload();
});

// Automatic Service Worker auto-update detection
if ('serviceWorker' in navigator) {
  let refreshing = false;

  // Auto reload page when new Service Worker takes over
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker registered with scope:', reg.scope);
        // Periksa update setiap kali halaman dibuka atau kembali aktif
        reg.update();
      })
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}

