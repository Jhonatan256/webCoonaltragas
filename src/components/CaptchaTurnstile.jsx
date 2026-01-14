import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import PropTypes from "prop-types";

const CaptchaTurnstile = forwardRef(function CaptchaTurnstile({ siteKey, onToken, options }, ref) {
  const containerRef = useRef(null);
  const scriptRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    const ensureScript = () =>
      new Promise((resolve) => {
        if (window.turnstile) return resolve();
        // Reutilizar script existente si ya fue agregado
        const existing = document.querySelector('script[src*="turnstile/v0/api.js"]');
        if (existing) {
          scriptRef.current = existing;
          existing.onload = () => resolve();
          // Si ya cargó previamente, resolver de inmediato
          if (existing.getAttribute('data-loaded') === '1' || window.turnstile) {
            return resolve();
          }
          return; // onload resolverá
        }
        const s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        s.defer = true;
        s.onload = () => {
          s.setAttribute('data-loaded', '1');
          resolve();
        };
        document.body.appendChild(s);
        scriptRef.current = s;
      });

    let disposed = false;
    (async () => {
      await ensureScript();
      if (disposed || !containerRef.current || !window.turnstile) return;
      // Limpiar cualquier render previo en el contenedor
      try {
        if (widgetIdRef.current && window.turnstile?.remove) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      } catch {}
      try {
        containerRef.current.innerHTML = '';
      } catch {}

      // Asegurar singleton global: eliminar widget anterior si existe
      try {
        const prev = globalThis.__TURNSTILE_ACTIVE_WIDGET__;
        if (prev && window.turnstile?.remove) {
          window.turnstile.remove(prev);
        }
      } catch {}

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onToken?.(token),
        "error-callback": () => onToken?.(null),
        "expired-callback": () => onToken?.(null),
        theme: options?.theme || undefined,
        size: options?.size || undefined,
      });

      // Registrar como activo global
      try {
        globalThis.__TURNSTILE_ACTIVE_WIDGET__ = widgetIdRef.current;
      } catch {}
    })();

    return () => {
      disposed = true;
      try {
        if (widgetIdRef.current && window.turnstile?.remove) {
          window.turnstile.remove(widgetIdRef.current);
        }
        // Si el activo global es este, limpiar referencia
        try {
          if (globalThis.__TURNSTILE_ACTIVE_WIDGET__ === widgetIdRef.current) {
            globalThis.__TURNSTILE_ACTIVE_WIDGET__ = null;
          }
        } catch {}
      } catch {
        // ignore cleanup errors
      }
    };
  }, [siteKey, onToken, options]);

  // Exponer API imperativa para resetear
  useImperativeHandle(ref, () => ({
    isReady: () => !!widgetIdRef.current,
    reset: () => {
      try {
        // Primero intentar reset normal
        if (widgetIdRef.current && window.turnstile?.reset) {
          window.turnstile.reset(widgetIdRef.current);
          onToken?.(null); // limpiar token anterior
        } else {
          // Si no funciona, forzar re-render completo
          if (widgetIdRef.current && window.turnstile?.remove) {
            window.turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = null;
          }
          
          // Limpiar contenedor y volver a renderizar
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            
            setTimeout(() => {
              if (containerRef.current && window.turnstile?.render) {
                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                  sitekey: siteKey,
                  callback: (token) => onToken?.(token),
                  "error-callback": () => onToken?.(null),
                  "expired-callback": () => onToken?.(null),
                  theme: options?.theme || undefined,
                  size: options?.size || undefined,
                });
              }
            }, 100);
          }
        }
      } catch (error) {
        console.warn('Error during Turnstile reset:', error);
        // Último recurso: limpiar completamente y re-renderizar
        try {
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            onToken?.(null);
          }
        } catch {
          // ignorar errores de limpieza final
        }
      }
    },
    
    // Método adicional para limpieza completa
    forceReload: () => {
      try {
        if (widgetIdRef.current && window.turnstile?.remove) {
          window.turnstile.remove(widgetIdRef.current);
        }
        widgetIdRef.current = null;
        
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        
        onToken?.(null);
        
        // Recargar después de un delay
        setTimeout(() => {
          if (containerRef.current && window.turnstile?.render) {
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
              sitekey: siteKey,
              callback: (token) => onToken?.(token),
              "error-callback": () => onToken?.(null),
              "expired-callback": () => onToken?.(null),
              theme: options?.theme || undefined,
              size: options?.size || undefined,
            });
          }
        }, 200);
      } catch (error) {
        console.error('Error during force reload:', error);
      }
    }
  }), [siteKey, onToken, options]);

  return <div ref={containerRef} />;
});

export default CaptchaTurnstile;

CaptchaTurnstile.propTypes = {
  siteKey: PropTypes.string.isRequired,
  onToken: PropTypes.func,
  options: PropTypes.object,
};
