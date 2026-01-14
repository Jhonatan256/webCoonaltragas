import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import AuthContext from "./_internalAuthContext";

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [identificacion, setIdentificacion] = useState(
    () => localStorage.getItem("identificacion") || null
  );

  // Decodificar payload JWT (sin validar firma) para conocer claims como 'module'
  const claims = useMemo(() => {
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = atob(base64);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }, [token]);

  // Determinar si el token está expirado según el claim `exp` (segundos epoch)
  const isExpired = useMemo(() => {
    const exp = claims?.exp;
    if (!token) return true;
    if (!exp || typeof exp !== "number") return false; // si no hay exp, asumimos sin expiración
    const nowSec = Math.floor(Date.now() / 1000);
    return exp <= nowSec;
  }, [token, claims]);

  const isAuthenticated = useMemo(
    () => Boolean(token) && !isExpired,
    [token, isExpired]
  );

  // Programar auto-logout cuando el token expire
  const logoutTimerRef = useRef(null);
  // Programar auto-refresh antes de expirar (solo update/register)
  const refreshTimerRef = useRef(null);
  useEffect(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const exp = claims?.exp;
    if (!token) return;
    if (!exp || typeof exp !== "number") return; // sin exp, no programamos

    const msUntilExpiry = exp * 1000 - Date.now();
    if (msUntilExpiry <= 0) {
      // Ya expirado: cerrar sesión inmediatamente
      setToken(null);
      setUser(null);
      setIdentificacion(null);
      return;
    }

    // Programar refresh 5 minutos antes de expirar (solo update/register)
    const REFRESH_LEAD_MS = 5 * 60 * 1000; // 5 minutos
    const moduleName = claims?.module;
    if (moduleName === "update" || moduleName === "register") {
      const delay = Math.max(msUntilExpiry - REFRESH_LEAD_MS, 0);
      refreshTimerRef.current = setTimeout(() => {
        // Intentar renovar; errores se ignoran y se mantiene el flujo normal
        refreshToken().catch(() => {});
      }, delay);
    }

    logoutTimerRef.current = setTimeout(() => {
      setToken(null);
      setUser(null);
      setIdentificacion(null);
    }, msUntilExpiry);

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };
  }, [token, claims]);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
    else localStorage.removeItem("auth_user");
  }, [user]);

  useEffect(() => {
    if (identificacion) localStorage.setItem("identificacion", identificacion);
    else localStorage.removeItem("identificacion");
  }, [identificacion]);

  const apiBase = import.meta.env.VITE_API_BASE || "/api";

  // Limpieza total de localStorage a las 3 horas desde el inicio de sesión
  const storageCleanupRef = useRef(null);
  useEffect(() => {
    const TTL_MS = 3 * 60 * 60 * 1000; // 3 horas
    // Cancelar timer previo
    if (storageCleanupRef.current) {
      clearTimeout(storageCleanupRef.current);
      storageCleanupRef.current = null;
    }

    const now = Date.now();
    const startedRaw = localStorage.getItem("storage_init_at");
    let started = startedRaw ? parseInt(startedRaw, 10) : NaN;
    const hasSessionState = Boolean(token || user || identificacion);

    // Si no hay marca de inicio pero hay estado de sesión, iniciarla ahora
    if ((!startedRaw || Number.isNaN(started)) && hasSessionState) {
      started = now;
      localStorage.setItem("storage_init_at", String(now));
    }

    if (!hasSessionState && !startedRaw) {
      // No hay sesión ni inicio registrado; no programar nada
      return;
    }

    const elapsed = now - (Number.isNaN(started) ? now : started);
    if (elapsed >= TTL_MS) {
      // Ya superó las 3 horas: limpiar todo y resetear estado
  try { localStorage.clear(); } catch { /* ignore */ }
      setToken(null);
      setUser(null);
      setIdentificacion(null);
      return;
    }

    const delay = TTL_MS - elapsed;
    storageCleanupRef.current = setTimeout(() => {
  try { localStorage.clear(); } catch { /* ignore */ }
      setToken(null);
      setUser(null);
      setIdentificacion(null);
    }, delay);

    return () => {
      if (storageCleanupRef.current) {
        clearTimeout(storageCleanupRef.current);
        storageCleanupRef.current = null;
      }
    };
  }, [token, user, identificacion]);

  // Renovación silenciosa para módulos update/register
  const refreshToken = useCallback(async () => {
    try {
      if (!isAuthenticated) return false;
      const moduleName = claims?.module;
      const doc = identificacion ? String(identificacion) : null;
      if (!moduleName || !doc) return false;

      let url = null;
      if (moduleName === "update") {
        url = `${apiBase}/usuarios/documento/${encodeURIComponent(doc)}`;
      } else if (moduleName === "register") {
        url = `${apiBase}/register/documento/${encodeURIComponent(doc)}`;
      } else {
        // dashboard u otros: no se renueva silenciosamente
        return false;
      }

      const resp = await fetch(url, { headers: { Accept: "application/json" } });
      const ok = resp.status === 200;
      const json = await resp.json().catch(() => null);
      if (!ok || !json?.success || !json?.data?.token) return false;

      const newToken = json.data.token;
      const newUser = json.data.user || user;
      setToken(newToken || null);
      setUser(newUser || null);
      // Persist identificación si existe en respuesta
      const ident2 = newUser?.documento || doc;
      if (ident2) setIdentificacion(String(ident2));
      return true;
    } catch {
      return false;
    }
  }, [apiBase, claims?.module, identificacion, isAuthenticated, user]);

  const login = useCallback(
    async ({ user: username, pass, captchaToken }) => {
      // Si ya hay un token válido para dashboard, reutilizar y evitar regenerar
      if (isAuthenticated && Array.isArray(claims?.roles) && claims.roles.includes("dashboard")) {
        return token;
      }

      const resp = await fetch(`${apiBase}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: username, pass, captchaToken }),
      });
      const json = await resp.json().catch(() => null);

      if (!resp.ok || !json?.success) {
        throw new Error(json?.message || "Credenciales inválidas");
      }
      const t = json.data?.access_token;
      const u = json.data?.user || { username };
      setToken(t || null);
      setUser(u);
      // Persist identificación si existe
      if (u?.identificacion) {
        setIdentificacion(String(u.identificacion));
      }
      // Reiniciar contador de 3 horas desde este login
  try { localStorage.setItem("storage_init_at", String(Date.now())); } catch { /* ignore */ }
      return t;
    },
    [apiBase, isAuthenticated, claims, token]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("identificacion");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("token");
    localStorage.removeItem("timeLeft");
    localStorage.removeItem("timeExpired");
    localStorage.clear();
    setToken(null);
    setUser(null);
    setIdentificacion(null);
  }, []);

  // Permite iniciar sesión con un token ya emitido (p.ej. desde endpoints de registro/consulta)
  const loginWithToken = useCallback((newToken, newUser) => {
    setToken(newToken || null);
    setUser(newUser || null);
    // claims se recalcula automáticamente a partir de `token`
    if (newToken) localStorage.setItem("token", newToken);
    else localStorage.removeItem("token");
    if (newUser) localStorage.setItem("auth_user", JSON.stringify(newUser));
    else localStorage.removeItem("auth_user");
    // Reiniciar contador de 3 horas desde este inicio
  try { localStorage.setItem("storage_init_at", String(Date.now())); } catch { /* ignore */ }
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      identificacion,
      setIdentificacion,
      login,
      logout,
      apiBase,
      claims,
      isAuthenticated,
      loginWithToken,
    }),
    [
      token,
      user,
      identificacion,
      login,
      logout,
      apiBase,
      claims,
      isAuthenticated,
      loginWithToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
