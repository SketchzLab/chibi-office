// v22 PWA: register the service worker (production only). A new deploy installs a new SW that skipWaiting()s + clients.claim()s;
// when it takes over a page that was already controlled we show a short 'Updated' toast and reload, so nobody stays on an old build.
export function registerPWA() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller; let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!hadController || reloading) return; reloading = true;
    const t = document.createElement('div'); t.id = 'pwaToast'; t.textContent = '✨ Updated — reloading…'; document.body.appendChild(t); setTimeout(() => location.reload(), 900); });
  addEventListener('load', () => navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL }).then(reg => {
    window.__swReg = reg; const check = () => reg.update().catch(() => {});
    setInterval(check, 30 * 60 * 1000); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); }); }).catch(e => console.warn('SW', e)));
}
