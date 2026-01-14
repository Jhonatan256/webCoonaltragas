import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import useAuth from "../context/useAuth";
import AppMenubar from "./AppMenubar";
import Footer from "./Footer";
import { Toast } from "primereact/toast";

export default function UsuariosActualizados() {
  const { token, apiBase } = useAuth();
  const toastRef = useRef(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(25);
  const [q, setQ] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [firmado, setFirmado] = useState(null);
  const [pdfVisible, setPdfVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const didInitRef = useRef(false);
  const inFlightRef = useRef(false);
  const [exporting, setExporting] = useState(false);

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
      const resp = await fetch(
        `${apiBase}/actualizaciones/usuarios?${params.toString()}`,
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
          {/* <i className="pi pi-search" /> */}
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
              const resp = await fetch(`${apiBase}/export/actualizaciones?${params.toString()}`, {
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
              a.download = `actualizaciones_${year}_${ts}.xlsx`;
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
              const params = new URLSearchParams({ year: String(year), type: "update" });
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
              a.download = `pdfs_update_${year}.zip`;
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

  const pdfBody = (row) =>
    row.pdf_url ? (
      <Button
        type="button"
        icon="pi pi-file-pdf"
        label=""
        severity="danger"
        outlined
        onClick={() => {
          setPdfUrl(row.pdf_url);
          setPdfDoc(row.documento || null);
          setPdfVisible(true);
        }}
      />
    ) : (
      <span>-</span>
    );

  return (
    <div>
      <AppMenubar />
  <div className="p-3 with-app-footer">
        <Toast ref={toastRef} position="top-right" />
        <h2>Usuarios con actualización de datos</h2>
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
          <Column field="documento" header="Documento" />
          <Column header="Nombre" body={nameBody} />
          <Column field="email" header="Email" />
          <Column field="celular" header="Celular" />
          <Column field="year" header="Año" style={{ width: 100 }} />
          <Column field="created_at" header="Fecha" />
          <Column header="Firmado" body={firmadoBody} style={{ width: 140 }} />
          <Column header="PDF" body={pdfBody} style={{ width: 160 }} />
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
      </div>
    </div>
  );
}
