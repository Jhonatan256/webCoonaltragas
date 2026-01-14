import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Dispara un page_view de GA4 en cada cambio de ruta.
 * Usa el ID de medición provisto o VITE_GA_ID si no se pasa.
 */
export default function useGtagPageview(measurementId) {
  const location = useLocation();
  const GA_ID = measurementId || import.meta.env.VITE_GA_ID;

  useEffect(() => {
    if (!GA_ID) return;
    // Solo reportar en producción
    if (!import.meta.env.PROD) return;
    const gtag = globalThis.gtag;
    if (typeof gtag === 'function') {
      gtag('config', GA_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location.pathname, location.search, GA_ID]);
}
