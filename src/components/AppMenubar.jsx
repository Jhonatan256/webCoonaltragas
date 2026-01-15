import React, { useRef, useState } from "react";
import { Menubar } from "primereact/menubar";
import { Avatar } from "primereact/avatar";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import { OverlayPanel } from "primereact/overlaypanel";
import { Dialog } from "primereact/dialog";
import { Password } from "primereact/password";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

export default function AppMenubar() {
  const navigate = useNavigate();
  const { user, logout, token, apiBase } = useAuth();
  const opRef = useRef(null);
  const toastRef = useRef(null);
  const [pwdDialog, setPwdDialog] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const items = [
    {
      label: "Home",
      icon: "pi pi-home",
      command: () => navigate("/dashboard"),
    },
    {
      label: "Usuarios",
      icon: "pi pi-users",
      command: () => navigate("/usuarios"),
    },
    {
      label: "Actualizaciones",
      icon: "pi pi-user-edit",
      command: () => navigate("/actualizados"),
    },
    {
      label: "Usuarios nuevos",
      icon: "pi pi-user-plus",
      command: () => navigate("/usuarios-nuevos"),
    },
  ];

  const start = (
    <img
      alt="logo"
      src="/img/LOGO_COONALTRAGAS_FND-1.png"
      height="40"
      className="mr-2"
    />
  );

  const end = (
    <div className="flex align-items-center gap-2">
      <span className="hidden md:inline">{user?.nombre || ""}</span>
      <Avatar
        image="/img/user.jpg"
        shape="circle"
        onClick={(e) => opRef.current?.toggle(e)}
        style={{ cursor: "pointer" }}
        title="Opciones de usuario"
      />
      <button
        type="button"
        className="p-button p-button-text"
        onClick={() => {
          logout();
        }}
        title="Cerrar sesión"
        style={{ background: "none", border: 0 }}
      >
        <i className="pi pi-sign-out" />
      </button>
      <OverlayPanel ref={opRef} dismissable>
        <div className="p-fluid" style={{ minWidth: 220 }}>
          <button
            type="button"
            className="p-button p-button-text w-full"
            onClick={() => {
              setPwdDialog(true);
              opRef.current?.hide();
            }}
          >
            <i className="pi pi-key mr-2" /> Cambiar contraseña
          </button>
          {/* <button
            type="button"
            className="p-button p-button-text w-full"
            onClick={() => {
              opRef.current?.hide();
              logout();
            }}
          >
            <i className="pi pi-sign-out mr-2" /> Cerrar sesión
          </button> */}
        </div>
      </OverlayPanel>
      <Toast ref={toastRef} position="top-right" />
      <Dialog
        header="Cambiar contraseña"
        visible={pwdDialog}
        style={{ width: "420px", maxWidth: "95vw" }}
        modal
        onHide={() => {
          if (!savingPwd) setPwdDialog(false);
        }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              severity="secondary"
              onClick={() => !savingPwd && setPwdDialog(false)}
              disabled={savingPwd}
            />
            <Button
              label={savingPwd ? "Guardando..." : "Guardar"}
              icon="pi pi-save"
              onClick={async () => {
                if (savingPwd) return;
                if (!currentPwd || !newPwd || !confirmPwd) {
                  toastRef.current?.show({ severity: "warn", summary: "Faltan datos", detail: "Completa todos los campos." });
                  return;
                }
                if (newPwd !== confirmPwd) {
                  toastRef.current?.show({ severity: "error", summary: "Error", detail: "Las contraseñas no coinciden." });
                  return;
                }
                if (newPwd.length < 8) {
                  toastRef.current?.show({ severity: "warn", summary: "Contraseña débil", detail: "Debe tener al menos 8 caracteres." });
                  return;
                }
                try {
                  setSavingPwd(true);
                  const resp = await fetch(`${apiBase}/auth/change-password`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
                  });
                  const json = await resp.json().catch(() => null);
                  if (!resp.ok || !json?.success) {
                    throw new Error(json?.message || "No se pudo actualizar");
                  }
                  toastRef.current?.show({ severity: "success", summary: "Éxito", detail: "Contraseña actualizada." });
                  setPwdDialog(false);
                  setCurrentPwd("");
                  setNewPwd("");
                  setConfirmPwd("");
                } catch (e) {
                  toastRef.current?.show({ severity: "error", summary: "Error", detail: e.message || "Error al actualizar." });
                } finally {
                  setSavingPwd(false);
                }
              }}
              disabled={savingPwd}
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="currentPwd">Contraseña actual</label>
            <Password id="currentPwd" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} toggleMask feedback={false} inputStyle={{ width: "100%" }} inputClassName="w-full" autoComplete="current-password" />
          </div>
          <div className="field">
            <label htmlFor="newPwd">Nueva contraseña</label>
            <Password id="newPwd" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} toggleMask inputStyle={{ width: "100%" }} inputClassName="w-full" autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="confirmPwd">Confirmar contraseña</label>
            <Password id="confirmPwd" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} toggleMask feedback={false} inputStyle={{ width: "100%" }} inputClassName="w-full" autoComplete="new-password" />
          </div>
        </div>
      </Dialog>
    </div>
  );

  return <Menubar model={items} start={start} end={end} />;
}
