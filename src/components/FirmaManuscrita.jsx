import React, { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";
import { ProgressSpinner } from "primereact/progressspinner";

// Componente simple de firma manuscrita con canvas
export default function FirmaManuscrita({
  onCancel,
  onSave,
  policiesTitle,
  policiesContent,
}) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const toastRef = useRef(null);
  const drawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    // Tamaño responsivo dentro del contenedor
    const width = Math.min(parent.clientWidth || 600, 800);
    const height = Math.max(180, Math.floor(width * 0.4));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#111827"; // gris oscuro
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctxRef.current = ctx;
    // Fondo blanco para que el PNG no tenga transparencia
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : null;
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (e) => {
    if (saving) return;
    e.preventDefault();
    drawing.current = true;
    const { x, y } = getPos(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };

  const handleMove = (e) => {
    if (saving) return;
    if (!drawing.current) return;
    const { x, y } = getPos(e);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    setIsEmpty(false);
  };

  const handleEnd = () => {
    if (saving) return;
    drawing.current = false;
  };

  const limpiar = () => {
    if (saving) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const guardar = async () => {
    if (saving) return;
    if (!accepted) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Aceptación requerida",
        detail: "Por favor lea y acepte las políticas para continuar.",
        life: 3500,
      });
      return;
    }
    if (isEmpty) {
      toastRef.current?.show({
        severity: "info",
        summary: "Firma vacía",
        detail: "Dibuje su firma dentro del recuadro para continuar.",
        life: 3000,
      });
      return;
    }
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    try {
      setSaving(true);
      await Promise.resolve(onSave?.(dataUrl));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full" style={{ textAlign: "center", position: "relative" }}>
      <Toast ref={toastRef} />
      <h3 style={{ marginBottom: 8 }}>Firma manuscrita</h3>
      <p style={{ marginTop: 0, color: "#6b7280" }}>
        Por favor dibuje su firma dentro del recuadro.
      </p>
      <div
        style={{
          border: "1px dashed #cbd5e1",
          borderRadius: 8,
          padding: 8,
          background: "#f8fafc",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", maxWidth: 820, touchAction: "none" }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        {saving && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <ProgressSpinner style={{ width: "40px", height: "40px" }} strokeWidth="4" />
              <span style={{ color: "#334155" }}>Guardando firma…</span>
            </div>
          </div>
        )}
      </div>
      <div
        className="flex align-items-center justify-content-center gap-2"
        style={{ marginTop: 12 }}
      >
        <Checkbox
          inputId="chkPoliticas"
          checked={accepted}
          onChange={(e) => setAccepted(e.checked)}
        />
        <label htmlFor="chkPoliticas" style={{ userSelect: "none" }}>
          He leído y acepto las{" "}
          <button
            type="button"
            className="p-button p-button-link p-0 ml-1"
            onClick={() => setShowPolicies(true)}
            style={{ verticalAlign: "baseline" }}
          >
            políticas de aceptación para la captura de Firma Manuscrita Digital
          </button>
        </label>
      </div>
      {/* Mensaje en línea removido: ahora se alerta solo al hacer clic en Guardar */}
      <div
        className="flex justify-content-center gap-2"
        style={{ marginTop: 12 }}
      >
        <button
          className="p-button p-button-secondary p-button-sm"
          onClick={limpiar}
          type="button"
          disabled={saving}
        >
          Limpiar
        </button>
        <button
          className="p-button p-button-success p-button-sm"
          onClick={guardar}
          type="button"
          disabled={saving}
        >
          {saving ? (
            <>
              <i className="pi pi-spinner pi-spin" style={{ marginRight: 8 }} />
              Guardando…
            </>
          ) : (
            "Firmar"
          )}
        </button>
        {onCancel && (
          <button
            className="p-button p-button-text p-button-sm"
            onClick={onCancel}
            type="button"
            disabled={saving}
          >
            Cancelar
          </button>
        )}
      </div>

      <Dialog
        header={
          policiesTitle ||
          "Política de Aceptación para la Captura de Firma Manuscrita Digital"
        }
        visible={showPolicies}
        style={{ width: "50rem", maxWidth: "95vw" }}
        modal
        onHide={() => setShowPolicies(false)}
      >
        <div
          style={{
            maxHeight: 400,
            overflowY: "auto",
            lineHeight: 1.6,
            textAlign: "left",
          }}
        >
          {policiesContent || (
            <>
              <p>
                1. Objeto La presente política tiene como finalidad regular el
                proceso de captura, almacenamiento y uso de las firmas
                manuscritas digitales registradas por los usuarios dentro del
                sistema de información de <b>Fondexpress</b>.
              </p>
              <p>
                2. Alcance Aplica a todos los usuarios que, en el marco de los
                procesos y trámites electrónicos del sistema, deban registrar su
                firma como medio de aceptación, autorización o validación de
                información.
              </p>
              <p>
                3. Consentimiento informado Al realizar la firma digital
                manuscrita, el usuario autoriza expresamente a
                &nbsp;<b>Fondexpress</b> para capturar, almacenar y asociar dicha
                firma al documento o transacción correspondiente. El usuario
                reconoce que esta firma tiene validez equivalente a una firma
                manuscrita física, de conformidad con la Ley 527 de 1999 y las
                normas colombianas sobre comercio electrónico y mensajes de
                datos.
              </p>
              <p>
                4. Finalidad del tratamiento Las firmas capturadas se utilizarán
                exclusivamente para: Validar la autenticidad y aceptación de
                documentos, registros o formularios. Dejar constancia de la
                voluntad del usuario frente a trámites o servicios realizados
                dentro del sistema.
              </p>
              <p>
                5. Seguridad y confidencialidad La firma digital manuscrita se
                almacenará de forma cifrada y asociada únicamente al registro o
                documento correspondiente. No será compartida con terceros,
                salvo requerimiento legal o autorización expresa del titular.
                &nbsp;<b>Fondexpress</b> implementa medidas de seguridad
                administrativas, técnicas y legales para proteger la integridad
                y confidencialidad de las firmas capturadas.
              </p>
              <p>
                6. Derecho de revocatoria y actualización El titular de los
                datos podrá solicitar la actualización o eliminación de su
                información personal, de acuerdo con la Ley 1581 de 2012 sobre
                protección de datos personales.
              </p>
              <p>
                7. Aceptación de la política Al registrar su firma manuscrita
                digital, el usuario declara haber leído, entendido y aceptado
                los términos de esta política, y reconoce que dicha acción
                constituye manifestación expresa de su consentimiento.
              </p>
            </>
          )}
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <button
            type="button"
            className="p-button p-button-text"
            onClick={() => setShowPolicies(false)}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="p-button p-button-primary"
            onClick={() => {
              setAccepted(true);
              setShowPolicies(false);
            }}
          >
            Acepto
          </button>
        </div>
      </Dialog>
    </div>
  );
}

FirmaManuscrita.propTypes = {
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  policiesTitle: PropTypes.string,
  policiesContent: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};
