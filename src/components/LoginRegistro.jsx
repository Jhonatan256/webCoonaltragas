import React, { useState, useEffect } from "react";
import CaptchaTurnstile from "./CaptchaTurnstile";
import termsText from "../assets/text/terms.txt?raw";
import policyText from "../assets/text/policy.txt?raw";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import "./Login.css";
import useAuth from "../context/useAuth";
const LoginRegistro = ({ loginRegister }) => {
  const navigate = useNavigate();
  const [identificacion, setIdentificacion] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const { isAuthenticated, claims } = useAuth();
  // Si ya existe identificación en localStorage, redirigir directamente
  useEffect(() => {
    // Si ya posee token válido del módulo register, redirigir directamente
    if (isAuthenticated && claims?.module === "register") {
      navigate("/registro", { replace: true });
      return;
    }
    const storedId = localStorage.getItem("identificacion");
    const timeExpired = localStorage.getItem("timeExpired");
    if (timeExpired) {
      setInfo(
        "Tu sesión expiró por tiempo. Por favor, vuelve a iniciar para continuar."
      );
      localStorage.removeItem("timeExpired");
    }
    // Mensaje flash al finalizar generarFormulario
    try {
      const flash = sessionStorage.getItem("flashInfo");
      if (flash) {
        setInfo(flash);
        sessionStorage.removeItem("flashInfo");
      }
    } catch {
      // ignore
    }
    if (storedId) {
      navigate("/registro", { replace: true });
    }
  }, [navigate, isAuthenticated, claims?.module]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validación simple (puedes reemplazar por lógica real)
    if (identificacion.trim() === "") {
      setError("Por favor ingrese su identificación");
      return;
    }
    if (!termsAccepted) {
      setError("Debe aceptar los términos y condiciones");
      return;
    }
    if (!captchaToken) {
      setError("Por favor complete el captcha");
      return;
    }
    setError("");
    localStorage.setItem("identificacion", identificacion);
    try {
      await loginRegister({ identificacion, captchaToken });
    } catch (err) {
      const msg =
        err?.message ||
        err?.toString?.() ||
        "Ocurrió un error durante el inicio de sesión";
      setError(msg);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="card login-card-custom">
        <img
          src="/img/LOGO_FONDEXPRESS_FND-1.png"
          alt="Logo"
          className="login-logo"
        />
        <h1 className="login-title">
          ¡Afíliate a FONDEXPRESS, desde cualquier lugar!
        </h1>
        <form
          className="login-form-center mt-0 pt-0"
          onSubmit={handleSubmit}
          noValidate
        >
          <p className="login-info pb-0 mb-0">
            Recuerda tener a la mano en un solo formato PDF:
          </p>
          <ul className="login-info-list">
            <li>Copia Cédula por ambos lados</li>
          </ul>
          <div className="login-input-group mb-1">
            <label htmlFor="identificacion" className="login-label text-center">
              Identificación
            </label>
            <InputText
              id="identificacion"
              name="identificacion"
              type="text"
              className="w-20rem"
              value={identificacion}
              onChange={(e) => setIdentificacion(e.target.value)}
              placeholder="Ingresa tu identificación"
              autoComplete="off"
              autoFocus
            />
          </div>
          <div className="login-terms-group  flex align-items-center justify-content-center gap-2">
            <Checkbox
              inputId="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.checked)}
            />
            <label htmlFor="terms" className="login-label-terms text-sm">
              Acepto los{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => setShowTerms(true)}
              >
                Términos y Condiciones
              </button>{" "}
              y la{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => setShowPolicy(true)}
              >
                Política de Datos
              </button>
            </label>
          </div>
          {error && (
            <div className="error">
              <Message severity="error" text={error} />
            </div>
          )}
          {info && (
            <div className="mb-3">
              <Message severity="warn" text={info} />
            </div>
          )}
          <div
            className="mt-1"
            style={{
              width: "100%",
              maxWidth: 420,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CaptchaTurnstile siteKey={siteKey} onToken={setCaptchaToken} />
          </div>
          <Button
            label="Continuar"
            icon="pi pi-chevron-right"
            className="w-10rem mx-auto"
            type="submit"
          />
        </form>
        <Dialog
          header="Términos y Condiciones"
          visible={showTerms}
          style={{ width: "50vw", maxWidth: "650px" }}
          breakpoints={{ "960px": "90vw", "640px": "100vw" }}
          className="full-screen-dialog"
          modal
          onHide={() => setShowTerms(false)}
        >
          <div className="modal-scrollable">
            <div dangerouslySetInnerHTML={{ __html: termsText }} />
          </div>
          <div className="flex justify-content-end gap-2 mt-4">
            <Button label="Cerrar" text onClick={() => setShowTerms(false)} />
            <Button
              label="Aceptar"
              onClick={() => {
                setShowTerms(false);
                setTermsAccepted(true);
              }}
            />
          </div>
        </Dialog>
        <Dialog
          header="Política de Protección de Datos"
          visible={showPolicy}
          style={{ width: "50vw", maxWidth: "650px" }}
          breakpoints={{ "960px": "90vw", "640px": "100vw" }}
          className="full-screen-dialog"
          modal
          onHide={() => setShowPolicy(false)}
        >
          <div className="modal-scrollable">
            <div style={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: policyText }} />
          </div>
          <div className="flex justify-content-end gap-2 mt-4">
            <Button label="Cerrar" text onClick={() => setShowPolicy(false)} />
            <Button
              label="Aceptar"
              onClick={() => {
                setShowPolicy(false);
                setTermsAccepted(true);
              }}
            />
          </div>
        </Dialog>
      </div>
    </div>
  );
};

LoginRegistro.propTypes = {
  loginRegister: PropTypes.func.isRequired,
};

export default LoginRegistro;
