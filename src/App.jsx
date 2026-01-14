import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import LoginActualizacion from "./components/LoginActualizacion";
import LoginRegistro from "./components/LoginRegistro";
import Login from "./components/Login";
import useAuth from "./context/useAuth";
import Actualizacion from "./components/Actualizacion";
import Dashboard from "./components/Dashboard";
import UsuariosActualizados from "./components/UsuariosActualizados";
import Usuarios from "./components/Usuarios";
import UsuariosNuevos from "./components/UsuariosNuevos";
import "./App.css";
import "primereact/resources/themes/lara-light-blue/theme.css"; // Tema (puedes cambiarlo)
import "primereact/resources/primereact.min.css"; // Estilos base de PrimeReact
import "primeicons/primeicons.css"; // Iconos
import useGtagPageview from "./hooks/useGtagPageview";

function App() {
  const navigate = useNavigate();
  // Registrar pageviews al cambiar de ruta (solo producción)
  useGtagPageview();
  const {
    apiBase,
    identificacion,
    setIdentificacion,
    claims,
    isAuthenticated,
    loginWithToken,
  } = useAuth();

  const toActualizacion = (ident) => {
    if (ident) setIdentificacion?.(ident);
    navigate("/actualizacion", { state: { identificacion: ident } });
  };
  const toRegistro = (ident) => {
    if (ident) setIdentificacion?.(ident);
    navigate("/registro", { state: { identificacion: ident } });
  };

  const buildRespError = (resp, json, statusOk) => {
    let msg =
      (json && (json.message || json.error || json?.data?.message)) || "";
    if (!msg) {
      if (!statusOk) {
        msg =
          "Error HTTP " +
          resp.status +
          (resp.statusText ? ": " + resp.statusText : "");
      } else {
        msg = "No se pudo obtener el token";
      }
    }
    return msg;
  };
  const loginRegister = async (doc) => {
    localStorage.clear();
    try {
      const resp = await fetch(
        `${apiBase}/register/documento/${encodeURIComponent(
          doc.identificacion
        )}`,
        {
          headers: { Accept: "application/json" },
        }
      );
      const statusOk = resp.status === 200;
      const json = await resp.json().catch(() => null);

      if (statusOk && json?.success === true && json?.data?.token) {
        localStorage.setItem("timeLeft", 40 * 60);
        // Notificar al contexto (esto actualiza isAuthenticated)
        loginWithToken(json.data.token, json.data.user);

        const ident2 = json?.data?.user?.documento || doc?.identificacion;
        if (ident2) setIdentificacion?.(ident2);
        toRegistro(ident2);
        return;
      } else {
        const msg = buildRespError(resp, json, statusOk);
        throw new Error(msg);
      }
    } catch (err) {
      // Propagar error para que el componente muestre el mensaje en setError
      throw err instanceof Error
        ? err
        : new Error("Error de red o del servidor");
    }
  };
  // Eliminado handleLogin: el componente Login usa AuthContext login directamente
  const loginUpdate = async (doc) => {
    if (identificacion != doc.identificacion) {
      setIdentificacion?.(null);
      localStorage.removeItem("auth_user");
      localStorage.removeItem("token");
      localStorage.removeItem("timeLeft");
      localStorage.removeItem("timeExpired");
    }
    try {
      const resp = await fetch(
        `${apiBase}/usuarios/documento/${encodeURIComponent(
          doc.identificacion
        )}`,
        {
          headers: { Accept: "application/json" },
        }
      );
      const statusOk = resp.status === 200;
      const json = await resp.json().catch(() => null);

      if (statusOk && json?.success === true && json?.data?.token) {
        localStorage.setItem("timeLeft", 40 * 60);
        // Notificar al contexto (esto actualiza isAuthenticated)
        loginWithToken(json.data.token, json.data.user);
        const ident2 = json?.data?.user?.documento || doc?.identificacion;
        if (ident2) setIdentificacion?.(ident2);
        toActualizacion(ident2);
        return;
      } else {
        const msg = buildRespError(resp, json, statusOk);
        throw new Error(msg);
      }
    } catch (err) {
      // Propagar error para que el componente muestre el mensaje en setError
      throw err instanceof Error
        ? err
        : new Error("Error de red o del servidor");
    }
  };

  const homeByModule = (m) => {
    switch (m) {
      case "dashboard":
        return "/dashboard";
      case "update":
        return "/actualizacion";
      case "register":
        return "/registro";
      default:
        return "/";
    }
  };
  const ProtectedRoute = ({ allowed, children }) => {
    if (!isAuthenticated) {
      switch (allowed[0]) {
        case "update":
          return <Navigate to="/login-update" replace={true} />;
        case "register":
          return <Navigate to="/login-register" replace={true} />;
        default:
          return <Navigate to="/" replace={true} />;
      }
    }
    if (allowed && !allowed.includes(claims?.module)) {
      return <Navigate to={homeByModule(claims?.module)} replace />;
    }
    return children;
  };
  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={homeByModule(claims?.module)} replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowed={["dashboard"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/actualizados"
        element={
          <ProtectedRoute allowed={["dashboard"]}>
            <UsuariosActualizados />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute allowed={["dashboard"]}>
            <Usuarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios-nuevos"
        element={
          <ProtectedRoute allowed={["dashboard"]}>
            <UsuariosNuevos />
          </ProtectedRoute>
        }
      />

      {/* Si ya está autenticado, evita volver a los logins y manda al home por módulo */}
      <Route
        path="/login-update"
        element={
          isAuthenticated ? (
            <Navigate to={homeByModule(claims?.module)} replace />
          ) : (
            <LoginActualizacion loginUpdate={loginUpdate} />
          )
        }
      />
      <Route
        path="/login-register"
        element={
          isAuthenticated ? (
            <Navigate to={homeByModule(claims?.module)} replace />
          ) : (
            <LoginRegistro loginRegister={loginRegister} />
          )
        }
      />

      <Route
        path="/registro"
        element={
          <ProtectedRoute allowed={["register"]}>
            <Actualizacion modelo="create" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/actualizacion"
        element={
          <ProtectedRoute allowed={["update"]}>
            <Actualizacion modelo="update" />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
