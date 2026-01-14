import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import useAuth from "../context/useAuth";
import AppMenubar from "./AppMenubar";
import Footer from "./Footer";

export default function Usuarios() {
  const { token, apiBase } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(25);
  const [q, setQ] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const didInitRef = useRef(false);
  const inFlightRef = useRef(false);
  const fileInputRef = useRef(null);
  const toastRef = useRef(null);

  const fetchData = async (opts = {}) => {
    const { page: p = page, rows: r = rows, q: qOpt } = opts;
    const params = new URLSearchParams({
      limit: String(r),
      offset: String(p * r),
    });
    const qVal = typeof qOpt === "string" ? qOpt : q;
    if (qVal && qVal.trim() !== "") params.set("q", qVal.trim());
    if (inFlightRef.current) return; // evitar solicitudes concurrentes
    inFlightRef.current = true;
    setLoading(true);
    try {
      const resp = await fetch(`${apiBase}/usuarios?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    if (didInitRef.current) return; // evitar doble ejecución en StrictMode
    didInitRef.current = true;
    fetchData({ page: 0 });
    // Dependencias no incluidas a propósito para no re-disparar por cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Paginación y búsqueda se manejan en servidor (lazy). No filtramos localmente.
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
    const label = row.estadoNombre ?? String(row.estado ?? "");
    return <Tag value={label} severity={sev} />;
  };
  // Debounce: cuando cambia q, resetea a página 0 y consulta al backend
  useEffect(() => {
    const h = setTimeout(() => {
      setPage(0);
      fetchData({ page: 0, q });
    }, 300);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div>
      <AppMenubar />
      <div className="p-3 with-app-footer">
        <Toast ref={toastRef} />
        <h2>Consulta de Usuarios</h2>
        <div className="flex gap-2 align-items-center mb-2">
          <span className="p-input-icon-left">
            {/* <i className="pi pi-search" /> */}
            <InputText
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por documento o nombre"
            />
          </span>
          <Button
            label=""
            icon="pi pi-sync"
            severity="info"
            onClick={() => fetchData({ page })}
          />
          <Button
            label="Importar"
            icon="pi pi-upload"
            severity="help"
            loading={importing}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          />
          <Button
            label="Exportar"
            icon="pi pi-file-excel"
            severity="success"
            loading={exporting}
            onClick={async () => {
              if (exporting) return;
              try {
                setExporting(true);
                const resp = await fetch(`${apiBase}/export/usuarios`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (resp.status === 403) {
                  window.location.href = "/";
                  return;
                }
                if (!resp.ok) throw new Error("No se pudo exportar");
                const blob = await resp.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const ts = new Date()
                  .toISOString()
                  .replace(/[:T.-]/g, "")
                  .slice(0, 14);
                a.download = `usuarios_${ts}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (e) {
                console.error(e);
              } finally {
                setExporting(false);
              }
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) return;
              try {
                setImporting(true);
                const fd = new FormData();
                fd.append("file", file);
                const resp = await fetch(`${apiBase}/usuarios/import-excel`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                  body: fd,
                });
                if (resp.status === 403) {
                  window.location.href = "/";
                  return;
                }
                const json = await resp.json().catch(() => null);
                if (!resp.ok || !json?.success) {
                  throw new Error(json?.message || "Error importando Excel");
                }
                const d = json.data || {};
                 const msg = json.message || `Importación completada:\n`;
                const detailLines = msg + `\ntotalFilas: ${d.totalFilas ?? "?"}\ninsertados: ${d.insertados ?? "?"}\nexistentes: ${d.existentes ?? "?"}\nerrores: ${d.errores ?? "?"}`;
                if (toastRef.current) {
                  toastRef.current.show({
                    severity: "success",
                    summary: "Importación completada",
                    life: 6000,
                    content: (opts) => (
                      <div className="p-toast-message-content">
                        <span className="p-toast-summary">{opts.summary}</span>
                        <div className="p-toast-detail" style={{ whiteSpace: "pre-line" }}>{detailLines}</div>
                      </div>
                    ),
                  });
                }
                // refrescar listado
                fetchData({ page: 0 });
                setPage(0);
              } catch (err) {
                console.error(err);
                if (toastRef.current) {
                  const detail = (err && err.message) || "Error al importar";
                  toastRef.current.show({
                    severity: "error",
                    summary: "Error al importar",
                    life: 6000,
                    content: (opts) => (
                      <div className="p-toast-message-content">
                        <span className="p-toast-summary">{opts.summary}</span>
                        <div className="p-toast-detail" style={{ whiteSpace: "pre-line" }}>{detail}</div>
                      </div>
                    ),
                  });
                }
              } finally {
                setImporting(false);
                // limpiar input para permitir re-selección del mismo archivo
                if (fileInputRef.current) fileInputRef.current.value = "";
              }
            }}
          />
        </div>

        <DataTable
          value={items}
          loading={loading}
          paginator
          lazy
          totalRecords={total}
          rows={rows}
          first={page * rows}
          onPage={(e) => {
            const newPage = Math.floor(e.first / e.rows);
            setPage(newPage);
            setRows(e.rows);
            fetchData({ page: newPage, rows: e.rows, q });
          }}
        >
          <Column field="secuencia" header="#" style={{ width: 90 }} />
          <Column
            field="primer_nombre"
            header="Primer Nombre"
            style={{ width: 150 }}
          />
          <Column
            field="segundo_nombre"
            header="Segundo Nombre"
            style={{ width: 150 }}
          />
          <Column
            field="primer_apellido"
            header="Primer Apellido"
            style={{ width: 150 }}
          />
          <Column
            field="segundo_apellido"
            header="Segundo Apellido"
            style={{ width: 150 }}
          />
          <Column field="documento" header="Documento" />
          <Column field="nombreConsorcio" header="Nombre Consorcio" />
          <Column field="fecha_registro" header="F. Registro" />
          <Column header="Estado" body={estadoBody} />
        </DataTable>
      </div>
      <Footer />
    </div>
  );
}
