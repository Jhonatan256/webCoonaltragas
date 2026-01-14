import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { FormProvider } from './context/FormContext.jsx';
import AuthProvider from './context/AuthContext.jsx';
import { addLocale, locale as setLocale } from 'primereact/api';
import initAntiDevtools from './tools/anti-devtools.js';

// Configuración global de español para PrimeReact (Calendars, etc.)
addLocale('es', {
  firstDayOfWeek: 1,
  dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
  monthNames: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
  monthNamesShort: [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ],
  today: 'Hoy',
  clear: 'Limpiar',
  weekHeader: 'Sm',
  dateFormat: 'dd/mm/yy',
});
setLocale('es');

// Activar guardia anti-DevTools en producción, con toggles
(() => {
  if (!import.meta.env.PROD) return;
  const qp = new URLSearchParams(window.location.search);
  const disabledByParam = qp.has('noDevtoolsGuard');
  const disabledByEnv = String(import.meta.env.VITE_ANTI_DEVTOOLS || '').toLowerCase() === 'off';
  const enabled = !disabledByParam && !disabledByEnv;

  let unsubscribe = null;
  const startGuard = () => {
    if (unsubscribe) return;
    unsubscribe = initAntiDevtools({
      onOpen: () => {
        try { document.body.innerHTML = ''; } catch {}
        try { window.location.replace('about:blank'); } catch {}
      },
    });
  };
  const stopGuard = () => {
    try { unsubscribe?.(); } catch {}
    unsubscribe = null;
  };

  if (enabled) startGuard();

  // Exponer funciones de control (útil si se desea activar/desactivar desde código)
  // Nota: no es práctico desactivarlo desde consola porque el guard actúa al abrirla.
  try {
    globalThis.__devtoolsGuard = { enable: startGuard, disable: stopGuard };
  } catch {}
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FormProvider>
          <App />
        </FormProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
