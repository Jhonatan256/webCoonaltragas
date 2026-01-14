/*
  Detección básica de DevTools y consola abierta.
  Nota: No es 100% infalible en todos los navegadores, sirve como disuasión.
*/
export default function initAntiDevtools({ onOpen } = {}) {
  if (typeof window === 'undefined') return () => {};
  let triggered = false;

  const trigger = () => {
    if (triggered) return;
    triggered = true;
    try { onOpen && onOpen(); } catch {}
  };

  // Heurística por tamaño de ventana (Chrome/Edge/Firefox)
  const sizeProbe = () => {
    const threshold = 160; // panel devtools usualmente ocupa >160px
    const w = Math.abs(window.outerWidth - window.innerWidth) > threshold;
    const h = Math.abs(window.outerHeight - window.innerHeight) > threshold;
    if (w || h) trigger();
  };

  // Heurística por inspección de objeto en consola
  let consoleProbeOpen = false;
  const obj = {}
  Object.defineProperty(obj, 'id', {
    get() {
      consoleProbeOpen = true;
      // acceder al getter implica que la consola está abierta inspeccionando
      setTimeout(trigger, 0);
      return 'x';
    },
  });

  const poll = () => {
    if (triggered) return;
    try { sizeProbe(); } catch {}
    try { consoleProbeOpen = false; console.log(obj); } catch {}
    setTimeout(poll, 600);
  };

  // Atajos: keydown con teclas comunes (F12/Ctrl+Shift+I)
  const keyListener = (e) => {
    if (e.key === 'F12') return trigger();
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) {
      return trigger();
    }
  };

  // Abrir/ cerrar devtools cambia tamaños: observar resize
  const resizeListener = () => sizeProbe();

  window.addEventListener('keydown', keyListener, { passive: true });
  window.addEventListener('resize', resizeListener, { passive: true });
  poll();

  return () => {
    window.removeEventListener('keydown', keyListener);
    window.removeEventListener('resize', resizeListener);
  };
}
