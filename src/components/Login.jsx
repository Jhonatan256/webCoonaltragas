import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import "./Login.css";
import useAuth from "../context/useAuth";
import CaptchaTurnstile from "./CaptchaTurnstile";

export default function Login({ onSubmit }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotId, setForgotId] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const navigate = useNavigate();
  const { login, apiBase, isAuthenticated, claims, logout } = useAuth();
  const toastRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  // Función para limpiar cookies y estado de Turnstile
  const clearTurnstileState = () => {
    try {
      // Limpiar cookies específicas de Turnstile
      const turnstileCookies = ['cf_clearance', '_cf_bm', '__cf_bm'];
      turnstileCookies.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      
      // Limpiar localStorage relacionado con Turnstile
      Object.keys(localStorage).forEach(key => {
        if (key.includes('turnstile') || key.includes('cloudflare')) {
          localStorage.removeItem(key);
        }
      });
      
      // Limpiar sessionStorage relacionado con Turnstile
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('turnstile') || key.includes('cloudflare')) {
          sessionStorage.removeItem(key);
        }
      });
      
      console.log('Turnstile state cleared');
    } catch (error) {
      console.warn('Error clearing Turnstile state:', error);
    }
  };

  // Al montar: limpiar cualquier sesión previa y localStorage para garantizar estado fresco
  useEffect(() => {
    try {
      logout?.();
    } catch {
      // ignorar errores de limpieza
    } finally {
      setCaptchaToken(null);
      // Evitar reset si el widget aún no está listo para no duplicar render
      setTimeout(() => {
        try {
          if (captchaRef.current?.isReady?.()) {
            captchaRef.current.reset();
          }
        } catch {}
      }, 120);
    }
  }, [logout]);

  // Si ya tiene token válido de dashboard, redirigir
  useEffect(() => {
    if (isAuthenticated && Array.isArray(claims?.roles) && claims.roles.includes("dashboard")) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, claims, navigate]);
  
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (forgotLoading) return;
    setForgotMsg("");
    if (!forgotId) return;
    try {
      setForgotLoading(true);
      const resp = await fetch(`${apiBase}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificacion: String(forgotId).trim(), captchaToken }),
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json?.success) {
        throw new Error(json?.message || "No se pudo procesar la solicitud");
      }
      const masked = json?.data?.email || "***@***";
      toastRef.current?.show({
        severity: "success",
        summary: "Clave enviada",
        detail: `A su correo electrónico ${masked} ha sido enviada la nueva clave de acceso.`,
        life: 6000,
      });
      // Cerrar modal y limpiar campos
      setForgotVisible(false);
      setForgotId("");
      setForgotMsg("");
    } catch (err) {
      setForgotMsg(err?.message || "Error al enviar la nueva clave");
      // Reiniciar captcha tras error
      setCaptchaToken(null);
      captchaRef.current?.reset?.();
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!user || !pass) {
      setError("Usuario y contraseña son requeridos");
      return;
    }
    if (!captchaToken) {
      setError("Por favor complete el captcha");
      // Limpiar estado de Turnstile para resolver problemas en algunos navegadores
      clearTurnstileState();
      return;
    }
    try {
      setLoading(true);
      if (onSubmit) {
        await onSubmit({ user, pass, captchaToken });
      } else {
        await login({ user, pass, captchaToken });
      }
      // Limpiar estado de Turnstile tras login exitoso
      clearTurnstileState();
      // Reiniciar captcha tras éxito (nuevo intento requiere nueva validación)
      setCaptchaToken(null);
      captchaRef.current?.reset?.();
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Error al iniciar sesión");
      // Limpiar estado de Turnstile en caso de error
      clearTurnstileState();
      setCaptchaToken(null);
      captchaRef.current?.reset?.();
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-wrapper">
      <Toast ref={toastRef} />
      <Card className="login-card-custom">
        <img
          src="/img/LOGO_FONDEXPRESS_FND-1.png"
          alt="Fondexpress"
          className="login-logo"
        />
        <h1 className="login-title">Ingreso Empleados a Fondexpress</h1>
        <p className="login-subtitle text-center">
          Ingresa con tu usuario y contraseña para acceder al sistema.
        </p>

  <form onSubmit={handleSubmit} className="login-form-center">
          <div
            className="login-input-group"
            style={{ width: "100%", maxWidth: 420 }}
          >
            <label className="login-label" htmlFor="login-user">
              Usuario
            </label>
            <div className="p-inputgroup w-full">
              <span className="p-inputgroup-addon p-0">
                <Button
                  type="button"
                  icon="pi pi-user"
                  severity="secondary"
                  text
                  rounded
                  aria-label="Usuario"
                />
              </span>
              <InputText
                id="login-user"
                placeholder="Usuario"
                value={user}
                onChange={(e) => setUser(e.target.value.replace(/\D/g, ""))}
                className="w-full flex-1"
                style={{ flex: 1 }}
                autoComplete="username"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
          </div>

          <div
            className="login-input-group"
            style={{ width: "100%", maxWidth: 420 }}
          >
            <label className="login-label" htmlFor="login-pass">
              Contraseña
            </label>
            <Password
              id="login-pass"
              placeholder="Contraseña"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              toggleMask
              feedback={false}
              className="w-full flex-1"
              inputClassName="w-full"
              inputStyle={{ width: "100%" }}
              style={{ flex: 1 }}
              autoComplete="current-password"
            />
          </div>

          <div
            className="mt-1"
            style={{ width: "100%", maxWidth: 420, display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            <CaptchaTurnstile ref={captchaRef} siteKey={siteKey} onToken={setCaptchaToken} />
          </div>

          <Button
            type="submit"
            label={loading ? "Ingresando..." : "Ingresar"}
            icon="pi pi-sign-in"
            loading={loading}
            disabled={loading}
          />
          <div className="flex justify-content-center mt-0">
            <Button
              type="button"
              link
              label="¿Olvidaste tu contraseña?"
              onClick={() => {
                setForgotVisible(true);
                setForgotMsg("");
              }}
            />
          </div>
          {error && (
            <div style={{ marginBottom: "1rem" }}>
              <Message severity="error" text={error} />
            </div>
          )}
        </form>

        <div className="card flex flex-wrap justify-content-center gap-3 mt-5">
          {/* <Button label="Registrar usuario" icon="pi pi-user-plus" outlined /> */}
          <Button
            type="button"
            label="Actualizar datos"
            icon="pi pi-user-edit"
            severity="success"
            outlined
            onClick={() => navigate("/login-update")}
          />
          <Button
            type="button"
            label="Registro asociado"
            icon="pi pi-user-plus"
            severity="info"
            outlined
            onClick={() => navigate("/login-register")}
          />
        </div>
      </Card>

      <Dialog
        visible={forgotVisible}
        onHide={() => {
          if (!forgotLoading) {
            setForgotVisible(false);
            setForgotId("");
            setForgotMsg("");
          }
        }}
        header="Restablecer contraseña"
        modal
        style={{ width: "90vw", maxWidth: 480 }}
      >
        <div className="p-fluid">
          <form onSubmit={handleForgotSubmit}>
            <p>
              Ingresa tu número de identificación para enviarte una nueva clave
              a tu correo registrado.
            </p>
            <div className="field">
              <label htmlFor="forgot-ident">Número de identificación</label>
              <InputText
                id="forgot-ident"
                value={forgotId}
                onChange={(e) => setForgotId(e.target.value.replace(/\D/g, ""))}
                disabled={forgotLoading}
                required
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
            {forgotMsg && (
              <div className="mb-2">
                <Message severity="error" text={forgotMsg} />
              </div>
            )}
            <div className="flex gap-2 justify-content-end mt-3">
              <Button
                type="button"
                label="Cancelar"
                className="p-button-text"
                onClick={() => setForgotVisible(false)}
                disabled={forgotLoading}
              />
              <Button
                type="submit"
                label={forgotLoading ? "Enviando..." : "Enviar nueva clave"}
                icon="pi pi-envelope"
                loading={forgotLoading}
                disabled={forgotLoading || !forgotId}
              />
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
}

Login.propTypes = {
  onSubmit: PropTypes.func,
};

Login.defaultProps = {
  onSubmit: undefined,
};
