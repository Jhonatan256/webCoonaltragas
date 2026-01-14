import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { InputTextarea } from "primereact/inputtextarea";
import useAuth from "../context/useAuth";
import AppMenubar from "./AppMenubar";
import Footer from "./Footer";

export default function UsuariosNuevos() {
  const { token, apiBase } = useAuth();
  const toastRef = useRef(null);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancelRow, setCancelRow] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(25);
  const [q, setQ] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [firmado, setFirmado] = useState(null);
  const didInitRef = useRef(false);
  const inFlightRef = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [pdfVisible, setPdfVisible] = useState(false); // Existing PDF viewer state
  const [pdfUrl, setPdfUrl] = useState(null); // Existing PDF URL state
  const [pdfDoc, setPdfDoc] = useState(null); // Existing PDF document state
  const [formVisible, setFormVisible] = useState(false); // New form viewer state
  const [formUrl, setFormUrl] = useState(null); // New form URL state

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchData({ page: 0 });
  };

  const fetchData = async (opts = {}) => {
    const {
      page: p = page,
      rows: r = rows,
      q: fq = q,
      year: fy = year,
      firmado: ff = firmado,
    } = opts;
    const params = new URLSearchParams({
      limit: String(r),
      offset: String(p * r),
      year: String(fy),
    });
    if (fq) params.set("q", fq);
    if (ff === "S" || ff === "N") params.set("firmado", ff);
    if (inFlightRef.current) return; // Evitar llamadas concurrentes
    inFlightRef.current = true;
    setLoading(true);
    try {
      const resp = await fetch(`${apiBase}/registro/usuarios?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (resp.status === 403) {
        window.location.href = "/";
        return;
      }
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json?.success)
        throw new Error(json?.message || "Error consultando");
      setItems(json.data?.items || []);
      setTotal(json.data?.total || 0);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didInitRef.current) return; // Evitar doble ejecución en StrictMode
    didInitRef.current = true;
    fetchData({}); // cargar inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firmadoOptions = [
    { label: "Todos", value: null },
    { label: "Firmado", value: "S" },
    { label: "No firmado", value: "N" },
  ];

  const header = (
    <div className="flex flex-wrap gap-2 align-items-center">
      <form onSubmit={handleFilterSubmit}>
        <span className="p-input-icon-left">
          <InputText
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (doc, nombre, correo)"
            className="mr-2"
          />
        </span>
        <Dropdown
          value={firmado}
          onChange={(e) => setFirmado(e.value)}
          options={firmadoOptions}
          placeholder="Todos"
          className="mr-2"
        />
        <InputText
          type="number"
          value={year}
          className="mr-2"
          onChange={(e) =>
            setYear(Number(e.target.value || new Date().getFullYear()))
          }
          style={{ width: 120 }}
        />
        <Button
          label="Buscar"
          icon="pi pi-search"
          type="submit"
          disabled={loading}
          className="mr-2"
        />
        <Button
          label=""
          type="submit"
          icon="pi pi-sync"
          severity="info"
          disabled={loading}
        />
        <Button
          type="button"
          label="Exportar"
          icon="pi pi-file-excel"
          severity="success"
          className="ml-2"
          loading={exporting}
          onClick={async () => {
            if (exporting) return;
            try {
              setExporting(true);
              const params = new URLSearchParams({ year: String(year) });
              const resp = await fetch(`${apiBase}/export/registros?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (resp.status === 403) {
                window.location.href = "/";
                return;
              }
              if (!resp.ok) {
                toastRef.current?.show({ severity: 'error', summary: 'Error', detail: `No se pudo exportar (HTTP ${resp.status})` });
                throw new Error('No se pudo exportar');
              }
              const blob = await resp.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const ts = new Date().toISOString().replace(/[:T.-]/g, '').slice(0, 14);
              a.download = `registros_${year}_${ts}.xlsx`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
              toastRef.current?.show({ severity: 'success', summary: 'Exportación', detail: 'Descarga iniciada' });
            } catch (e) {
              console.error(e);
              if (e && e.message) {
                toastRef.current?.show({ severity: 'error', summary: 'Error', detail: e.message });
              }
            } finally {
              setExporting(false);
            }
          }}
        />
        <Button
          type="button"
          label="ZIP PDFs"
          icon="pi pi-file-export"
          severity="warning"
          className="ml-2"
          onClick={async () => {
            try {
              const params = new URLSearchParams({ year: String(year), type: "register" });
              const resp = await fetch(`${apiBase}/export/pdfs?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (resp.status === 403) {
                window.location.href = "/";
                return;
              }
              if (!resp.ok) {
                toastRef.current?.show({ severity: 'error', summary: 'Error', detail: `No se pudo descargar el ZIP (HTTP ${resp.status})` });
                return;
              }
              const blob = await resp.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `pdfs_register_${year}.zip`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
              toastRef.current?.show({ severity: 'success', summary: 'ZIP generado', detail: 'Descarga iniciada' });
            } catch (e) {
              console.error(e);
              toastRef.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se pudo descargar el ZIP' });
            }
          }}
        />
      </form>
    </div>
  );
 const estadoBody = (row) => {
    let sev = "";
    switch (row.estado) {
      case 1:
        sev = "success";
        break;
      case 2:
        sev = "warning";
        break;
      case 3:
        sev = "danger";
        break;

      default:
        sev = "info";
        break;
    }
    const label = row.nombre_estado ?? String(row.estado ?? "");
    return <Tag value={label} severity={sev} />;
  };
  const nameBody = (row) => {
    const parts = [
      row.primer_nombre,
      row.segundo_nombre,
      row.primer_apellido,
      row.segundo_apellido,
    ].filter(Boolean);
    return parts.join(" ");
  };

  const firmadoBody = (row) => (
    <Tag
      value={row.firmado === "S" ? "Firmado" : "No"}
      severity={row.firmado === "S" ? "success" : "warning"}
    />
  );

  const documentoPdf = (row) =>
    row.documentoPdf ? (
      <Button
        type="button"
        icon="pi pi-file-pdf"
        label=""
        severity="danger"
        outlined
        onClick={() => {
          setFormUrl(row.documentoPdf);
          setFormVisible(true);
        }}
      />
    ) : (
      <span>-</span>
    );
  
  const formularioPdf = (row) =>
    row.formulario ? (
      <Button
        type="button"
        icon="pi pi-file-pdf"
        label=""
        severity="help"
        outlined
        onClick={() => {
          setFormUrl(row.formulario);
          setFormVisible(true);
        }}
      />
    ) : (
      <span>-</span>
    );

  // (activación ahora gestionada por actionBody)

  const confirmActivate = (row) => {
    confirmDialog({
      message: `Confirma activar al usuario ${row.documento || row.id_usuario}?`,
      header: 'Confirmar activación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, activar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-success',
      accept: () => { void doActivate(row); },
    });
  };

  const confirmCancel = (row) => {
    confirmDialog({
      message: `¿Desea cancelar la afiliación del usuario ${row.documento || row.id_usuario}?`,
      header: 'Confirmar cancelación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'No',
      acceptClassName: 'p-button-danger',
      accept: () => {
        setCancelRow(row);
        setCancelReason("");
        setCancelDialogVisible(true);
      },
    });
  };

  async function doActivate(row) {
    try {
      const resp = await fetch(`${apiBase}/usuarios/${row.id_usuario}/activar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.status === 403) {
        window.location.href = '/';
        return;
      }
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json?.success) {
        const msg = json?.message || 'No se pudo activar';
        toastRef.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
        throw new Error(msg);
      }
      fetchData({});
      toastRef.current?.show({ severity: 'success', summary: 'Activado', detail: 'Usuario activado correctamente', life: 3000 });
    } catch (e) {
      console.error(e);
    }
  }

  async function submitCancel() {
    const motivo = cancelReason?.trim();
    if (!motivo) {
      toastRef.current?.show({ severity: 'warn', summary: 'Motivo requerido', detail: 'Debe especificar un motivo de cancelación.', life: 4000 });
      return;
    }
    try {
      const resp = await fetch(`${apiBase}/usuarios/${cancelRow.id_usuario}/cancelar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo }),
      });
      if (resp.status === 403) {
        window.location.href = '/';
        return;
      }
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json?.success) {
        const msg = json?.message || 'No se pudo cancelar';
        toastRef.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
        throw new Error(msg);
      }
      setCancelDialogVisible(false);
      setCancelRow(null);
      setCancelReason("");
      fetchData({});
      toastRef.current?.show({ severity: 'success', summary: 'Cancelado', detail: 'Afiliación cancelada correctamente', life: 3000 });
    } catch (e) {
      console.error(e);
    }
  }

  const actionBody = (row) => (
    row.firmado === 'S' ? (
      <div className="flex gap-2">
        {Number(row.estado) !== 1 && (
          <Button
            type="button"
            icon="pi pi-check"
            label=""
            severity="success"
            outlined
            disabled={loading}
            tooltip="Activar usuario"
            tooltipOptions={{ position: 'top' }}
            onClick={() => confirmActivate(row)}
          />
        )}
        {Number(row.estado) !== 1 && Number(row.estado) !== 3 && (
          <Button
            type="button"
            icon="pi pi-times"
            label=""
            severity="danger"
            outlined
            disabled={loading}
            tooltip="Cancelar afiliación"
            tooltipOptions={{ position: 'top' }}
            onClick={() => confirmCancel(row)}
          />
        )}
      </div>
    ) : null
  );

  return (
    <div>
      <AppMenubar />
      <div className="p-3 with-app-footer">
        <ConfirmDialog />
        <Toast ref={toastRef} position="top-right" />
        <Dialog
          visible={cancelDialogVisible}
          header="Motivo de cancelación"
          modal
          style={{ width: '40rem', maxWidth: '95vw' }}
          onHide={() => setCancelDialogVisible(false)}
          footer={
            <div className="flex justify-content-end gap-2">
              <Button label="Cerrar" type="button" onClick={() => setCancelDialogVisible(false)} outlined />
              <Button label="Cancelar afiliación" type="button" severity="danger" onClick={submitCancel} disabled={!cancelReason?.trim()} />
            </div>
          }
        >
          <div className="field">
            <label htmlFor="motivoCancelacion" className="block mb-2">Describe el motivo</label>
            <InputTextarea id="motivoCancelacion" autoFocus rows={5} className="w-full" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Ingrese el motivo de cancelación" />
          </div>
        </Dialog>
        <h2>Usuarios nuevos registrados</h2>
        <DataTable
          value={items}
          loading={loading}
          paginator
          totalRecords={total}
          rows={rows}
          first={page * rows}
          onPage={(e) => {
            setPage(Math.floor(e.first / e.rows));
            setRows(e.rows);
            fetchData({ page: Math.floor(e.first / e.rows), rows: e.rows });
          }}
          header={header}
        >
          <Column field="secuencia" header="#" style={{ width: 80 }} />
          <Column header="Acciones" body={actionBody} style={{ width: 180 }} />
          <Column field="documento" header="Documento" />
          <Column header="Nombre" body={nameBody} />
          <Column field="email" header="Email" />
          <Column field="celular" header="Celular" />
          <Column field="edad" header="Edad" />
           <Column header="Estado" body={estadoBody} />
          <Column field="year" header="Año" style={{ width: 100 }} />
          <Column field="created_at" header="Fecha" />
          <Column header="Firmado" body={firmadoBody} style={{ width: 140 }} />
          <Column header="Soporte" body={documentoPdf} style={{ width: 140 }} />
          <Column header="Formulario" body={formularioPdf} style={{ width: 140 }} />
        </DataTable>
        <Dialog
          visible={pdfVisible}
          onHide={() => {
            setPdfVisible(false);
            setPdfUrl(null);
            setPdfDoc(null);
          }}
          header={pdfDoc ? `Documento ${pdfDoc}` : "Documento PDF"}
          modal
          maximizable
          style={{ width: "90vw", maxWidth: "1200px" }}
          breakpoints={{ "960px": "90vw", "640px": "100vw" }}
          className="full-screen-dialog"
          contentStyle={{ padding: 0 }}
        >
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title={pdfDoc ? `PDF ${pdfDoc}` : "PDF"}
              style={{
                width: "100%",
                height: "100%",
                minHeight: "60vh",
                border: "none",
              }}
            />
          ) : null}
        </Dialog>
        <Footer />
        <Dialog
          visible={formVisible}
          onHide={() => {
            setFormVisible(false);
            setFormUrl(null);
            setPdfDoc(null);
          }}
          header={pdfDoc ? `Documento ${pdfDoc}` : "Formulario PDF"}
          modal
          maximizable
          style={{ width: "90vw", maxWidth: "1200px" }}
          breakpoints={{ "960px": "90vw", "640px": "100vw" }}
          className="full-screen-dialog"
          contentStyle={{ padding: 0 }}
        >
          {formUrl ? (
            <iframe
              src={formUrl}
              title={pdfDoc ? `Formulario ${pdfDoc}` : "Formulario"}
              style={{
                width: "100%",
                height: "100%",
                minHeight: "60vh",
                border: "none",
              }}
            />
          ) : null}
        </Dialog>
      </div>
    </div>
  );
}
