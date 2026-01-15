import { MultiSelect } from "primereact/multiselect";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFormData } from "../context/FormContext";
import useAuth from "../context/useAuth";
import "primeflex/primeflex.css";
import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { RadioButton } from "primereact/radiobutton";
import { ProgressBar } from "primereact/progressbar";
import { ProgressSpinner } from "primereact/progressspinner";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Dropdown as PRDropdown } from "primereact/dropdown";
import { OverlayPanel } from "primereact/overlaypanel";
import { Message } from "primereact/message";
import FirmaManuscrita from "./FirmaManuscrita";
import direccionesData from "../assets/direcciones.json";
const Actualizacion = (model) => {
  const create = model.modelo == "create";
  const stepperRef = useRef(null);
  const navigate = useNavigate();
  const { apiBase, logout, identificacion, setIdentificacion } = useAuth();
  const TOTAL_SECONDS = 40 * 60; // 40 minutos
  const [timeLeft, setTimeLeft] = useState(() => {
    const stored = localStorage.getItem("timeLeft");
    return stored ? parseInt(stored, 10) : TOTAL_SECONDS;
  });
  const tiposIdentificacion = [
    { label: "Cédula de ciudadanía", value: "CC" },
    { label: "Cédula de extranjería", value: "CE" },
    { label: "Permiso por Protección Temporal", value: "PPT" },
    { label: "Número Único de Identificación Personal (Tarjetade identidad)", value: "NUIP" },
  ];
  const tiposIdentificacionAbreviado = [
    { label: "CC", value: "CC" },
    { label: "CE", value: "CE" },
    { label: "PPT", value: "PPT" },
    { label: "RC", value: "RC" },
    { label: "TI", value: "TI" },
    { label: "NUIP", value: "NUIP" },
  ];
  const tiposVivienda = [
    { label: "Arriendo", value: "arriendo" },
    { label: "Propia", value: "propia" },
    { label: "Familiar", value: "familiar" },
    { label: "Hipoteca", value: "hipoteca" },
  ];
  const tiposCondicionVivienda = [
    { label: "Obra negra", value: "obra_negra" },
    { label: "Obra gris", value: "obra_gris" },
    { label: "Terminada", value: "terminada" },
  ];

  const generos = [
    { label: "Masculino", value: "masculino" },
    { label: "Femenino", value: "femenino" },
    // { label: "Otro", value: "otro" },
    // { label: "Prefiero no decirlo", value: "prefiero_no_decirlo" },
  ];
  const estadosCiviles = [
    { label: "Soltero(a)", value: "soltero" },
    { label: "Casado(a)", value: "casado" },
    { label: "Unión libre", value: "union_libre" },
    { label: "Separado(a)", value: "separado" },
    { label: "Viudo(a)", value: "viudo" },
  ];
  const nivelesEducativos = [
    { label: "Primaria", value: "primaria" },
    { label: "Secundaria", value: "secundaria" },
    { label: "Técnico / Tecnólogo", value: "tecnico_tecnologo" },
    { label: "Universitario (pregrado)", value: "universitario" },
    {
      label: "Posgrado (Especialización, Maestría, Doctorado)",
      value: "posgrado",
    },
  ];
  // opcionesDependientes y opcionesRangoEdad se removieron al no usarse actualmente

  const gruposProteccionEspecialOptions = [
    { label: "No", value: "no" },
    { label: "Mujer cabeza de familia", value: "mujer_cabeza_familia" },
    { label: "Pueblo Indígena", value: "pueblo_indigena" },
    {
      label: "Persona con discapacidad física mental o sensorial",
      value: "discapacidad",
    },
    { label: "Población Afrocolombiana", value: "afrocolombiana" },
    { label: "Mayor de 60 años", value: "mayor_60" },
    { label: "Población diversa/LGTBIQ+", value: "lgtbiq_plus" },
    { label: "Otro", value: "otro" },
  ];

  const tiposSolicitante = [
    { label: "Cliente", value: "cliente" },
    { label: "Asociado", value: "asociado" },
    { label: "Vinculado", value: "vinculado" },
    { label: "Contratista", value: "contratista" },
    { label: "Empleado", value: "empleado" },
    { label: "Proveedor", value: "proveedor" },
  ];

  const { formData: form, updateField, bulkUpdate, resetForm } = useFormData();
  const [errors, setErrors] = useState({});
  const [lockedPanels, setLockedPanels] = useState([]); // indices bloqueados
  const [ciudadesOptions, setCiudadesOptions] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showFirma, setShowFirma] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpId, setOtpId] = useState(null);
  const [otpValue, setOtpValue] = useState("");
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(180);
  const [otpChannel, setOtpChannel] = useState("email");
  const [otpPhone, setOtpPhone] = useState("");
  const otpIntervalRef = useRef(null);
  const toastRef = useRef(null);
  const toastTimerRef = useRef(null);
  const leftToastRef = useRef(null);
  const pepHelpRef = useRef(null);
  // Eliminado validatedPanels (no se usa directamente, se aplica visual al header)
  // Soporte PDF (solo en registro)
  const [soporte, setSoporte] = useState(null);
  const [soporteError, setSoporteError] = useState(null);

  const empresasPatronal = [
    { label: "Consorcio Express", value: "100" },
    // { label: "Consorcio Express", value: "106" },
    // { label: "TAO", value: "102" },
    { label: "Cointoulon", value: "111" },
    { label: "Este es mi Bus", value: "104" },
    { label: "Fondexpress", value: "105" },
    { label: "Gran Américas Usme", value: "114" },
    { label: "Gran Américas Provisión", value: "115" },
    { label: "Lugo ingeniería", value: "112" },
    { label: "Mectronics", value: "103" },
  ];
  const opcionesTransporte = [
    { label: "Carro", value: "carro" },
    { label: "Motocicleta", value: "motocicleta" },
    { label: "Bicicleta", value: "bicicleta" },
    { label: "Patineta eléctrica", value: "patineta_electrica" },
    { label: "No", value: "no" },
  ];
  const convenioOptions = [
    { label: "Tarjeta crédito TUYA", value: "tuya" },
    { label: "Créditos Banco Caja Social", value: "banco_caja_social" },
    { label: "Clínica de la Mujer", value: "clinica_mujer" },
    { label: "Exámenes de Laboratorio", value: "examenes_laboratorio" },
    { label: "Chequeos médicos", value: "chequeos_medicos" },
    { label: "Vacunación", value: "vacunacion" },
    { label: "Medicina Prepagada", value: "medicina_prepagada" },
    { label: "Clínica Odontológica", value: "clinica_odontologica" },
    { label: "Plan Exequial", value: "plan_exequial" },
    { label: "Odontología", value: "odontologia" },
    { label: "Plan fúnebre", value: "plan_funebre" },
    { label: "Todas las anteriores", value: "todas" },
    { label: "Ninguno de los anteriores", value: "ninguno" },
  ];
  const [emailSuggestion, setEmailSuggestion] = useState(null);
  // Salario mínimo permitido (COP)
  const MIN_SALARIO_MENSUAL = 1423500;
  // Bloqueo automático de nacionalidad según ciudad de nacimiento
  const [nacionalidadLocked, setNacionalidadLocked] = useState(false);
  // Indica si 'nacionalidad' fue autocompletada por la regla
  const [nacionalidadAuto, setNacionalidadAuto] = useState(false);
  // Fecha máxima permitida para fecha de nacimiento (>= 18 años)
  const adultCutoffDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  }, []);
  // Estado para el modal de dirección
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [addressErrors, setAddressErrors] = useState({});
  const initialAddress = {
    via: null, // CL, KR, DG, TV, AV
    numero1: "",
    letra1: null, // A, B, C
    bis: false,
    cuadrante1: null, // N, S, E, O, NE, NO, SE, SO
    numero2: "",
    letra2: null,
    cuadrante2: null,
    numero3: "",
    complemento: "",
  };
  const [addressDraft, setAddressDraft] = useState(initialAddress);
  const colombiaVias = useMemo(() => {
    const base = Array.isArray(direccionesData?.direcciones)
      ? direccionesData.direcciones
      : [];
    const viaOpts = base
      .filter((d) => d && d.descripcion && d.nomenclatura_dian)
      .map((d) => ({
        label: `${d.descripcion} (${d.nomenclatura_dian})`,
        value: d.nomenclatura_dian,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
    // Fallback si por alguna razón el JSON no trae estas entradas
    if (!viaOpts.length) {
      return [
        { label: "Calle (CL)", value: "CL" },
        { label: "Carrera (KR)", value: "KR" },
        { label: "Diagonal (DG)", value: "DG" },
        { label: "Transversal (TV)", value: "TV" },
        { label: "Avenida (AV)", value: "AV" },
      ];
    }
    return viaOpts;
  }, []);
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    .split("")
    .map((x) => ({ label: x, value: x }));
  const cuadrantes = ["NORTE", "SUR", "ESTE", "OESTE", "NORESTE", "NOROESTE", "SURESTE", "SUROESTE"].map((x) => ({
    label: x,
    value: x,
  }));

  const openAddressDialog = () => {
    // precargar desde campo si ya hay algo (heurístico sencillo)
    setAddressDraft(initialAddress);
    setAddressErrors({});
    setShowAddressDialog(true);
  };
  const closeAddressDialog = () => setShowAddressDialog(false);
  const onAddrChange = (patch) =>
    setAddressDraft((prev) => ({ ...prev, ...patch }));
  const composeAddress = (a) => {
    const parts = [];
    if (a.via) parts.push(a.via);
    if (a.numero1) parts.push(a.numero1);
    if (a.letra1) parts.push(a.letra1);
    if (a.bis) parts.push("BIS");
    if (a.cuadrante1) parts.push(a.cuadrante1);
    if (a.numero2) parts.push("#", a.numero2);
    if (a.letra2) parts.push(a.letra2);
    if (a.cuadrante2) parts.push(a.cuadrante2);
    if (a.numero3) parts.push("-", a.numero3);
    const base = parts.join(" ").replace(/\s+/g, " ").trim();
    return a.complemento ? `${base}, ${a.complemento.trim()}` : base;
  };
  const validateAddress = (a) => {
    const errs = {};
    if (!a.via) errs.via = "Tipo de vía requerido";
    if (!a.numero1) errs.numero1 = "Número principal requerido";
    if (!a.numero2) errs.numero2 = "Segundo número requerido";
    if (!a.numero3) errs.numero3 = "Tercer número requerido";
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const acceptAddress = () => {
    if (!validateAddress(addressDraft)) return;
    const addr = composeAddress(addressDraft);
    handleChange({ target: { name: "direccionResidencia", value: addr } });
    setShowAddressDialog(false);
  };
  const COMMON_EMAIL_DOMAINS = [
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
    "live.com",
    "hotmail.es",
    "outlook.es",
  ];
  const fixCommonTldTypos = (domain) => {
    return domain
      .replace(/\.con$/i, ".com")
      .replace(/\.cmo$/i, ".com")
      .replace(/\.ocm$/i, ".com")
      .replace(/\.comm$/i, ".com")
      .replace(/\.coom$/i, ".com")
      .replace(/\.gom$/i, ".com")
      .replace(/\.vom$/i, ".com");
  };
  const levenshtein = (a = "", b = "") => {
    a = a.toLowerCase();
    b = b.toLowerCase();
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  };
  const nearestDomain = (domain) => {
    const fixed = fixCommonTldTypos(domain);
    let best = { dom: fixed, dist: Infinity };
    for (const d of COMMON_EMAIL_DOMAINS) {
      const dist = levenshtein(fixed, d);
      if (dist < best.dist) best = { dom: d, dist };
    }
    if (best.dist <= 2) return best.dom;
    if (!/\.[a-z]{2,}$/i.test(fixed)) return `${fixed}.com`;
    return null;
  };
  const buildEmailSuggestion = (email) => {
    if (typeof email !== "string") return null;
    const trimmed = email.trim();
    const at = trimmed.indexOf("@");
    if (at < 1) return null;
    const local = trimmed.slice(0, at);
    const domain = trimmed.slice(at + 1).toLowerCase();
    if (!domain) return null;
    const candidate = nearestDomain(domain);
    if (!candidate || candidate === domain) return null;
    return `${local}@${candidate}`;
  };
  const handleEmailBlur = () => {
    const s = buildEmailSuggestion(form.email || "");
    setEmailSuggestion(s);
    // Ocultar toast de ayuda al salir del foco
    leftToastRef.current?.clear?.();
  };
  const handleEmailFocus = () => {
    const list = COMMON_EMAIL_DOMAINS.join(", ");
    // Evitar duplicados
    leftToastRef.current?.clear?.();
    leftToastRef.current?.show?.({
      severity: "info",
      summary: "Dominios de correo más comunes",
      detail: list,
      sticky: true,
      closable: true,
    });
  };
  const applyEmailSuggestion = () => {
    if (!emailSuggestion) return;
    updateField("email", emailSuggestion);
    setEmailSuggestion(null);
  };
  const dismissEmailSuggestion = () => setEmailSuggestion(null);
  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === "email") {
      value = value.replace(/\s+/g, "");
      const atIdx = value.indexOf("@");
      if (atIdx !== -1) {
        const local = value.slice(0, atIdx);
        const domain = value.slice(atIdx + 1).toLowerCase();
        value = `${local}@${domain}`;
      }
      if (emailSuggestion) setEmailSuggestion(null);
    }
    updateField(name, value);
  };

  // Confirmación antes de finalizar
  const handleFinalizarClick = () => {
    setSaving(true);
    // if (saving) return;
    // Pre-validación específica de referencias familiares: al menos 1
    const rows = Array.isArray(form.beneficiarios) ? form.beneficiarios : [];

    if (rows.length === 0) {
      setErrors((prev) => ({
        ...prev,
        beneficiarios: "Agregue al menos una referencia familiar",
      }));
      setSaving(false);
      confirmDialog({
        message: "Debe agregar al menos una referencia familiar.",
        header: "Validación",
        icon: "pi pi-info-circle",
        acceptLabel: "Entendido",
        rejectClassName: "hidden",
        defaultFocus: "accept",
      });
      // Enfocar bloque de referencias
      setTimeout(() => {
        const el = document.getElementById("beneficiariosSection");
        if (el && el.scrollIntoView)
          el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);

      return;
    } else {
      let msj = "";
      rows.forEach((b, i) => {
        if (b.nombres == "" || !b.nombres) {
          msj += "Nombre de referencia familiar requerido (" + (i + 1) + ")\n";
        }
        if (b.numero == "" || !b.numero) {
          msj +=
            "Número de identificación requerido (" +
            (i + 1) +
            ")\n";
        }
        if (b.parentesco == "" || !b.parentesco) {
          msj += "Parentesco requerido (" + (i + 1) + ")\n";
        }

        if (!b.fechaNacimiento || normalizeDate(b.fechaNacimiento) == "") {
          msj +=
            "Fecha de nacimiento requerida (" +
            (i + 1) +
            ")\n";
        }

        if (b.tipo == "" || !b.tipo) {
          msj +=
            "Tipo de identificación requerido (" +
            (i + 1) +
            ")\n";
        }
        if (b.pep == "" || !b.pep) {
          msj +=
            "Persona expuesta políticamente requerido (" +
            (i + 1) +
            ")\n";
        }
      });
      if (msj != "") {
        setSaving(false);
        setErrors((prev) => ({
          ...prev,
          beneficiarios: (
            <span style={{ whiteSpace: "pre-line" }}>{msj}</span>
          ),
        }));
        return;
      }
    }
    // Validar antes de confirmar
    if (!validatePanel(4)) {
      // Reutilizar el mismo scroll al primer error que en handleNext
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const el = document.getElementById(firstErrorField);
          if (el && el.scrollIntoView)
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
      setSaving(false);
      return;
    }

    confirmDialog({
      message:
        "¿Está seguro de enviar la actualización de datos? Podría no poder editar después.",
      header: "Confirmar envío",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí, enviar",
      rejectLabel: "Cancelar",
      defaultFocus: "accept",
      acceptClassName: "p-button-success",
      rejectClassName: "p-button-text",
      accept: () => finalizeSubmission(),
      reject: () => setSaving(false),
    });
  };
  // Envío final: guarda en la API y avanza el stepper
  const normalizeDate = (d) => {
    if (!d) return null;
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    return String(d);
  };
  const finalizeSubmission = async () => {
    if (saving) return;
    try {
      const payload = {
        // year lo define el backend con el año en curso
        documento: identificacion || form.identificacion || null,
        ...form,
        fechaNacimiento: normalizeDate(form.fechaNacimiento),
        fechaExpedicion: normalizeDate(form.fechaExpedicion),
        fechaInicioIngreso: normalizeDate(form.fechaInicioIngreso),
        beneficiarios: (form.beneficiarios || []).map((b) => ({
          ...b,
          fechaNacimiento: normalizeDate(b?.fechaNacimiento),
        })),
      };
      console.log(payload);
      
      const token = localStorage.getItem("token");
      const metodo = create ? "registro" : "actualizaciones";
      const options = { method: "POST", headers: {} };
      let url = `${apiBase}/${metodo}`;
      if (create) {
        // En registro: enviar multipart con '__json' y 'soporte'
        const fd = new FormData();
        // Señalamos que es create=true para activar la validación en backend
        const merged = { ...payload, create: true };
        fd.append("__json", JSON.stringify(merged));
        if (soporte) {
          fd.append("soporte", soporte);
        }
        options.body = fd;
        options.headers = {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
      } else {
        // En actualización: JSON directo
        options.body = JSON.stringify(payload);
        options.headers = {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
      }
      const resp = await fetch(url, options);
      const json = await resp.json().catch(() => null);
      if (!(resp.status === 201 && json?.success)) {
        console.error("Fallo guardando actualización", json || resp.status);
        const msg =
          json?.message ||
          "No se pudo guardar la actualización. Intente nuevamente.";
        toastRef.current?.show({
          severity: "error",
          summary: "No se pudo guardar",
          detail: msg,
          life: 6000,
        });
        setSaving(false);
        return;
      }
      toastRef.current?.show({
        severity: "success",
        summary: "Actualización guardada",
        detail: "A continuación, firme para finalizar.",
        life: 6000,
        closable: false,
      });
      markPanelValidated(4);
      // Esperar a que el Toast de éxito se cierre para pasar a la firma
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => {
        // En lugar de ir directo a firma, solicitamos OTP
        requestOtp();
        toastTimerRef.current = null;
      }, 5000);
      // No avanzamos el stepper mientras se captura la firma
    } catch (e) {
      console.error("Error de red guardando actualización", e);
      toastRef.current?.show({
        severity: "error",
        summary: "Error de red",
        detail: "No se pudo guardar la actualización. Intente nuevamente.",
        life: 6000,
      });
    } finally {
      // setSaving(false);
    }
  };

  // Guardado de firma: enviar imagen y token al servicio generarFormulario
  const handleSignatureSave = async (dataUrl) => {
    try {
      const token = localStorage.getItem("token");
      const endpoints = [`${apiBase}/generarFormulario`];
      let json = null;
      let ok = false;
      for (const url of endpoints) {
        try {
          const resp = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              // Enviamos la imagen de la firma (base64) y token por compatibilidad
              firma: dataUrl,
              image: dataUrl,
              token: token || undefined,
              documento: identificacion || form.identificacion || null,
            }),
          });
          json = await resp.json().catch(() => null);
          ok = resp.status === 200 && (json?.success ?? true);
          if (ok) break;
        } catch {
          // probar siguiente endpoint
        }
      }
      if (ok) {
        const msg = json?.message || "Formulario generado correctamente.";
        // Guardar mensaje flash en sessionStorage para mostrarlo en login-update
        try {
          sessionStorage.setItem("flashInfo", msg);
          // Resetear el formulario en memoria y storage para evitar rehidratación
          try {
            if (typeof resetForm === "function") resetForm();
          } catch {
            // console.debug("resetForm failed", err);
          }
          // Limpiar Auth Context y almacenamiento

          if (typeof logout === "function") logout();
        } catch {
          // ignore
        }
        // Redirigir a login-update

        navigate(create ? "/login-register" : "/login-update", {
          replace: true,
        });
      } else {
        const errMsg = json?.message || "No se pudo generar el formulario.";
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: errMsg,
          life: 6000,
        });
      }
    } catch (e) {
      console.error("Error enviando firma", e);
      toastRef.current?.show({
        severity: "error",
        summary: "Error de red",
        detail: "No se pudo enviar la firma. Intente nuevamente.",
        life: 6000,
      });
    }
  };

  // Para PrimeReact Dropdown:
  const handleDropdownChange = (name, value) => {
    // Lógica especial para transportePersonal
    if (name === "transportePersonal") {
      // Si selecciona "no", solo puede estar "no" seleccionado
      if (value.includes("no")) {
        updateField("transportePersonal", ["no"]);
      } else {
        // Si selecciona cualquier otro, quitar "no" si estaba
        updateField(
          "transportePersonal",
          value.filter((v) => v !== "no")
        );
      }
    } else if (name === "temasEducativos") {
      const patch = { temasEducativos: value };
      if (!value.includes("otro")) patch.temasEducativosOtro = "";
      bulkUpdate(patch);
    } else if (name === "deseaAhorroAdicional") {
      const patch = { deseaAhorroAdicional: value };
      if (value !== "si") patch.ahorroAdicionalMensual = "";
      bulkUpdate(patch);
    } else if (name === "gruposProteccionEspecial") {
      let selected = Array.isArray(value) ? [...value] : [];
      // Si selecciona 'no', solo 'no'
      if (selected.includes("no")) {
        selected = ["no"];
      } else {
        // Si selecciona cualquier otro, quitar 'no' si estaba
        selected = selected.filter((v) => v !== "no");
      }
      const patch = { gruposProteccionEspecial: selected };
      if (!selected.includes("otro")) patch.grupoProteccionEspecialOtro = "";
      bulkUpdate(patch);
    } else if (name === "conveniosConocidos") {
      let selected = [...value];
      // Si selecciona 'ninguno', deja solo 'ninguno'
      if (selected.includes("ninguno")) {
        selected = ["ninguno"];
      }
      // Si selecciona 'todas', expandimos a todas las opciones normales + 'todas'
      if (selected.includes("todas")) {
        const allNormal = convenioOptions
          .filter((o) => !["todas", "ninguno"].includes(o.value))
          .map((o) => o.value);
        selected = ["todas", ...allNormal];
      }
      // Si 'todas' está pero falta alguna normal, quitar 'todas'
      if (selected.includes("todas")) {
        const allNormal = convenioOptions
          .filter((o) => !["todas", "ninguno"].includes(o.value))
          .map((o) => o.value);
        const hasAll = allNormal.every((v) => selected.includes(v));
        if (!hasAll) {
          selected = selected.filter((v) => v !== "todas");
        }
      }
      // Si se selecciona cualquier otro y estaba 'ninguno', remover 'ninguno'
      if (
        selected.includes("ninguno") &&
        selected.some((v) => v !== "ninguno")
      ) {
        selected = selected.filter((v) => v !== "ninguno");
      }
      updateField("conveniosConocidos", selected);
    } else {
      updateField(name, value);
    }
  };

  // Autocompletar y bloquear nacionalidad: si nacionalidad está vacía y
  // ciudadNacimiento es distinta de '99999', poner 'colombiano' y bloquear.
  // Si ciudadNacimiento es '99999' o se limpia, desbloquear y, si fue autocompletada,
  // limpiar el campo para permitir edición.
  useEffect(() => {
    const ciudad = form?.ciudadNacimiento;
    const es99999 = String(ciudad ?? "") === "99999";
    if (ciudad && !es99999) {
      const vacia = !form?.nacionalidad || String(form.nacionalidad).trim() === "";
      if (vacia) {
        updateField("nacionalidad", "colombiano");
        setNacionalidadAuto(true);
      }
      setNacionalidadLocked(true);
    } else {
      setNacionalidadLocked(false);
      if (nacionalidadAuto) {
        const val = (form?.nacionalidad ?? "").toString().trim().toLowerCase();
        if (val === "colombiano") {
          updateField("nacionalidad", "");
        }
        setNacionalidadAuto(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.ciudadNacimiento]);

  // Establecer tipoReferencia como 'personal' por defecto si está vacío
  useEffect(() => {
    if (!form?.tipoReferencia) {
      updateField("tipoReferencia", "personal");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Beneficiarios: helpers para tabla dinámica ---
  const addBeneficiario = () => {
    const rows = Array.isArray(form.beneficiarios)
      ? [...form.beneficiarios]
      : [];
    rows.push({
      nombres: "",
      parentesco: "",
      fechaNacimiento: null,
      tipo: "",
      numero: "",
      pep: "", // 'si' | 'no'
    });
    handleChange({ target: { name: "beneficiarios", value: rows } });
  };

  const updateBeneficiarioField = (index, field, value) => {
    const rows = Array.isArray(form.beneficiarios)
      ? [...form.beneficiarios]
      : [];
    if (!rows[index]) return;
    rows[index] = { ...rows[index], [field]: value };
    handleChange({ target: { name: "beneficiarios", value: rows } });
  };

  const removeBeneficiario = (index) => {
    const rows = Array.isArray(form.beneficiarios)
      ? [...form.beneficiarios]
      : [];
    rows.splice(index, 1);
    handleChange({ target: { name: "beneficiarios", value: rows } });
  };

  // Convierte posibles strings ("YYYY-MM-DD", "DD/MM/AAAA") a Date local
  const toLocalDate = (v) => {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v === "string") {
      const s = v.trim();
      // ISO simple: YYYY-MM-DD o con tiempo YYYY-MM-DDTHH:MM:SS
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      // Formato dd/mm/aa(aa)
      const dm = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
      if (dm) {
        const d = Number(dm[1]);
        const mo = Number(dm[2]) - 1;
        const year = dm[3].length === 2 ? Number(`20${dm[3]}`) : Number(dm[3]);
        return new Date(year, mo, d);
      }
      // Fallback: intentar parseo nativo
      const parsed = new Date(s);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  // Opciones de parentesco para beneficiarios
  const parentescosBeneficiario = [
    "Cónyuge/compañero(a) permanente",
    "Hijo(a)",
    "Madre",
    "Padre",
    "Hermano(a)",
    "Otro",
  ].map((p) => ({ label: p, value: p }));

  // Validación por panel
  const validatePanel = (index) => {
    const newErrors = {};
    const req = (field, msg = "Campo requerido") => {
      const v = form[field];
      if (
        v === undefined ||
        v === null ||
        (typeof v === "string" && v.trim() === "") ||
        (Array.isArray(v) && v.length === 0)
      ) {
        newErrors[field] = msg;
      }
    };
    switch (index) {
      case 0: // Datos personales
        [
          "tipoSolicitante",
          "tipoIdentificacion",
          "primerNombre",
          "primerApellido",
          "fechaNacimiento",
          "ciudadNacimiento",
          "fechaExpedicion",
          "municipioExpedicion",
          "genero",
          "estadoCivil",
          "nivelEducativo",
          "gruposProteccionEspecial",
          "funcionarioPublico",
          "administraRecursosPublicos",
          "familiaresPoderPublico",
          "reconocimientoPublico",
        ].forEach((f) => req(f));
        if (
          Array.isArray(form.gruposProteccionEspecial) &&
          form.gruposProteccionEspecial.includes("otro")
        ) {
          req("grupoProteccionEspecialOtro", "Especifique cuál");
        }
        if (
          Array.isArray(form.transportePersonal) &&
          (form.transportePersonal.includes("carro") ||
            form.transportePersonal.includes("motocicleta")) &&
          !form.placa
        ) {
          newErrors.placa = "Indique placa y modelo";
        }
        break;
      case 1: // Datos de contacto
        [
          "email",
          "ciudadResidencia",
          "direccionResidencia",
          "barrio",
          "telefonoFijo",
          "tiposVivienda",
          "condicionVivienda",
        ].forEach((f) => req(f));
        // Teléfono fijo: debe tener entre 7 y 10 dígitos si está presente y no falló por requerido
        if (form.telefonoFijo && !newErrors.telefonoFijo) {
          const len = form.telefonoFijo.toString().length;
          if (len < 7 || len > 10) {
            newErrors.telefonoFijo = "Debe tener entre 7 y 10 dígitos";
          }
        }
        // Validar formato solo si no está vacío y no falló por requerido
        if (
          form.email &&
          !newErrors.email &&
          !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)
        ) {
          newErrors.email = "Correo inválido";
        }
        if (!form.celular) {
          newErrors.celular = "Campo requerido";
        } else if (form.celular.toString().length !== 10) {
          newErrors.celular = "Debe tener 10 dígitos";
        }
        break;
      case 2: // Datos adicionales
        req("personasDependientes");
        if (form.personasDependientes > 0) {
          if (
            !form.rangosEdadDependientes ||
            form.rangosEdadDependientes.length === 0
          ) {
            newErrors.rangosEdadDependientes = "Seleccione al menos un rango";
          }
        }
        [
          "nombreContacto",
          "celularContacto",
          "interesCarrera",
          "educacionSolidaria",
        ].forEach((f) => req(f));
        if (
          form.celularContacto &&
          form.celularContacto.toString().length < 10
        ) {
          newErrors.celularContacto = "Debe tener 10 dígitos";
        }
        break;
      case 3: // Datos laborales
        [
          "cargo",
          // Profesión también es obligatoria
          // Usaremos mensaje específico más abajo
          "tipoContrato",
          "fechaInicioIngreso",
          "salarioMensual",
          "totalActivos",
          "totalPasivos",
          "egresos",
          "operaMonedaExtranjera",
        ].forEach((f) => req(f));
        // Mensaje específico solicitado para profesión
        req("profesion", "ESTE CAMPO ES REQUERIDO");
        // Validación de salario mínimo
        if (form.salarioMensual && !newErrors.salarioMensual) {
          const n = parseInt(String(form.salarioMensual).replace(/,/g, ""), 10);
          if (isNaN(n) || n < MIN_SALARIO_MENSUAL) {
            newErrors.salarioMensual = "Debe ser igual o mayor a $" + MIN_SALARIO_MENSUAL.toLocaleString();
          }
        }
        // Cuando es registro (create), estas dos son obligatorias
        if (create) {
          req("empresaPatronal");
          req("deseaAhorroAdicional");
        }
        if (
          form.otrosIngresos &&
          !form.origenOtrosIngresos &&
          form.otrosIngresos != 0
        ) {
          newErrors.origenOtrosIngresos = "Indique el origen";
        }
        if (form.deseaAhorroAdicional === "si") {
          req("ahorroAdicionalMensual", "Indique el valor mensual");
        }
        if (form.operaMonedaExtranjera === "si") {
          req("tipoOperacion");
          req("ciudadOperacion");
          req("paisOperacion");
          if (
            Array.isArray(form.tipoOperacion) &&
            form.tipoOperacion.includes("otra")
          ) {
            req("tipoOperacionOtra", "Especifique la otra operación");
          }
        }
        // Cuentas en el exterior
        req("poseeCuentasExterior");
        if (form.poseeCuentasExterior === "si") {
          [
            "cuentaExteriorMoneda",
            "cuentaExteriorBanco",
            "cuentaExteriorCuenta",
            "cuentaExteriorCiudad",
            "cuentaExteriorPais",
          ].forEach((f) => req(f));
        }
        // Operaciones con activos/monedas virtuales
        req("operaActivosVirtuales");
        if (form.operaActivosVirtuales === "si") {
          req("activosVirtualesCuales", "Especifique cuáles");
        }
        break;
      case 4: // Encuesta general
        [
          // Referencia
          "tipoReferencia",
          "referenciaNombreApellidos",
          // Encuesta
          "actualizacionFacil",
        ].forEach((f) => req(f));
        // Validación celular de referencia (exactamente 10 dígitos)
        if (!form.referenciaCelular) {
          newErrors.referenciaCelular = "Campo requerido";
        } else if (form.referenciaCelular.toString().length !== 10) {
          newErrors.referenciaCelular = "Debe tener 10 dígitos";
        }
        // Validar soporte PDF en registro
        if (create) {
          if (!soporte) {
            newErrors.soporte = "Adjunte el soporte en PDF (máx. 20MB)";
          } else if (soporte && soporte.size > 20 * 1024 * 1024) {
            newErrors.soporte = "El archivo no debe superar 20MB";
          } else if (
            soporte &&
            soporte.type !== "application/pdf" &&
            !/\.pdf$/i.test(soporte.name || "")
          ) {
            newErrors.soporte = "El soporte debe ser un PDF";
          }
        }
        if (form.emprendimientoActual === "si") req("emprendimientoTipo");
        if (
          Array.isArray(form.temasEducativos) &&
          form.temasEducativos.includes("otro")
        )
          req("temasEducativosOtro");
        if (form.actualizacionFacil === "no")
          req("actualizacionFacilPorque", "Explique la razón");
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const markPanelValidated = (index) => {
    const headers = document.querySelectorAll(".p-stepper .p-stepper-header");
    if (headers[index]) headers[index].classList.add("step-validated");
  };

  const [saving, setSaving] = useState(false);
  const handleNext = async (panelIndex) => {
    if (validatePanel(panelIndex)) {
      // Si es el último panel (4), guardar en la API antes de finalizar
      if (panelIndex === 4) {
        // El botón Finalizar abre confirmación; aquí no navegamos
        return;
      }
      markPanelValidated(panelIndex);
      stepperRef.current.nextCallback();
    } else {
      // Scroll al primer error
      setTimeout(() => {
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const el = document.getElementById(firstErrorField);
          if (el && el.scrollIntoView)
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }
  };

  // isInvalid eliminado (por ahora no se muestran mensajes inline)
  const invalidClass = (name) => (errors[name] ? "p-invalid" : "");
  const errorMsg = (name) =>
    errors[name] ? (
      <small className="p-error" style={{ display: "block", marginTop: "4px" }}>
        {errors[name]}
      </small>
    ) : null;
  const sanitizePhone = (v) => v.replace(/\D/g, "").slice(0, 10);

  // Validación inmediata para teléfono fijo en blur
  const validateTelefonoFijo = () => {
    const v = form.telefonoFijo ? form.telefonoFijo.toString() : "";
    let msg = null;
    if (!v) msg = "Campo requerido";
    else if (v.length < 7 || v.length > 10)
      msg = "Debe tener entre 7 y 10 dígitos";
    setErrors((prev) => ({ ...prev, telefonoFijo: msg }));
  };

  // En el submit:
  // handleSubmit eliminado (aún no se usa envío a backend aquí)

  useEffect(() => {}, []);

  // Al cambiar la identificación activa, limpiar estado de UI para evitar
  // que queden datos pegados del usuario anterior.
  useEffect(() => {
    try { leftToastRef.current?.clear?.(); } catch {}
    try { toastRef.current?.clear?.(); } catch {}
    setErrors({});
    setLockedPanels([]);
    setShowFirma(false);
    setShowOtp(false);
    setOtpId(null);
    setOtpValue("");
    setOtpSecondsLeft(180);
    setOtpChannel("email");
    setOtpPhone("");
    setAddressDraft(initialAddress);
    setAddressErrors({});
    setEmailSuggestion(null);
    setNacionalidadLocked(false);
    setNacionalidadAuto(false);
  }, [identificacion]);

  // Cargar datos del usuario autenticado consumiendo GET /usuarios/@id
  useEffect(() => {
    const storedAuth = localStorage.getItem("auth_user");
    const token = localStorage.getItem("token");
    if (!storedAuth || !token) {
      localStorage.removeItem("identificacion");
      localStorage.removeItem("token");
      localStorage.removeItem("timeExpired");
      navigate(create ? "/login-register" : "/login-update", { replace: true });
      return;
    }

    let idUsuario = null;
    try {
      idUsuario = JSON.parse(storedAuth)?.id_usuario ?? null;
    } catch {
      idUsuario = null;
    }
    if (!idUsuario && !create) {
      navigate("/login-update", { replace: true });
      return;
    }

    (async () => {
      try {
        let metodo = create ? "register/start" : "usuarios";
        const resp = await fetch(`${apiBase}/${metodo}/${idUsuario}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const statusOk = resp.status === 200;
        const json = await resp.json().catch(() => null);
        if (statusOk && json?.success) {
          const u = json.data || json.user || json;
          // Prefijar identificación si no está
          const doc = u.documento || u.identificacion;
          if (!identificacion && doc) {
            setIdentificacion(doc);
            localStorage.setItem("identificacion", doc);
          }
          // Opcional: prellenar nombres/apellidos si el backend expone 'nombre'
          if (u.nombre && (!form.primerNombre || !form.primerApellido)) {
            const parts = String(u.nombre).trim().split(/\s+/).filter(Boolean);
            const patch = {};
            if (parts.length >= 4) {
              patch.primerNombre = parts[0];
              patch.segundoNombre = parts[1];
              patch.primerApellido = parts[parts.length - 2];
              patch.segundoApellido = parts[parts.length - 1];
            } else if (parts.length === 3) {
              patch.primerNombre = parts[0];
              patch.primerApellido = parts[1];
              patch.segundoApellido = parts[2];
            } else if (parts.length === 2) {
              patch.primerNombre = parts[0];
              patch.primerApellido = parts[1];
            } else if (parts.length === 1) {
              patch.primerNombre = parts[0];
            }
            bulkUpdate(patch);
          }

          // Si es actualización, intentar hidratar desde la última actualización previa
          if (!create && idUsuario) {
            try {
              const resp2 = await fetch(`${apiBase}/actualizaciones/ultimo/${idUsuario}`, {
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
              const ok2 = resp2.status === 200;
              const json2 = await resp2.json().catch(() => null);
              if (ok2 && json2?.success && json2?.data?.payload) {
                const prev = json2.data.payload;
                // Normalizar fechas a Date cuando sea posible
                const patch2 = { ...prev };
                if (patch2.fechaNacimiento) patch2.fechaNacimiento = toLocalDate(patch2.fechaNacimiento);
                if (patch2.fechaExpedicion) patch2.fechaExpedicion = toLocalDate(patch2.fechaExpedicion);
                if (patch2.fechaInicioIngreso) patch2.fechaInicioIngreso = toLocalDate(patch2.fechaInicioIngreso);
                if (Array.isArray(patch2.beneficiarios)) {
                  patch2.beneficiarios = patch2.beneficiarios.map((b) => ({
                    ...b,
                    fechaNacimiento: toLocalDate(b?.fechaNacimiento),
                  }));
                }
                // Asegurar tipos esperados en arrays
                if (typeof patch2.transportePersonal === "string") {
                  try { patch2.transportePersonal = JSON.parse(patch2.transportePersonal); } catch { /* ignore */ }
                }
                if (typeof patch2.gruposProteccionEspecial === "string") {
                  try { patch2.gruposProteccionEspecial = JSON.parse(patch2.gruposProteccionEspecial); } catch { /* ignore */ }
                }
                bulkUpdate(patch2);
              }
            } catch (e) {
              console.error("No se pudo hidratar datos previos de actualización", e);
            }
          }
        } else {
          // Si vence token o falla, regresar al login
          if (
            resp.status === 401 ||
            resp.status === 403 ||
            resp.status === 404
          ) {
            if (typeof logout === "function") logout();
            localStorage.removeItem("identificacion");
            localStorage.removeItem("timeLeft");
            localStorage.removeItem("timeExpired");
            navigate(create ? "/login-register" : "/login-update", {
              replace: true,
            });
          }
          console.error(
            "Error consultando /usuarios/@id:",
            json?.message || resp.status
          );
        }
      } catch (e) {
        console.error("Fallo de red en /usuarios/@id", e);
      } finally {
        setLoadingUser(false);
      }
    })();
    // Nota: bulkUpdate y updateField son estables del contexto; evitamos agregarlos
    // para no re-disparar innecesariamente. 'identificacion' se setea localmente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, navigate]);

  // Cleanup del temporizador del toast en desmontaje
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, []);

  // Solicitar OTP al backend
  const requestOtp = async () => {
    try {
      const email = form.email;
      const onlyDigits = (s) => (s || "").replace(/\D+/g, "");
      const rawPhone = otpPhone || form.celular || "";
      const digits = onlyDigits(rawPhone);
      if (otpChannel === "email") {
        if (!email) {
          toastRef.current?.show({
            severity: "error",
            summary: "Correo faltante",
            detail: "No se encontró correo para enviar OTP.",
          });
          return;
        }
      } else {
        if (!digits) {
          toastRef.current?.show({
            severity: "error",
            summary: "Teléfono faltante",
            detail: "Ingrese un número de celular para enviar OTP.",
          });
          return;
        }
      }
      const token = localStorage.getItem("token");
      const resp = await fetch(`${apiBase}/actualizaciones/otp/solicitar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(
          (() => {
            const base = {
              documento: identificacion || form.identificacion || null,
            };
            if (otpChannel === "email")
              return { ...base, channel: "email", email };
            if (otpChannel === "sms") {
              const e164 = digits.startsWith("57")
                ? `+${digits}`
                : `+57${digits}`;
              return { ...base, channel: "sms", phone: e164 };
            }
            const wa = digits.startsWith("57") ? digits : `57${digits}`;
            return { ...base, channel: "whatsapp", phone: wa };
          })()
        ),
      });
      const json = await resp.json().catch(() => null);
      if (resp.ok && json?.success) {
        setOtpId(json.data?.otp_id ?? json.otp_id ?? null);
        // Reiniciar estado y contador OTP al reenviar
        if (otpIntervalRef.current) {
          clearInterval(otpIntervalRef.current);
          otpIntervalRef.current = null;
        }
        setOtpSecondsLeft(300);
        setOtpValue("");
        setShowOtp(true);
        toastRef.current?.show({
          severity: "info",
          summary: "OTP enviado",
          detail:
            otpChannel === "email"
              ? `Hemos enviado un código a ${email}`
              : `Hemos enviado un código al ${otpChannel.toUpperCase()} ${rawPhone}`,
        });
      } else {
        setSaving(false);
        toastRef.current?.show({
          severity: "error",
          summary: "Error enviando OTP",
          detail: json?.message || "Intente nuevamente.",
        });
      }
    } catch (e) {
      console.error("No se pudo solicitar OTP", e);
      toastRef.current?.show({
        severity: "error",
        summary: "Error de red",
        detail: "No se pudo solicitar OTP.",
      });
    }
  };

  const validateOtp = async () => {
    try {
      if (!otpId) {
        toastRef.current?.show({
          severity: "error",
          summary: "OTP no iniciado",
          detail: "Solicite un nuevo código.",
        });
        return;
      }
      const resp = await fetch(`${apiBase}/actualizaciones/otp/validar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp_id: otpId, codigo: otpValue.trim() }),
      });
      const json = await resp.json().catch(() => null);
      if (resp.ok && json?.success && json?.data?.valid) {
        setShowOtp(false);
        setShowFirma(true);
        toastRef.current?.show({
          severity: "success",
          summary: "Validación correcta",
          detail: "Puede continuar a firmar.",
        });
      } else {
        toastRef.current?.show({
          severity: "warn",
          summary: "Código inválido",
          detail: json?.message || "Revise e intente nuevamente.",
        });
      }
    } catch (e) {
      console.error("No se pudo validar OTP", e);
      toastRef.current?.show({
        severity: "error",
        summary: "Error de red",
        detail: "No se pudo validar OTP.",
      });
    }
  };

  // Cargar ciudades desde /ciudades
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = localStorage.getItem("token");
        const resp = await fetch(`${apiBase}/ciudades`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const statusOk = resp.status === 200;
        const json = await resp.json().catch(() => null);
        if (!cancelled && statusOk && json?.success) {
          const items = json?.data?.items || json?.items || [];
          const opts = items.map((c) => ({
            label: c.descripcion || c.label || String(c).trim(),
            value: c.dane_code || c.value || String(c).trim(),
          }));
          setCiudadesOptions(opts);
        } else if (!cancelled) {
          console.error(
            "Error listando ciudades:",
            json?.message || resp.status
          );
          setCiudadesOptions([]);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Fallo de red en /ciudades", e);
          setCiudadesOptions([]);
        }
      } finally {
        if (!cancelled) setLoadingCities(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);
  // Countdown principal (40 min)
  useEffect(() => {
    if (timeLeft <= 0) return; // detener si terminó
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        localStorage.setItem("timeLeft", String(next));
        return next > 0 ? next : 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Cuando el tiempo termina: limpiar identificación y regresar al login
  useEffect(() => {
    if (timeLeft <= 0) {
      if (typeof logout === "function") logout();
      localStorage.removeItem("identificacion");
      localStorage.removeItem("timeLeft");
      localStorage.setItem("timeExpired", "1");
      navigate(create ? "/login-register" : "/login-update", { replace: true });
    }
  }, [timeLeft, navigate, logout, create]);

  // Temporizador de OTP: 3 minutos
  useEffect(() => {
    if (!showOtp) return;
    if (otpIntervalRef.current) {
      clearInterval(otpIntervalRef.current);
    }
    otpIntervalRef.current = setInterval(() => {
      setOtpSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(otpIntervalRef.current);
          otpIntervalRef.current = null;
          // Tiempo agotado: regresar a login-update
          toastRef.current?.show({
            severity: "warn",
            summary: "Tiempo agotado",
            detail: "Vuelve a iniciar para continuar.",
          });
          setShowOtp(false);
          navigate(create ? "/login-register" : "/login-update");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (otpIntervalRef.current) {
        clearInterval(otpIntervalRef.current);
        otpIntervalRef.current = null;
      }
    };
  }, [showOtp, navigate, create]);

  const formatOtpTime = (s) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  const handleModifyEmailClick = () => {
    // Cerrar OTP, volver al stepper y navegar al primer panel (información personal)
    // Resetear y limpiar temporizador OTP
    if (otpIntervalRef.current) {
      clearInterval(otpIntervalRef.current);
      otpIntervalRef.current = null;
    }
    setOtpSecondsLeft(180);
    setOtpValue("");
    setOtpId(null);
    setShowOtp(false);
    // Ya no se bloquean paneles; sólo aseguramos volver al primer panel
    setSaving(false);
    setTimeout(() => {
      // Llamar prev varias veces para garantizar volver al primer panel
      for (let i = 0; i < 5; i++) {
        stepperRef.current?.prevCallback?.();
      }
      toastRef.current?.show({
        severity: "info",
        summary: "Edite su correo",
        detail: "Actualice su correo y continúe.",
      });
    }, 50);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const progressPercent = ((TOTAL_SECONDS - timeLeft) / TOTAL_SECONDS) * 100;
  const classForm = "col-12 md:col-6 xl:col-3 p-fluid";
  // Los paneles ya no se bloquean; siempre retornamos false
  const isPanelLocked = () => false;
  const isReady = !loadingCities && !loadingUser;
  // Si ya se guardó el formulario, mostrar el componente de firma manuscrita
  if (showFirma) {
    return (
      <div className="p-3">
        <Toast ref={toastRef} position="top-right" />
        <FirmaManuscrita onSave={handleSignatureSave} />
      </div>
    );
  }

  if (showOtp) {
    return (
      <div className="p-3">
        <Toast ref={toastRef} position="top-right" />
        <div
          className="p-card p-3"
          style={{ maxWidth: 500, margin: "40px auto" }}
        >
          <h3 className="mb-2">Verificación</h3>
          {/* <div className="field d-none">
            <label className="block mb-2">Canal de envío</label>
            <div className="flex align-items-center gap-3">
              <RadioButton
                inputId="otpChEmail"
                name="otpCh"
                value="email"
                onChange={(e) => setOtpChannel(e.value)}
                checked={otpChannel === "email"}
              />
              <label htmlFor="otpChEmail">Email</label>
              <RadioButton
                inputId="otpChSms"
                name="otpCh"
                value="sms"
                onChange={(e) => setOtpChannel(e.value)}
                checked={otpChannel === "sms"}
              />
              <label htmlFor="otpChSms">SMS</label>
              <RadioButton
                inputId="otpChWa"
                name="otpCh"
                value="whatsapp"
                onChange={(e) => setOtpChannel(e.value)}
                checked={otpChannel === "whatsapp"}
              />
              <label htmlFor="otpChWa">WhatsApp</label>
            </div>
          </div> */}
          {(otpChannel === "sms" || otpChannel === "whatsapp") && (
            <div className="field">
              <label htmlFor="otpPhone" className="block mb-2">
                Celular (ej: 3001234567)
              </label>
              <InputText
                id="otpPhone"
                value={otpPhone}
                onChange={(e) => setOtpPhone(e.target.value)}
                placeholder="Número de celular"
              />
            </div>
          )}
          <div className="flex align-items-center justify-content-between mb-2">
            <span style={{ color: "#6b7280" }}>Tiempo restante:</span>
            <span style={{ fontWeight: 600 }}>
              {formatOtpTime(otpSecondsLeft)}
            </span>
          </div>

          {otpChannel === "email" ? (
            <p className="mt-0" style={{ color: "#6b7280" }}>
              Ingresá el código que enviamos a <b>{form.email}</b>.
            </p>
          ) : (
            <p className="mt-0" style={{ color: "#6b7280" }}>
              Ingresá el código que enviamos a tu {otpChannel.toUpperCase()}.
            </p>
          )}
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-shield"></i>
            </span>
            <InputText
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value)}
              maxLength={6}
              placeholder="Código de 6 dígitos"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              label="Validar"
              icon="pi pi-check"
              onClick={validateOtp}
              disabled={!otpValue || otpValue.length < 4}
            />
            <Button
              label="Reenviar"
              icon="pi pi-send"
              severity="secondary"
              onClick={requestOtp}
            />
          </div>
          {otpSecondsLeft <= 120 && (
            <Button
              label="Modificar correo"
              icon="pi pi-user-edit"
              severity="warning"
              className="mt-3"
              onClick={handleModifyEmailClick}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-column"
      style={{ background: "#f4f6fa", minHeight: "100vh" }}
    >
      <ConfirmDialog />
      <Toast ref={toastRef} position="top-right" />
      <Toast ref={leftToastRef} position="top-left" />
      <nav
        className="app-navbar flex align-items-center justify-content-between px-4 py-2"
        style={{
          background: "#ffffff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex align-items-center gap-2">
          <img
            src="/img/LOGO_COONALTRAGAS_FND-1.png"
            alt="Logo"
            style={{ height: "48px" }}
          />
          <h2 className=" pl-5" style={{ fontSize: "1.1rem" }}>
            {create ? "Inscripción Asociado " : " Actualización de Datos "}{" "}
            {new Date().getFullYear()}
          </h2>
        </div>
        <div
          className="flex flex-column align-items-end timer-box"
          style={{ minWidth: "260px" }}
        >
          <small
            className="timer-text"
            style={{
              fontWeight: 500,
              color: timeLeft <= 60 ? "#d32f2f" : undefined,
            }}
          >
            {timeLeft > 0 ? (
              <>
                <span className="timer-label">Tiempo restante: </span>
                <span id="timer-text">{formatTime(timeLeft)}</span>
              </>
            ) : (
              <span className="timer-expired">Tiempo expirado</span>
            )}
          </small>
          <ProgressBar
            value={progressPercent}
            showValue={false}
            style={{ height: "8px", width: "240px" }}
          />
          <div className="mt-2">
            <Button
              label="Salir"
              icon="pi pi-sign-out"
              size="small"
              severity="danger"
              text
              onClick={() => {
                if (typeof logout === "function") logout();
                localStorage.removeItem("identificacion");
                localStorage.removeItem("timeLeft");
                localStorage.removeItem("timeExpired");
                navigate(create ? "/login-register" : "/login-update", {
                  replace: true,
                });
              }}
            />
          </div>
        </div>
      </nav>
      <div className="flex justify-content-center flex-auto">
        {!isReady ? (
          <div
            className="flex flex-column align-items-center justify-content-center"
            style={{ width: "80%", padding: "2rem" }}
          >
            <ProgressSpinner />
            <small style={{ marginTop: 8 }}>Cargando información...</small>
          </div>
        ) : (
          <div
            className="card app-card-responsive"
            style={{
              width: "80%",
              paddingTop: "2rem",
              paddingRight: "2rem",
              textAlign: "center",
              background: "#fff",
            }}
          >
            <Stepper
              ref={stepperRef}
              className="stepper-responsive"
              style={{ flexBasis: "50rem" }}
              orientation="vertical"
            >
              <StepperPanel header="Información personal">
                <div
                  className={`flex flex-column ${
                    isPanelLocked(0) ? "panel-locked" : ""
                  }`}
                >
                  <div className="border-2 border-dashed surface-border border-round surface-ground flex-auto flex font-medium p-3">
                    <div
                      className={`w-full ${
                        document?.querySelector?.(
                          ".p-stepper .p-stepper-header.step-validated"
                        )
                          ? ""
                          : ""
                      }`}
                    >
                      {" "}
                      {/* placeholder */}
                      <div className="formgrid grid p-fluid">

                        <div className={`field ${classForm}`}>
                          <label htmlFor="tipoSolicitante">
                            Tipo de solicitante
                          </label>
                          <Dropdown
                            id="tipoSolicitante"
                            value={form.tipoSolicitante}
                            options={tiposSolicitante}
                            onChange={(e) =>
                              handleDropdownChange(
                                "tipoSolicitante",
                                e.value
                              )
                            }
                            placeholder="Seleccione tipo"
                            required
                            className={`w-full mb-1 ${invalidClass(
                              "tipoSolicitante"
                            )}`}
                          />
                          {errorMsg("tipoSolicitante")}
                        </div>
                      
                        <div className={`field ${classForm}`}>
                          <label htmlFor="tipoIdentificacion">
                            Tipo de identificación
                          </label>
                          <Dropdown
                            id="tipoIdentificacion"
                            value={form.tipoIdentificacion}
                            options={tiposIdentificacion}
                            onChange={(e) =>
                              handleDropdownChange(
                                "tipoIdentificacion",
                                e.value
                              )
                            }
                            placeholder="Seleccione tipo"
                            required
                            className={`w-full mb-1 ${invalidClass(
                              "tipoIdentificacion"
                            )}`}
                          />
                          {errorMsg("tipoIdentificacion")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="identificacion">Identificación</label>
                          <InputText
                            id="identificacion"
                            required
                            type="text"
                            value={identificacion}
                            className="w-full mb-3"
                            onChange={(e) => setIdentificacion(e.target.value)}
                            disabled
                          />
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="primerNombre">Primer nombre</label>
                          <InputText
                            id="primerNombre"
                            name="primerNombre"
                            required
                            type="text"
                            value={form.primerNombre}
                            className={`w-full mb-1 ${invalidClass(
                              "primerNombre"
                            )}`}
                            onChange={(e) =>
                              handleChange({
                                target: {
                                  name: "primerNombre",
                                  value: e.target.value.replace(
                                    /[^a-zA-ZÁÉÍÓÚáéíóúÑñÜü'\-\s]/g,
                                    ""
                                  ),
                                },
                              })
                            }
                          />
                          {errorMsg("primerNombre")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="segundoNombre">Segundo nombre</label>
                          <InputText
                            id="segundoNombre"
                            name="segundoNombre"
                            type="text"
                            value={form.segundoNombre}
                            className={`w-full mb-1 ${invalidClass(
                              "segundoNombre"
                            )}`}
                            onChange={(e) =>
                              handleChange({
                                target: {
                                  name: "segundoNombre",
                                  value: e.target.value.replace(
                                    /[^a-zA-ZÁÉÍÓÚáéíóúÑñÜü'\-\s]/g,
                                    ""
                                  ),
                                },
                              })
                            }
                          />
                          {errorMsg("segundoNombre")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="primerApellido">
                            Primer apellido
                          </label>
                          <InputText
                            id="primerApellido"
                            name="primerApellido"
                            required
                            type="text"
                            value={form.primerApellido}
                            className={`w-full mb-1 ${invalidClass(
                              "primerApellido"
                            )}`}
                            onChange={(e) =>
                              handleChange({
                                target: {
                                  name: "primerApellido",
                                  value: e.target.value.replace(
                                    /[^a-zA-ZÁÉÍÓÚáéíóúÑñÜü'\-\s]/g,
                                    ""
                                  ),
                                },
                              })
                            }
                          />
                          {errorMsg("primerApellido")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="segundoApellido">
                            Segundo apellido
                          </label>
                          <InputText
                            id="segundoApellido"
                            name="segundoApellido"
                            type="text"
                            value={form.segundoApellido}
                            className={`w-full mb-1 ${invalidClass(
                              "segundoApellido"
                            )}`}
                            onChange={(e) =>
                              handleChange({
                                target: {
                                  name: "segundoApellido",
                                  value: e.target.value.replace(
                                    /[^a-zA-ZÁÉÍÓÚáéíóúÑñÜü'\-\s]/g,
                                    ""
                                  ),
                                },
                              })
                            }
                          />
                          {errorMsg("segundoApellido")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="fechaNacimiento">
                            Fecha de nacimiento
                          </label>
                          <Calendar
                            id="fechaNacimiento"
                            name="fechaNacimiento"
                            value={form.fechaNacimiento}
                            onChange={handleChange}
                            className={`w-full mb-1 ${invalidClass(
                              "fechaNacimiento"
                            )}`}
                            dateFormat="dd/mm/yy"
                            placeholder="dd/mm/yyyy"
                            showIcon
                            defaultDate={adultCutoffDate}
                            viewDate={adultCutoffDate}
                            maxDate={adultCutoffDate}
                          />
                          {errorMsg("fechaNacimiento")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="ciudadNacimiento">
                            Ciudad de nacimiento
                          </label>
                          <Dropdown
                            id="ciudadNacimiento"
                            value={form.ciudadNacimiento}
                            options={ciudadesOptions}
                            onChange={(e) =>
                              handleDropdownChange("ciudadNacimiento", e.value)
                            }
                            placeholder="Seleccione ciudad"
                            required
                            filter
                            showClear
                            className={`w-full mb-1 ${invalidClass(
                              "ciudadNacimiento"
                            )}`}
                          />
                          {errorMsg("ciudadNacimiento")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="fechaExpedicion">
                            Fecha de expedición del documento
                          </label>
                          <Calendar
                            id="fechaExpedicion"
                            name="fechaExpedicion"
                            value={form.fechaExpedicion}
                            onChange={handleChange}
                            className={`w-full mb-1 ${invalidClass(
                              "fechaExpedicion"
                            )}`}
                            dateFormat="dd/mm/yy"
                            showIcon
                            placeholder="dd/mm/yyyy"
                            maxDate={new Date()}
                          />
                          {errorMsg("fechaExpedicion")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="municipioExpedicion">
                            Municipio de expedición
                          </label>
                          <Dropdown
                            id="municipioExpedicion"
                            value={form.municipioExpedicion}
                            options={ciudadesOptions}
                            onChange={(e) =>
                              handleDropdownChange(
                                "municipioExpedicion",
                                e.value
                              )
                            }
                            placeholder="Seleccione municipio"
                            required
                            filter
                            showClear
                            className={`w-full mb-1 ${invalidClass(
                              "municipioExpedicion"
                            )}`}
                          />
                          {errorMsg("municipioExpedicion")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="genero">Género</label>
                          <Dropdown
                            id="genero"
                            value={form.genero}
                            options={generos}
                            onChange={(e) =>
                              handleDropdownChange("genero", e.value)
                            }
                            placeholder="Seleccione género"
                            required
                            className={`w-full mb-1 ${invalidClass("genero")}`}
                          />
                          {errorMsg("genero")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="estadoCivil">Estado civil</label>
                          <Dropdown
                            id="estadoCivil"
                            value={form.estadoCivil}
                            options={estadosCiviles}
                            onChange={(e) =>
                              handleDropdownChange("estadoCivil", e.value)
                            }
                            placeholder="Seleccione estado civil"
                            required
                            className={`w-full mb-1 ${invalidClass(
                              "estadoCivil"
                            )}`}
                          />
                          {errorMsg("estadoCivil")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="nacionalidad">Nacionalidad</label>
                          <InputText
                            id="nacionalidad"
                            name="nacionalidad"
                            type="text"
                            value={form.nacionalidad || ""}
                            disabled={nacionalidadLocked}
                            className={`w-full mb-1 ${invalidClass(
                              "nacionalidad"
                            )}`}
                            onChange={(e) =>
                              (setNacionalidadAuto(false), handleChange({
                                target: {
                                  name: "nacionalidad",
                                  value: e.target.value.replace(
                                    /[^a-zA-ZÁÉÍÓÚáéíóúÑñÜü'\-\s]/g,
                                    ""
                                  ),
                                },
                              }))
                            }
                            placeholder="Ej: Venezolano"
                          />
                          {errorMsg("nacionalidad")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="nivelEducativo">
                            Nivel educativo
                          </label>
                          <Dropdown
                            id="nivelEducativo"
                            value={form.nivelEducativo}
                            options={nivelesEducativos}
                            onChange={(e) =>
                              handleDropdownChange("nivelEducativo", e.value)
                            }
                            placeholder="Seleccione nivel educativo"
                            required
                            className={`w-full mb-1 ${invalidClass(
                              "nivelEducativo"
                            )}`}
                          />
                          {errorMsg("nivelEducativo")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="transportePersonal">
                            ¿Cuenta con algún medio de transporte propio?
                          </label>
                          <MultiSelect
                            id="transportePersonal"
                            name="transportePersonal"
                            value={form.transportePersonal}
                            options={opcionesTransporte}
                            onChange={(e) =>
                              handleDropdownChange(
                                "transportePersonal",
                                e.value
                              )
                            }
                            placeholder="Seleccione medio(s) de transporte"
                            className="w-full mb-3"
                            display="chip"
                            required
                          />
                        </div>

                        {/* Mostrar campos de placa y modelo solo si selecciona carro o motocicleta */}
                        {(form.transportePersonal.includes("carro") ||
                          form.transportePersonal.includes("motocicleta")) && (
                          <div className={`field ${classForm}`}>
                            <label htmlFor="placa">
                              Por favor indique placa y modelo (separado por
                              comas)
                            </label>
                            <InputText
                              id="placa"
                              name="placa"
                              type="text"
                              value={form.placa}
                              className={`w-full mb-1 ${invalidClass("placa")}`}
                              onChange={handleChange}
                              placeholder="Ej: ABC123,2025"
                            />
                            {errorMsg("placa")}
                          </div>
                        )}
                        <div className={`field ${classForm}`}>
                          <label htmlFor="gruposProteccionEspecial">
                            Pertenece a algún grupo de protección especial
                            constitucional:
                          </label>
                          <MultiSelect
                            id="gruposProteccionEspecial"
                            name="gruposProteccionEspecial"
                            value={form.gruposProteccionEspecial || []}
                            options={gruposProteccionEspecialOptions}
                            onChange={(e) =>
                              handleDropdownChange(
                                "gruposProteccionEspecial",
                                e.value
                              )
                            }
                            placeholder="Seleccione uno o varios"
                            className={`w-full mb-1 ${invalidClass(
                              "gruposProteccionEspecial"
                            )}`}
                            display="chip"
                            required
                          />
                          {errorMsg("gruposProteccionEspecial")}
                        </div>

                        {form.gruposProteccionEspecial?.includes("otro") && (
                          <div className={`field ${classForm}`}>
                            <label htmlFor="grupoProteccionEspecialOtro">
                              ¿Cuál?
                            </label>
                            <InputText
                              id="grupoProteccionEspecialOtro"
                              name="grupoProteccionEspecialOtro"
                              type="text"
                              value={form.grupoProteccionEspecialOtro || ""}
                              className={`w-full mb-1 ${invalidClass(
                                "grupoProteccionEspecialOtro"
                              )}`}
                              onChange={handleChange}
                              placeholder="Describa el grupo"
                            />
                            {errorMsg("grupoProteccionEspecialOtro")}
                          </div>
                        )}

                        <div
                          className={`field ${classForm} ${
                            errors.funcionarioPublico ? "p-invalid" : ""
                          }`}
                        >
                          <label
                            htmlFor="funcionarioPublicoSi"
                            title="Incluye a quienes son o han sido funcionarios públicos con poder decisorio o influencia en decisiones públicas en los últimos 2 años."
                          >
                            ¿Es usted un funcionario público o lo ha sido en los
                            dos (2) últimos años?
                          </label>
                          <div className="flex align-items-center gap-3 mt-2 justify-content-center">
                            <RadioButton
                              inputId="funcionarioPublicoSi"
                              name="funcionarioPublico"
                              value="si"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "funcionarioPublico",
                                  e.value
                                )
                              }
                              checked={form.funcionarioPublico === "si"}
                              required
                            />
                            <label
                              htmlFor="funcionarioPublicoSi"
                              className="mr-3"
                            >
                              Sí
                            </label>
                            <RadioButton
                              inputId="funcionarioPublicoNo"
                              name="funcionarioPublico"
                              value="no"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "funcionarioPublico",
                                  e.value
                                )
                              }
                              checked={form.funcionarioPublico === "no"}
                              required
                            />
                            <label htmlFor="funcionarioPublicoNo">No</label>
                          </div>
                          {errorMsg("funcionarioPublico")}
                        </div>
                        <div
                          className={`field ${classForm} ${
                            errors.administraRecursosPublicos ? "p-invalid" : ""
                          }`}
                        >
                          <label>
                            ¿Por su cargo, administra o ha administrado recursos
                            públicos en los dos (2) últimos años?
                          </label>
                          <div className="flex align-items-center gap-3 mt-2 justify-content-center">
                            <RadioButton
                              inputId="administraRecursosSi"
                              name="administraRecursosPublicos"
                              value="si"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "administraRecursosPublicos",
                                  e.value
                                )
                              }
                              checked={form.administraRecursosPublicos === "si"}
                              required
                            />
                            <label
                              htmlFor="administraRecursosSi"
                              className="mr-3"
                            >
                              Sí
                            </label>
                            <RadioButton
                              inputId="administraRecursosNo"
                              name="administraRecursosPublicos"
                              value="no"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "administraRecursosPublicos",
                                  e.value
                                )
                              }
                              checked={form.administraRecursosPublicos === "no"}
                              required
                            />
                            <label htmlFor="administraRecursosNo">No</label>
                          </div>
                          {errorMsg("administraRecursosPublicos")}
                        </div>
                        <div
                          className={`field ${classForm} ${
                            errors.familiaresPoderPublico ? "p-invalid" : ""
                          }`}
                        >
                          <label>
                            ¿Tiene familiares hasta el segundo grado de
                            consanguinidad o afinidad o primero civil que
                            ejerzan cargos de poder público?
                          </label>
                          <div className="flex align-items-center gap-3 mt-2 justify-content-center">
                            <RadioButton
                              inputId="familiaresPoderPublicoSi"
                              name="familiaresPoderPublico"
                              value="si"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "familiaresPoderPublico",
                                  e.value
                                )
                              }
                              checked={form.familiaresPoderPublico === "si"}
                              required
                            />
                            <label
                              htmlFor="familiaresPoderPublicoSi"
                              className="mr-3"
                            >
                              Sí
                            </label>
                            <RadioButton
                              inputId="familiaresPoderPublicoNo"
                              name="familiaresPoderPublico"
                              value="no"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "familiaresPoderPublico",
                                  e.value
                                )
                              }
                              checked={form.familiaresPoderPublico === "no"}
                              required
                            />
                            <label htmlFor="familiaresPoderPublicoNo">No</label>
                          </div>
                          {errorMsg("familiaresPoderPublico")}
                        </div>
                        <div
                          className={`field ${classForm} ${
                            errors.reconocimientoPublico ? "p-invalid" : ""
                          }`}
                        >
                          <label>
                            ¿Tiene o goza de reconocimiento público?
                          </label>
                          <div className="flex align-items-center gap-3 mt-2 justify-content-center">
                            <RadioButton
                              inputId="reconocimientoPublicoSi"
                              name="reconocimientoPublico"
                              value="si"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "reconocimientoPublico",
                                  e.value
                                )
                              }
                              checked={form.reconocimientoPublico === "si"}
                              required
                            />
                            <label
                              htmlFor="reconocimientoPublicoSi"
                              className="mr-3"
                            >
                              Sí
                            </label>
                            <RadioButton
                              inputId="reconocimientoPublicoNo"
                              name="reconocimientoPublico"
                              value="no"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "reconocimientoPublico",
                                  e.value
                                )
                              }
                              checked={form.reconocimientoPublico === "no"}
                              required
                            />
                            <label htmlFor="reconocimientoPublicoNo">No</label>
                          </div>
                          {errorMsg("reconocimientoPublico")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex py-4">
                  <Button
                    label="Siguiente"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    onClick={() => handleNext(0)}
                  />
                </div>
              </StepperPanel>
              <StepperPanel header="Información de contacto">
                <div
                  className={`flex flex-column ${
                    isPanelLocked(1) ? "panel-locked" : ""
                  }`}
                >
                  <div className="border-2 border-dashed surface-border border-round surface-ground flex-auto flex justify-content-center align-items-center font-medium p-3">
                    <div className="w-full">
                      <div className="formgrid grid p-fluid">
                        <div className={`field ${classForm}`}>
                          <label htmlFor="telefonoFijo">
                            Número de teléfono fijo
                          </label>
                          <InputText
                            id="telefonoFijo"
                            name="telefonoFijo"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={form.telefonoFijo || ""}
                            className={`w-full mb-1 ${invalidClass(
                              "telefonoFijo"
                            )}`}
                            onChange={(e) =>
                              handleChange({
                                target: {
                                  name: "telefonoFijo",
                                  value: sanitizePhone(e.target.value),
                                },
                              })
                            }
                            placeholder="Ejemplo: 77777777"
                            maxLength={10}
                            minLength={7}
                            required
                            onBlur={validateTelefonoFijo}
                          />
                          {errorMsg("telefonoFijo")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="celular">Número de celular</label>
                          <InputText
                            id="celular"
                            name="celular"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={form.celular || ""}
                            className={`w-full mb-1 ${invalidClass("celular")}`}
                            onChange={(e) =>
                              handleChange({
                                target: {
                                  name: "celular",
                                  value: sanitizePhone(e.target.value),
                                },
                              })
                            }
                            maxLength={10}
                            minLength={10}
                            required
                          />
                          {errorMsg("celular")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="email">
                            Correo electrónico personal
                          </label>
                          <InputText
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            className={`w-full mb-1 ${invalidClass("email")}`}
                            onChange={handleChange}
                            onFocus={handleEmailFocus}
                            onBlur={handleEmailBlur}
                            required
                          />
                          {errorMsg("email")}
                          {emailSuggestion && (
                            <div className="mt-1" style={{ textAlign: "left" }}>
                              <small>
                                ¿Quisiste decir{" "}
                                <button
                                  type="button"
                                  className="p-button p-button-link p-0"
                                  onClick={applyEmailSuggestion}
                                  style={{ cursor: "pointer" }}
                                >
                                  {emailSuggestion}
                                </button>{" "}
                                ?
                              </small>
                              <div className="mt-1 flex gap-2">
                                <Button
                                  label="Usar sugerencia"
                                  size="small"
                                  text
                                  icon="pi pi-check"
                                  onClick={applyEmailSuggestion}
                                />
                                <Button
                                  label="Ignorar"
                                  size="small"
                                  text
                                  severity="secondary"
                                  icon="pi pi-times"
                                  onClick={dismissEmailSuggestion}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="ciudadResidencia">
                            Ciudad de residencia
                          </label>
                          <Dropdown
                            id="ciudadResidencia"
                            value={form.ciudadResidencia}
                            options={ciudadesOptions}
                            onChange={(e) =>
                              handleDropdownChange("ciudadResidencia", e.value)
                            }
                            placeholder="Seleccione ciudad"
                            required
                            filter
                            showClear
                            className={`w-full mb-1 ${invalidClass(
                              "ciudadResidencia"
                            )}`}
                          />
                          {errorMsg("ciudadResidencia")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="direccionResidencia">
                            Dirección de residencia
                          </label>
                          <div className="p-inputgroup">
                            <InputText
                              id="direccionResidencia"
                              name="direccionResidencia"
                              required
                              type="text"
                              value={form.direccionResidencia}
                              className={`w-full ${invalidClass(
                                "direccionResidencia"
                              )}`}
                              readOnly
                              aria-label="Dirección de residencia"
                            />
                            <Button
                              type="button"
                              icon="pi pi-pencil"
                              className="p-button-info p-button-icon-only"
                              onClick={openAddressDialog}
                              tooltip="Editar dirección"
                              tooltipOptions={{ position: "top" }}
                              aria-label="Editar dirección"
                            />
                          </div>
                          {errorMsg("direccionResidencia")}
                        </div>
                        <Dialog
                          header="Diligenciar dirección (Colombia)"
                          visible={showAddressDialog}
                          onHide={closeAddressDialog}
                          style={{ width: "650px", maxWidth: "95vw" }}
                          modal
                        >
                          <div className="formgrid grid p-fluid">
                            <div className="field col-12 md:col-4">
                              <label>Tipo de vía</label>
                              <PRDropdown
                                value={addressDraft.via}
                                options={colombiaVias}
                                onChange={(e) => onAddrChange({ via: e.value })}
                                placeholder="Seleccione"
                                filter
                                showClear
                                className={addressErrors.via ? "p-invalid" : ""}
                              />
                              {addressErrors.via && (
                                <small className="p-error">
                                  {addressErrors.via}
                                </small>
                              )}
                            </div>
                            <div className="field col-6 md:col-4">
                              <label>Número</label>
                              <InputText
                                value={addressDraft.numero1}
                                onChange={(e) =>
                                  onAddrChange({
                                    numero1: e.target.value.replace(/\D/g, ""),
                                  })
                                }
                                className={
                                  addressErrors.numero1 ? "p-invalid" : ""
                                }
                              />
                              {addressErrors.numero1 && (
                                <small className="p-error">
                                  {addressErrors.numero1}
                                </small>
                              )}
                            </div>
                            <div className="field col-6 md:col-4">
                              <label>Letra</label>
                              <PRDropdown
                                value={addressDraft.letra1}
                                options={letras}
                                onChange={(e) =>
                                  onAddrChange({ letra1: e.value })
                                }
                                placeholder="(opcional)"
                              />
                            </div>

                            <div className="field col-6 md:col-3">
                              <label>BIS</label>
                              <div className="flex align-items-center gap-2">
                                <input
                                  id="addr_bis"
                                  type="checkbox"
                                  checked={addressDraft.bis}
                                  onChange={(e) =>
                                    onAddrChange({ bis: e.target.checked })
                                  }
                                />
                                <label htmlFor="addr_bis" className="m-0">
                                  Sí
                                </label>
                              </div>
                            </div>
                            <div className="field col-6 md:col-3">
                              <label>Cuadrante</label>
                              <PRDropdown
                                value={addressDraft.cuadrante1}
                                options={cuadrantes}
                                onChange={(e) =>
                                  onAddrChange({ cuadrante1: e.value })
                                }
                                placeholder="(opcional)"
                              />
                            </div>
                            <div className="field col-6 md:col-3">
                              <label>Nº (después de #)</label>
                              <InputText
                                value={addressDraft.numero2}
                                onChange={(e) =>
                                  onAddrChange({
                                    numero2: e.target.value.replace(/\D/g, ""),
                                  })
                                }
                                className={
                                  addressErrors.numero2 ? "p-invalid" : ""
                                }
                              />
                              {addressErrors.numero2 && (
                                <small className="p-error">
                                  {addressErrors.numero2}
                                </small>
                              )}
                            </div>
                            <div className="field col-6 md:col-3">
                              <label>Letra</label>
                              <PRDropdown
                                value={addressDraft.letra2}
                                options={letras}
                                onChange={(e) =>
                                  onAddrChange({ letra2: e.value })
                                }
                                placeholder="(opcional)"
                              />
                            </div>
                            <div className="field col-6 md:col-3">
                              <label>Cuadrante</label>
                              <PRDropdown
                                value={addressDraft.cuadrante2}
                                options={cuadrantes}
                                onChange={(e) =>
                                  onAddrChange({ cuadrante2: e.value })
                                }
                                placeholder="(opcional)"
                              />
                            </div>
                            <div className="field col-6 md:col-3">
                              <label>Nº (después de -)</label>
                              <InputText
                                value={addressDraft.numero3}
                                onChange={(e) =>
                                  onAddrChange({
                                    numero3: e.target.value.replace(/\D/g, ""),
                                  })
                                }
                                className={
                                  addressErrors.numero3 ? "p-invalid" : ""
                                }
                              />
                              {addressErrors.numero3 && (
                                <small className="p-error">
                                  {addressErrors.numero3}
                                </small>
                              )}
                            </div>
                            <div className="field col-12">
                              <label>Complemento</label>
                              <InputText
                                value={addressDraft.complemento}
                                onChange={(e) =>
                                  onAddrChange({ complemento: e.target.value })
                                }
                                placeholder="Apto, interior, piso, etc. (opcional)"
                              />
                            </div>
                          </div>
                          {/* Vista previa de la dirección compuesta */}
                          <div className="col-12">
                            <label>Vista previa de la dirección</label>
                            <Message
                              severity="info"
                              className="w-full block"
                              text={composeAddress(addressDraft) || "(sin datos)"}
                            />
                            <small className="text-color-secondary">
                              Así se guardará la dirección cuando confirmes.
                            </small>
                          </div>
                          <div className="flex justify-content-end gap-2 mt-3">
                            <Button
                              label="Cancelar"
                              text
                              onClick={closeAddressDialog}
                            />
                            <Button
                              label="Usar dirección"
                              icon="pi pi-check"
                              onClick={acceptAddress}
                            />
                          </div>
                        </Dialog>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="barrio">Barrio</label>
                          <InputText
                            id="barrio"
                            name="barrio"
                            required
                            type="text"
                            value={form.barrio}
                            className={`w-full mb-1 ${invalidClass("barrio")}`}
                            onChange={handleChange}
                          />
                          {errorMsg("barrio")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="tipoVivienda">Tipo de vivienda</label>
                          <Dropdown
                            id="tiposVivienda"
                            value={form.tiposVivienda}
                            options={tiposVivienda}
                            onChange={(e) =>
                              handleDropdownChange("tiposVivienda", e.value)
                            }
                            placeholder="Seleccione tipo"
                            required
                            className={`w-full mb-1 ${invalidClass(
                              "tiposVivienda"
                            )}`}
                          />
                          {errorMsg("tiposVivienda")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="condicionVivienda">
                            Condición actual de la vivienda
                          </label>
                          <Dropdown
                            id="condicionVivienda"
                            value={form.condicionVivienda}
                            options={tiposCondicionVivienda}
                            onChange={(e) =>
                              handleDropdownChange("condicionVivienda", e.value)
                            }
                            placeholder="Seleccione tipo"
                            required
                            className={`w-full mb-1 ${invalidClass(
                              "condicionVivienda"
                            )}`}
                          />
                          {errorMsg("condicionVivienda")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex py-4 gap-2">
                  <Button
                    label="Volver"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    onClick={() => stepperRef.current.prevCallback()}
                  />
                  <Button
                    label="Siguiente"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    onClick={() => handleNext(1)}
                  />
                </div>
              </StepperPanel>

              <StepperPanel header="Información laboral">
                <div
                  className={`flex flex-column ${
                    isPanelLocked(3) ? "panel-locked" : ""
                  }`}
                >
                  <div className="border-2 border-dashed surface-border border-round surface-ground flex-auto flex justify-content-center align-items-center font-medium p-3">
                    <div className="w-full">
                      <div className="formgrid grid p-fluid">
                        {create && (
                          <div className={`field ${classForm}`}>
                            <label htmlFor="empresaPatronal">
                              Empresa patronal donde labora
                            </label>
                            <Dropdown
                              id="empresaPatronal"
                              value={form.empresaPatronal}
                              options={empresasPatronal}
                              onChange={(e) =>
                                handleDropdownChange("empresaPatronal", e.value)
                              }
                              placeholder="Seleccione empresa"
                              required
                              className={`w-full mb-1 ${invalidClass(
                                "empresaPatronal"
                              )}`}
                              showClear
                              filter
                            />
                            {errorMsg("empresaPatronal")}
                          </div>
                        )}

                        <div className={`field ${classForm}`}>
                          <label htmlFor="cargo">Cargo</label>
                          <InputText
                            id="cargo"
                            name="cargo"
                            type="text"
                            value={form.cargo}
                            className={`w-full mb-1 ${invalidClass("cargo")}`}
                            onChange={handleChange}
                            placeholder="Ingrese su cargo"
                            required
                          />
                          {errorMsg("cargo")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="profesion">Profesión</label>
                          <InputText
                            id="profesion"
                            name="profesion"
                            type="text"
                            value={form.profesion || ""}
                            className={`w-full mb-1 ${invalidClass(
                              "profesion"
                            )}`}
                            onChange={handleChange}
                            placeholder="Ingrese su profesión"
                            required
                          />
                          {errorMsg("profesion")}
                        </div>

                        {/* Linea 1153: Tipo de contrato */}
                        <div
                          className={`field ${classForm} ${
                            errors.tipoContrato ? "p-invalid" : ""
                          }`}
                        >
                          <label>Tipo de contrato</label>
                          <div className="flex align-items-center gap-3 mt-2 justify-content-center">
                            <RadioButton
                              inputId="contratoIndefinido"
                              name="tipoContrato"
                              value="indefinido"
                              onChange={(e) =>
                                handleDropdownChange("tipoContrato", e.value)
                              }
                              checked={form.tipoContrato === "indefinido"}
                              required
                            />
                            <label
                              htmlFor="contratoIndefinido"
                              className="mr-3"
                            >
                              Indefinido
                            </label>
                            <RadioButton
                              inputId="contratoFijo"
                              name="tipoContrato"
                              value="fijo"
                              onChange={(e) =>
                                handleDropdownChange("tipoContrato", e.value)
                              }
                              checked={form.tipoContrato === "fijo"}
                              required
                            />
                            <label htmlFor="contratoFijo">Fijo</label>
                          </div>
                          {errorMsg("tipoContrato")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="fechaInicioIngreso">
                            Fecha de ingreso a la empresa
                          </label>
                          <Calendar
                            id="fechaInicioIngreso"
                            name="fechaInicioIngreso"
                            value={form.fechaInicioIngreso}
                            onChange={handleChange}
                            className={`w-full mb-1 ${invalidClass(
                              "fechaInicioIngreso"
                            )}`}
                            dateFormat="dd/mm/yy"
                            showIcon
                            placeholder="dd/mm/yyyy"
                            maxDate={new Date()}
                          />
                          {errorMsg("fechaInicioIngreso")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="salarioMensual">
                            Salario mensual
                          </label>
                          <InputText
                            id="salarioMensual"
                            name="salarioMensual"
                            type="text"
                            value={
                              form.salarioMensual
                                ? form.salarioMensual
                                    .toString()
                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                : ""
                            }
                            className={`w-full mb-1 ${invalidClass(
                              "salarioMensual"
                            )}`}
                            onChange={(e) => {
                              const raw = e.target.value
                                .replace(/,/g, "")
                                .replace(/[^\d]/g, "");
                              handleChange({
                                target: { name: "salarioMensual", value: raw },
                              });
                            }}
                            placeholder="Ej: 1,423,500 (mínimo)"
                            required
                          />
                          {errorMsg("salarioMensual")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="otrosIngresos">Otros ingresos</label>
                          <InputText
                            id="otrosIngresos"
                            name="otrosIngresos"
                            type="text"
                            value={
                              form.otrosIngresos
                                ? form.otrosIngresos
                                    .toString()
                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                : ""
                            }
                            className="w-full mb-3"
                            onChange={(e) => {
                              const raw = e.target.value
                                .replace(/,/g, "")
                                .replace(/[^\d]/g, "");
                              handleChange({
                                target: { name: "otrosIngresos", value: raw },
                              });
                            }}
                            placeholder="Ej: 500,000"
                          />
                        </div>

                        {form.otrosIngresos &&
                          parseInt(form.otrosIngresos) > 0 && (
                            <div className={`field ${classForm}`}>
                              <label htmlFor="origenOtrosIngresos">
                                Indique el origen de los otros ingresos
                              </label>
                              <InputTextarea
                                id="origenOtrosIngresos"
                                name="origenOtrosIngresos"
                                type="text"
                                value={form.origenOtrosIngresos}
                                className={`w-full mb-1 ${invalidClass(
                                  "origenOtrosIngresos"
                                )}`}
                                autoResize
                                rows={3}
                                onChange={handleChange}
                                placeholder="Describa brevemente los conceptos, por ejemplo: ventas de fin de semana, arriendos, clases particulares, etc."
                              />
                              {errorMsg("origenOtrosIngresos")}
                            </div>
                          )}
                        <div className={`field ${classForm}`}>
                          <label htmlFor="egresos">
                            Egresos o gastos mensuales
                          </label>
                          <InputText
                            id="egresos"
                            name="egresos"
                            type="text"
                            value={
                              form.egresos
                                ? form.egresos
                                    .toString()
                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                : ""
                            }
                            className={`w-full mb-1 ${invalidClass("egresos")}`}
                            onChange={(e) => {
                              const raw = e.target.value
                                .replace(/,/g, "")
                                .replace(/[^\d]/g, "");
                              handleChange({
                                target: { name: "egresos", value: raw },
                              });
                            }}
                            placeholder="Ej: 900,000"
                            required
                          />
                          {errorMsg("egresos")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="totalActivos">
                            Total activos: (Casa, apto, lote, carro, moto,
                            inversión, etc)
                          </label>
                          <InputText
                            id="totalActivos"
                            name="totalActivos"
                            type="text"
                            value={
                              form.totalActivos
                                ? form.totalActivos
                                    .toString()
                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                : ""
                            }
                            className={`w-full mb-1 ${invalidClass(
                              "totalActivos"
                            )}`}
                            onChange={(e) => {
                              const raw = e.target.value
                                .replace(/,/g, "")
                                .replace(/[^\d]/g, "");
                              handleChange({
                                target: { name: "totalActivos", value: raw },
                              });
                            }}
                            placeholder="Ej: 10,000,000"
                            required
                          />
                          {errorMsg("totalActivos")}
                        </div>
                        <div className={`field ${classForm}`}>
                          <label htmlFor="totalPasivos">
                            Total pasivos: (Crédito, tarjeta de credito,
                            hipoteca, etc)
                          </label>
                          <InputText
                            id="totalPasivos"
                            name="totalPasivos"
                            type="text"
                            value={
                              form.totalPasivos
                                ? form.totalPasivos
                                    .toString()
                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                : ""
                            }
                            className={`w-full mb-1 ${invalidClass(
                              "totalPasivos"
                            )}`}
                            onChange={(e) => {
                              const raw = e.target.value
                                .replace(/,/g, "")
                                .replace(/[^\d]/g, "");
                              handleChange({
                                target: { name: "totalPasivos", value: raw },
                              });
                            }}
                            placeholder="Ej: 8,000,000"
                            required
                          />
                          {errorMsg("totalPasivos")}
                        </div>

                        <div
                          className={`field ${classForm} ${
                            errors.operaMonedaExtranjera ? "p-invalid" : ""
                          }`}
                        >
                          <label>
                            ¿Realiza Operaciones en moneda extranjera?
                          </label>
                          <div className="flex align-items-center gap-3 mt-2 justify-content-center">
                            <RadioButton
                              inputId="operaMonedaExtranjeraSi"
                              name="operaMonedaExtranjera"
                              value="si"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "operaMonedaExtranjera",
                                  e.value
                                )
                              }
                              checked={form.operaMonedaExtranjera === "si"}
                              required
                            />
                            <label
                              htmlFor="operaMonedaExtranjeraSi"
                              className="mr-3"
                            >
                              Sí
                            </label>
                            <RadioButton
                              inputId="operaMonedaExtranjeraNo"
                              name="operaMonedaExtranjera"
                              value="no"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "operaMonedaExtranjera",
                                  e.value
                                )
                              }
                              checked={form.operaMonedaExtranjera === "no"}
                              required
                            />
                            <label htmlFor="operaMonedaExtranjeraNo">No</label>
                          </div>
                          {errorMsg("operaMonedaExtranjera")}
                        </div>
                        {form.operaMonedaExtranjera === "si" && (
                          <div className={`field ${classForm}`}>
                            <label htmlFor="tipoOperacion">
                              TIPO DE OPERACIÓN
                            </label>
                            <MultiSelect
                              id="tipoOperacion"
                              name="tipoOperacion"
                              value={form.tipoOperacion || []}
                              options={[
                                { label: "Importación", value: "importacion" },
                                { label: "Exportación", value: "exportacion" },
                                { label: "Inversión", value: "inversion" },
                                { label: "Otra", value: "otra" },
                              ]}
                              onChange={(e) =>
                                handleDropdownChange("tipoOperacion", e.value)
                              }
                              placeholder="Seleccione uno o varios"
                              className={`w-full mb-1 ${invalidClass(
                                "tipoOperacion"
                              )}`}
                              display="chip"
                              required
                            />
                            {errorMsg("tipoOperacion")}
                          </div>
                        )}
                        {form.operaMonedaExtranjera === "si" &&
                          form.tipoOperacion?.includes("otra") && (
                            <div className={`field ${classForm}`}>
                              <label htmlFor="tipoOperacionOtra">
                                ¿Cuál otra?
                              </label>
                              <InputText
                                id="tipoOperacionOtra"
                                name="tipoOperacionOtra"
                                type="text"
                                value={form.tipoOperacionOtra || ""}
                                className={`w-full mb-1 ${invalidClass(
                                  "tipoOperacionOtra"
                                )}`}
                                onChange={handleChange}
                                placeholder="Especifique la operación"
                              />
                              {errorMsg("tipoOperacionOtra")}
                            </div>
                          )}
                        {form.operaMonedaExtranjera === "si" && (
                          <div className={`field ${classForm}`}>
                            <label htmlFor="ciudadOperacion">Ciudad</label>
                            <InputText
                              id="ciudadOperacion"
                              name="ciudadOperacion"
                              type="text"
                              value={form.ciudadOperacion || ""}
                              className={`w-full mb-1 ${invalidClass(
                                "ciudadOperacion"
                              )}`}
                              onChange={handleChange}
                              placeholder="Ingrese la ciudad"
                            />
                            {errorMsg("ciudadOperacion")}
                          </div>
                        )}
                        {form.operaMonedaExtranjera === "si" && (
                          <div className={`field ${classForm}`}>
                            <label htmlFor="paisOperacion">País</label>
                            <InputText
                              id="paisOperacion"
                              name="paisOperacion"
                              type="text"
                              value={form.paisOperacion || ""}
                              className={`w-full mb-1 ${invalidClass(
                                "paisOperacion"
                              )}`}
                              onChange={handleChange}
                              placeholder="Ingrese el país"
                            />
                            {errorMsg("paisOperacion")}
                          </div>
                        )}
                        <div
                          className={`field ${classForm} ${
                            errors.poseeCuentasExterior ? "p-invalid" : ""
                          }`}
                        >
                          <label>
                            ¿Posee cuentas en el exterior o en moneda
                            extranjera?
                          </label>
                          <div className="flex align-items-center gap-3 mt-2 justify-content-center">
                            <RadioButton
                              inputId="poseeCuentasExteriorSi"
                              name="poseeCuentasExterior"
                              value="si"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "poseeCuentasExterior",
                                  e.value
                                )
                              }
                              checked={form.poseeCuentasExterior === "si"}
                              required
                            />
                            <label
                              htmlFor="poseeCuentasExteriorSi"
                              className="mr-3"
                            >
                              Sí
                            </label>
                            <RadioButton
                              inputId="poseeCuentasExteriorNo"
                              name="poseeCuentasExterior"
                              value="no"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "poseeCuentasExterior",
                                  e.value
                                )
                              }
                              checked={form.poseeCuentasExterior === "no"}
                              required
                            />
                            <label htmlFor="poseeCuentasExteriorNo">No</label>
                          </div>
                          {errorMsg("poseeCuentasExterior")}
                        </div>

                        {form.poseeCuentasExterior === "si" && (
                          <>
                            <div className={`field ${classForm}`}>
                              <label htmlFor="cuentaExteriorMoneda">
                                Moneda
                              </label>
                              <InputText
                                id="cuentaExteriorMoneda"
                                name="cuentaExteriorMoneda"
                                type="text"
                                value={form.cuentaExteriorMoneda || ""}
                                className={`w-full mb-1 ${invalidClass(
                                  "cuentaExteriorMoneda"
                                )}`}
                                onChange={handleChange}
                                placeholder="Ej: USD, EUR"
                              />
                              {errorMsg("cuentaExteriorMoneda")}
                            </div>
                            <div className={`field ${classForm}`}>
                              <label htmlFor="cuentaExteriorBanco">Banco</label>
                              <InputText
                                id="cuentaExteriorBanco"
                                name="cuentaExteriorBanco"
                                type="text"
                                value={form.cuentaExteriorBanco || ""}
                                className={`w-full mb-1 ${invalidClass(
                                  "cuentaExteriorBanco"
                                )}`}
                                onChange={handleChange}
                                placeholder="Nombre del banco"
                              />
                              {errorMsg("cuentaExteriorBanco")}
                            </div>
                            <div className={`field ${classForm}`}>
                              <label htmlFor="cuentaExteriorCuenta">
                                Número de Cuenta
                              </label>
                              <InputText
                                id="cuentaExteriorCuenta"
                                name="cuentaExteriorCuenta"
                                type="text"
                                value={form.cuentaExteriorCuenta || ""}
                                className={`w-full mb-1 ${invalidClass(
                                  "cuentaExteriorCuenta"
                                )}`}
                                onChange={handleChange}
                                placeholder="Número o tipo de cuenta"
                              />
                              {errorMsg("cuentaExteriorCuenta")}
                            </div>
                            <div className={`field ${classForm}`}>
                              <label htmlFor="cuentaExteriorCiudad">
                                Ciudad
                              </label>
                              <InputText
                                id="cuentaExteriorCiudad"
                                name="cuentaExteriorCiudad"
                                type="text"
                                value={form.cuentaExteriorCiudad || ""}
                                className={`w-full mb-1 ${invalidClass(
                                  "cuentaExteriorCiudad"
                                )}`}
                                onChange={handleChange}
                                placeholder="Ciudad donde está la cuenta"
                              />
                              {errorMsg("cuentaExteriorCiudad")}
                            </div>
                            <div className={`field ${classForm}`}>
                              <label htmlFor="cuentaExteriorPais">País</label>
                              <InputText
                                id="cuentaExteriorPais"
                                name="cuentaExteriorPais"
                                type="text"
                                value={form.cuentaExteriorPais || ""}
                                className={`w-full mb-1 ${invalidClass(
                                  "cuentaExteriorPais"
                                )}`}
                                onChange={handleChange}
                                placeholder="País donde está la cuenta"
                              />
                              {errorMsg("cuentaExteriorPais")}
                            </div>
                          </>
                        )}
                        {/* Operaciones con activos o monedas virtuales */}
                        <div
                          className={`field ${classForm} ${
                            errors.operaActivosVirtuales ? "p-invalid" : ""
                          }`}
                        >
                          <label>
                            ¿Realiza Operaciones con Activos o monedas
                            Virtuales?
                          </label>
                          <div className="flex align-items-center gap-3 mt-2 justify-content-center">
                            <RadioButton
                              inputId="operaActivosVirtualesSi"
                              name="operaActivosVirtuales"
                              value="si"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "operaActivosVirtuales",
                                  e.value
                                )
                              }
                              checked={form.operaActivosVirtuales === "si"}
                              required
                            />
                            <label
                              htmlFor="operaActivosVirtualesSi"
                              className="mr-3"
                            >
                              Sí
                            </label>
                            <RadioButton
                              inputId="operaActivosVirtualesNo"
                              name="operaActivosVirtuales"
                              value="no"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "operaActivosVirtuales",
                                  e.value
                                )
                              }
                              checked={form.operaActivosVirtuales === "no"}
                              required
                            />
                            <label htmlFor="operaActivosVirtualesNo">No</label>
                          </div>
                          {errorMsg("operaActivosVirtuales")}
                        </div>

                        {form.operaActivosVirtuales === "si" && (
                          <div className={`field ${classForm}`}>
                            <label htmlFor="activosVirtualesCuales">
                              ¿Cuáles?
                            </label>
                            <InputText
                              id="activosVirtualesCuales"
                              name="activosVirtualesCuales"
                              type="text"
                              value={form.activosVirtualesCuales || ""}
                              className={`w-full mb-1 ${invalidClass(
                                "activosVirtualesCuales"
                              )}`}
                              onChange={handleChange}
                              placeholder="Especifique (p. ej., BTC, ETH, USDT, etc.)"
                            />
                            {errorMsg("activosVirtualesCuales")}
                          </div>
                        )}
                        {create && (
                          <div className={`field ${classForm}`}>
                            <label htmlFor="numCuotasFonvida">
                              Número de cuotas aporte FONVIDA:
                            </label>
                            <InputText
                              id="numCuotasFonvida"
                              name="numCuotasFonvida"
                              type="number"
                              value={form.numCuotasFonvida ?? ""}
                              className={`w-full mb-1 ${invalidClass(
                                "numCuotasFonvida"
                              )}`}
                              onChange={(e) => {
                                let v = e.target.value;
                                // permitir vacío para borrar, si no, limitar entre 0 y 24
                                if (v === "") {
                                  handleChange({
                                    target: {
                                      name: "numCuotasFonvida",
                                      value: "",
                                    },
                                  });
                                  return;
                                }
                                let n = parseInt(v, 10);
                                if (isNaN(n)) n = 0;
                                if (n < 0) n = 0;
                                if (n > 24) n = 24;
                                handleChange({
                                  target: {
                                    name: "numCuotasFonvida",
                                    value: n,
                                  },
                                });
                              }}
                              min={0}
                              max={24}
                              placeholder="Máximo 24 Quincenas"
                            />
                            {errorMsg("numCuotasFonvida")}
                          </div>
                        )}
                        {create && (
                          <div
                            className={`field ${classForm} ${
                              errors.deseaAhorroAdicional ? "p-invalid" : ""
                            }`}
                          >
                            <label>
                              ¿Desea realizar ahorro adicional al ahorro
                              permanente?
                            </label>
                            <div className="flex align-items-center gap-3 mt-2 justify-content-center">
                              <RadioButton
                                inputId="deseaAhorroAdicionalSi"
                                name="deseaAhorroAdicional"
                                value="si"
                                onChange={(e) =>
                                  handleDropdownChange(
                                    "deseaAhorroAdicional",
                                    e.value
                                  )
                                }
                                checked={form.deseaAhorroAdicional === "si"}
                                required
                              />
                              <label
                                htmlFor="deseaAhorroAdicionalSi"
                                className="mr-3"
                              >
                                Sí
                              </label>
                              <RadioButton
                                inputId="deseaAhorroAdicionalNo"
                                name="deseaAhorroAdicional"
                                value="no"
                                onChange={(e) =>
                                  handleDropdownChange(
                                    "deseaAhorroAdicional",
                                    e.value
                                  )
                                }
                                checked={form.deseaAhorroAdicional === "no"}
                                required
                              />
                              <label htmlFor="deseaAhorroAdicionalNo">No</label>
                            </div>
                            {errorMsg("deseaAhorroAdicional")}
                          </div>
                        )}

                        {create && form.deseaAhorroAdicional === "si" && (
                          <div className={`field ${classForm}`}>
                            <label htmlFor="ahorroAdicionalMensual">
                              Ahorro Adicional Mensual
                            </label>
                            <InputText
                              id="ahorroAdicionalMensual"
                              name="ahorroAdicionalMensual"
                              type="text"
                              value={
                                form.ahorroAdicionalMensual
                                  ? form.ahorroAdicionalMensual
                                      .toString()
                                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                  : ""
                              }
                              className={`w-full mb-1 ${invalidClass(
                                "ahorroAdicionalMensual"
                              )}`}
                              onChange={(e) => {
                                const raw = e.target.value
                                  .replace(/,/g, "")
                                  .replace(/[^\d]/g, "");
                                handleChange({
                                  target: {
                                    name: "ahorroAdicionalMensual",
                                    value: raw,
                                  },
                                });
                              }}
                              placeholder="Ej: 150,000"
                            />
                            {errorMsg("ahorroAdicionalMensual")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex py-4 gap-2">
                  <Button
                    label="Volver"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    onClick={() => stepperRef.current.prevCallback()}
                  />
                  <Button
                    label="Siguiente"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    onClick={() => handleNext(3)}
                  />
                </div>
              </StepperPanel>
              <StepperPanel header="Información de Referencias familiares">
                <div
                  className={`flex flex-column ${
                    isPanelLocked(4) ? "panel-locked" : ""
                  }`}
                >
                  <div className="border-2 border-dashed surface-border border-round surface-ground flex-auto flex justify-content-center align-items-center font-medium p-3">
                    <div className="w-full">
                      <div className="formgrid grid p-fluid">
                        {/* Tabla dinámica de beneficiarios */}
                        <div className="col-12 compact-form">
                          <div className="flex align-items-center justify-content-between mb-2">
                            <h3 className="mr-5" style={{ fontSize: "1rem" }}>
                              Referencias familiares
                            </h3>
                            <Button
                              icon="pi pi-plus"
                              size="small"
                              className="ml-5"
                              rounded
                              aria-label="Agregar"
                              title="Agregar"
                              style={{ width: "7rem" }}
                              onClick={addBeneficiario}
                            >
                              &nbsp;Agregar
                            </Button>
                          </div>
                          <div className="responsive-table-wrapper pb-3">
                            <table
                              className="p-datatable p-component w-full beneficiarios-table text-sm"
                              style={{
                                borderCollapse: "collapse",
                              }}
                            >
                              <thead>
                                <tr>
                                  <th>Nombres</th>
                                  <th>Parentesco</th>
                                  <th>Fecha de nacimiento</th>
                                  <th>Tipo</th>
                                  <th>#Documento</th>
                                  <th>
                                    <span
                                      className="flex align-items-center gap-2"
                                      onClick={(e) =>
                                        pepHelpRef.current?.toggle?.(e)
                                      }
                                      aria-label="Ayuda"
                                      title="Ver ayuda"
                                    >
                                      Es PEP
                                      <i
                                        className="pi pi-question-circle "
                                        style={{
                                          cursor: "pointer",
                                          color: "#1370f3ff",
                                        }}
                                      />
                                      <OverlayPanel
                                        ref={pepHelpRef}
                                        showCloseIcon
                                      >
                                        <div
                                          style={{
                                            maxWidth: 260,
                                            lineHeight: 1.4,
                                          }}
                                        >
                                          Eres o has sido funcionario público
                                          con poder decisorio o administra recursos públicos?
                                        </div>
                                      </OverlayPanel>
                                    </span>
                                  </th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {(form.beneficiarios || []).length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={7}
                                      style={{
                                        textAlign: "center",
                                        padding: "0.75rem",
                                        color: "#666",
                                      }}
                                    >
                                      No hay referencias familiares agregadas
                                    </td>
                                  </tr>
                                ) : (
                                  (form.beneficiarios || []).map((row, idx) => (
                                    <tr key={idx}>
                                      <td style={{ padding: "0.5rem" }}>
                                        <InputText
                                          value={row.nombres || ""}
                                          onChange={(e) =>
                                            updateBeneficiarioField(
                                              idx,
                                              "nombres",
                                              e.target.value.replace(
                                                /[^a-zA-ZÁÉÍÓÚáéíóúÑñÜü'\-\s]/g,
                                                ""
                                              )
                                            )
                                          }
                                          placeholder="Nombres y apellidos"
                                          className="w-full"
                                        />
                                      </td>
                                      <td style={{ padding: "0.5rem" }}>
                                        <Dropdown
                                          value={row.parentesco || null}
                                          options={parentescosBeneficiario}
                                          onChange={(e) =>
                                            updateBeneficiarioField(
                                              idx,
                                              "parentesco",
                                              e.value
                                            )
                                          }
                                          placeholder="Seleccione parentesco"
                                          className="w-full"
                                          showClear
                                        />
                                      </td>
                                      <td
                                        style={{
                                          padding: "0.5rem",
                                          minWidth: "200px",
                                        }}
                                      >
                                        <Calendar
                                          value={toLocalDate(
                                            row.fechaNacimiento
                                          )}
                                          onChange={(e) =>
                                            updateBeneficiarioField(
                                              idx,
                                              "fechaNacimiento",
                                              e.value
                                            )
                                          }
                                          dateFormat="dd/mm/yy"
                                          showIcon
                                          maxDate={new Date()}
                                          placeholder="dd/mm/aaaa"
                                          className="w-full"
                                        />
                                      </td>
                                      <td style={{ padding: "0.5rem" }}>
                                        <Dropdown
                                          value={row.tipo || null}
                                          options={tiposIdentificacionAbreviado}
                                          onChange={(e) =>
                                            updateBeneficiarioField(
                                              idx,
                                              "tipo",
                                              e.value
                                            )
                                          }
                                          placeholder="Tipo identificación"
                                          className="w-full"
                                          showClear
                                        />
                                      </td>
                                      <td style={{ padding: "0.5rem" }}>
                                        <InputText
                                          value={row.numero || ""}
                                          onChange={(e) =>
                                            updateBeneficiarioField(
                                              idx,
                                              "numero",
                                              e.target.value.replace(/\D/g, "")
                                            )
                                          }
                                          inputMode="numeric"
                                          placeholder="Número"
                                          className="w-full"
                                        />
                                      </td>
                                      <td style={{ padding: "0.5rem" }}>
                                        <div className="flex align-items-center gap-3 justify-content-center">
                                          <RadioButton
                                            inputId={`pepSi_${idx}`}
                                            name={`pep_${idx}`}
                                            value="si"
                                            onChange={(e) =>
                                              updateBeneficiarioField(
                                                idx,
                                                "pep",
                                                e.value
                                              )
                                            }
                                            checked={row.pep === "si"}
                                          />
                                          <label
                                            htmlFor={`pepSi_${idx}`}
                                            className="mr-3 "
                                          >
                                            Sí
                                          </label>
                                          <RadioButton
                                            inputId={`pepNo_${idx}`}
                                            name={`pep_${idx}`}
                                            value="no"
                                            onChange={(e) =>
                                              updateBeneficiarioField(
                                                idx,
                                                "pep",
                                                e.value
                                              )
                                            }
                                            checked={row.pep === "no"}
                                          />
                                          <label htmlFor={`pepNo_${idx}`}>
                                            No
                                          </label>
                                        </div>
                                      </td>
                                      <td
                                        style={{
                                          padding: "0.5rem",
                                          textAlign: "center",
                                        }}
                                      >
                                        <Button
                                          icon="pi pi-trash"
                                          severity="danger"
                                          rounded
                                          text
                                          onClick={() =>
                                            removeBeneficiario(idx)
                                          }
                                          aria-label="Eliminar"
                                        />
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                            <div
                              id="beneficiariosSection"
                              className="mt-2"
                            >
                              {errors.beneficiarios && (
                                <small className="p-error">
                                  {errors.beneficiarios}
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Referencia: tipo, nombres y celular */}
                        <div className="col-12 text-left">
                          <h3 className="mr-5" style={{ fontSize: "1rem" }}>
                            Referencia personal
                          </h3>
                        </div>
                        <div className={`pl-2 field ${classForm}`} style={{ display: 'none' }}>
                          <label className="block mb-2">
                            Tipo de referencia
                          </label>
                          <div className="flex align-items-center gap-3 mt-2 justify-content-center">
                            <RadioButton
                              inputId="tipoReferenciaFamiliar"
                              name="tipoReferencia"
                              value="familiar"
                              onChange={(e) =>
                                handleDropdownChange("tipoReferencia", e.value)
                              }
                              checked={form.tipoReferencia === "familiar"}
                            />
                            <label
                              htmlFor="tipoReferenciaFamiliar"
                              className="mr-3"
                            >
                              Familiar
                            </label>
                            <RadioButton
                              inputId="tipoReferenciaPersonal"
                              name="tipoReferencia"
                              value="personal"
                              onChange={(e) =>
                                handleDropdownChange("tipoReferencia", e.value)
                              }
                              checked={form.tipoReferencia === "personal"}
                            />
                            <label htmlFor="tipoReferenciaPersonal">
                              Personal
                            </label>
                          </div>
                          {errorMsg("tipoReferencia")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="referenciaNombreApellidos">
                            Nombres y apellidos de la referencia
                          </label>
                          <InputText
                            id="referenciaNombreApellidos"
                            name="referenciaNombreApellidos"
                            type="text"
                            value={form.referenciaNombreApellidos || ""}
                            className={`w-full mb-1 ${invalidClass(
                              "referenciaNombreApellidos"
                            )}`}
                            onChange={(e) =>
                              handleChange({
                                target: {
                                  name: "referenciaNombreApellidos",
                                  value: e.target.value.replace(
                                    /[^a-zA-ZÁÉÍÓÚáéíóúÑñÜü'\-\s]/g,
                                    ""
                                  ),
                                },
                              })
                            }
                            placeholder="Ej: Juan Pérez"
                          />
                          {errorMsg("referenciaNombreApellidos")}
                        </div>

                        <div className={`field ${classForm}`}>
                          <label htmlFor="referenciaCelular">
                            Celular de la referencia
                          </label>
                          <InputText
                            id="referenciaCelular"
                            name="referenciaCelular"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={form.referenciaCelular || ""}
                            className={`w-full mb-1 ${invalidClass(
                              "referenciaCelular"
                            )}`}
                            onChange={(e) =>
                              handleChange({
                                target: {
                                  name: "referenciaCelular",
                                  value: sanitizePhone(e.target.value),
                                },
                              })
                            }
                            maxLength={10}
                            minLength={10}
                            placeholder="Número de celular"
                            required
                          />
                          {errorMsg("referenciaCelular")}
                        </div>

                        <div
                          className={`field ${classForm} ${
                            errors.actualizacionFacil ? "p-invalid" : ""
                          }`}
                        >
                          <label>
                            {create
                              ? "¿Considera que el registro fue sencillo de realizar?"
                              : "¿Considera que la actualización de datos fue un proceso simple y ágil de realizar?"}
                          </label>
                          <div className="flex align-items-center gap-3 mt-2 justify-content-center">
                            <RadioButton
                              inputId="actualizacionFacilSi"
                              name="actualizacionFacil"
                              value="si"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "actualizacionFacil",
                                  e.value
                                )
                              }
                              checked={form.actualizacionFacil === "si"}
                              required
                            />
                            <label
                              htmlFor="actualizacionFacilSi"
                              className="mr-3"
                            >
                              Sí
                            </label>
                            <RadioButton
                              inputId="actualizacionFacilNo"
                              name="actualizacionFacil"
                              value="no"
                              onChange={(e) =>
                                handleDropdownChange(
                                  "actualizacionFacil",
                                  e.value
                                )
                              }
                              checked={form.actualizacionFacil === "no"}
                              required
                            />
                            <label htmlFor="actualizacionFacilNo">No</label>
                          </div>
                          {errorMsg("actualizacionFacil")}
                        </div>

                        {form.actualizacionFacil === "no" && (
                          <div className={`field ${classForm}`}>
                            <label
                              htmlFor="actualizacionFacilPorque"
                              className="block mb-2"
                            >
                              ¿Por qué?
                            </label>
                            <InputText
                              id="actualizacionFacilPorque"
                              name="actualizacionFacilPorque"
                              type="text"
                              className={`w-full ${invalidClass(
                                "actualizacionFacilPorque"
                              )}`}
                              value={form.actualizacionFacilPorque}
                              onChange={handleChange}
                              placeholder="Explique brevemente la razón"
                            />
                            {errorMsg("actualizacionFacilPorque")}
                          </div>
                        )}
                        {create && (
                          <div className={`field ${classForm}`}>
                            <label htmlFor="soportePdf" className="block mb-2">
                              Adjuntar soporte del documento de identidad (PDF
                              máx. 20MB)
                            </label>
                            <input
                              id="soportePdf"
                              type="file"
                              accept="application/pdf,.pdf"
                              onChange={(e) => {
                                const f = e.target.files && e.target.files[0];
                                setSoporteError(null);
                                if (!f) {
                                  setSoporte(null);
                                  return;
                                }
                                if (f.size > 20 * 1024 * 1024) {
                                  setSoporte(null);
                                  setSoporteError(
                                    "El archivo no debe superar 20MB"
                                  );
                                  return;
                                }
                                const isPdf =
                                  f.type === "application/pdf" ||
                                  /\.pdf$/i.test(f.name || "");
                                if (!isPdf) {
                                  setSoporte(null);
                                  setSoporteError("El soporte debe ser un PDF");
                                  return;
                                }
                                setSoporte(f);
                              }}
                            />
                            {(errors.soporte || soporteError) && (
                              <small
                                className="p-error"
                                style={{ display: "block", marginTop: 4 }}
                              >
                                {errors.soporte || soporteError}
                              </small>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex py-4 gap-2">
                  <Button
                    label="Volver"
                    severity="secondary"
                    icon="pi pi-arrow-left"
                    disabled={saving}
                    onClick={() => stepperRef.current.prevCallback()}
                  />
                  <Button
                    label={saving ? "Guardando..." : "Finalizar"}
                    icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"}
                    iconPos="right"
                    disabled={saving}
                    onClick={handleFinalizarClick}
                  />
                </div>
              </StepperPanel>
            </Stepper>
          </div>
        )}
      </div>
    </div>
  );
};
export default Actualizacion;
