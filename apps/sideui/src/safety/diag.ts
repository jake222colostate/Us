export function installGlobalDiag() {
  if ((window as any).__diagInstalled) return;
  (window as any).__diagInstalled = true;

  window.addEventListener('error', (e) => {
    try {
      console.error('[window.error]', e.error || e.message || e);
      const pre = document.createElement('pre');
      pre.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;padding:8px 12px;background:#200;color:#faa;border:1px solid #a55;max-width:90vw;max-height:40vh;overflow:auto;border-radius:6px;font:12px/1.4 monospace;';
      pre.textContent = '[window.error] ' + (e?.error?.stack || e?.message || String(e));
      document.body.appendChild(pre);
    } catch {}
  });

  window.addEventListener('unhandledrejection', (e:any) => {
    try {
      console.error('[unhandledrejection]', e.reason || e);
      const pre = document.createElement('pre');
      pre.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;padding:8px 12px;background:#201;color:#adf;border:1px solid #57a;max-width:90vw;max-height:40vh;overflow:auto;border-radius:6px;font:12px/1.4 monospace;';
      pre.textContent = '[unhandledrejection] ' + (e?.reason?.stack || String(e?.reason ?? e));
      document.body.appendChild(pre);
    } catch {}
  });
}
