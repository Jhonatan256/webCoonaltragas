import React, { useEffect, useMemo, useState, useRef } from "react";
import AppMenubar from "./AppMenubar";
import Footer from "./Footer";
import "chart.js/auto";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import useAuth from "../context/useAuth";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Dashboard() {
  const { apiBase, token, user } = useAuth();
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState({});
  const [satData, setSatData] = useState(null);
  const [satOptions, setSatOptions] = useState({});
  const [satComments, setSatComments] = useState([]);
  const [counterData, setCounterData] = useState(null);
  const [counterOptions, setCounterOptions] = useState({});
  const [updatedThisYear, setUpdatedThisYear] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const nf = useMemo(() => new Intl.NumberFormat("es-CO"), []);
  const pf = useMemo(
    () =>
      new Intl.NumberFormat("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );
  const updatedPercent = useMemo(
    () => (totalUsuarios > 0 ? (updatedThisYear / totalUsuarios) * 100 : 0),
    [totalUsuarios, updatedThisYear]
  );
  // Refs para capturar los contenedores de cada gráfica
  const chartUpdatesRef = useRef(null);
  const chartCounterRef = useRef(null);
  const chartSatisfaccionRef = useRef(null);

  const generatePdfReport = async () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Encabezado con datos del generador
      const nombre = user?.nombre || user?.name || "Usuario";
      const email = user?.email || "";
      const fecha = new Date().toLocaleString("es-CO");
      doc.setFontSize(16);
      doc.text("Informe de Dashboard", pageWidth / 2, 40, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Generado por: ${nombre}${email ? " <" + email + ">" : ""}`, 40, 60);
      doc.text(`Fecha: ${fecha}`, 40, 75);

      // Helper para agregar los KPIs como texto con descripciones
      const addKpiTextSection = (yStart) => {
        let y = yStart;
        doc.setFontSize(12);
        doc.text("Indicadores principales", 40, y);
        y += 14;
        doc.setFontSize(10);
        const lines = [
          `Asociados (total en el sistema): ${nf.format(totalUsuarios)}`,
          `Actualizados en ${selectedYear} (total): ${nf.format(updatedThisYear)}`,
          `% Actualizados ${selectedYear}: ${pf.format(updatedPercent)}%`,
        ];
        doc.text(lines, 40, y);
        y += lines.length * 14 + 10;
        return y;
      };

      // Helper para agregar el resumen de estado (Inscripciones/Afiliados/Pendientes/Cancelados) como texto
      const addCounterTextSection = (yStart) => {
        if (!counterData || !counterData.datasets || !counterData.datasets[0]) return yStart;
        let y = yStart;
        const labels = Array.isArray(counterData.labels) ? counterData.labels : [];
        const data = Array.isArray(counterData.datasets[0]?.data) ? counterData.datasets[0].data : [];
        const map = {};
        labels.forEach((label, i) => {
          map[String(label)] = Number(data[i] ?? 0);
        });
        doc.setFontSize(12);
        doc.text("Resumen de estado", 40, y);
        y += 14;
        doc.setFontSize(10);
        const lines = [
          `Inscripciones ${selectedYear} (registros firmados): ${nf.format(map["Total"] ?? 0)}`,
          `Afiliados activos ${selectedYear}: ${nf.format(map["Afiliados"] ?? 0)}`,
          `Pendientes ${selectedYear}: ${nf.format(map["Pendientes"] ?? 0)}`,
          `Cancelados ${selectedYear}: ${nf.format(map["Cancelados"] ?? 0)}`,
        ];
        doc.text(lines, 40, y);
        y += lines.length * 14 + 10;
        return y;
      };

      // Helper para agregar una captura de un contenedor DOM ajustado al ancho del PDF
      const addSectionFromRef = async (ref, titulo, descripcion, yStart) => {
        if (!ref?.current) return yStart;
        // Agregar título y descripción
        let y = yStart;
        doc.setFontSize(12);
        doc.text(titulo, 40, y);
        y += 14;
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(descripcion, pageWidth - 80);
        doc.text(lines, 40, y);
        y += lines.length * 12 + 6;

        const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 80;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        if (y + imgHeight > pageHeight - 40) {
          doc.addPage();
          y = 40;
        }
        doc.addImage(imgData, "PNG", 40, y, imgWidth, imgHeight);
        return y + imgHeight + 20;
      };

      let yCursor = 100;
  // Añadir primero los KPIs como texto
  yCursor = addKpiTextSection(yCursor);
  // Añadir el resumen de estado (si hay datos cargados)
  yCursor = addCounterTextSection(yCursor);
      yCursor = await addSectionFromRef(
        chartUpdatesRef,
        "Actualizaciones por año",
        "Muestra el número de actualizaciones de datos por año para los últimos cinco años.",
        yCursor
      );
      yCursor = await addSectionFromRef(
        chartCounterRef,
        "Inscripciones, Afiliados, Pendientes y Cancelados",
        "Comparativa horizontal para el año seleccionado entre total de registros firmados (inscripciones), afiliados activos, pendientes y cancelados.",
        yCursor
      );
      yCursor = await addSectionFromRef(
        chartSatisfaccionRef,
        "Satisfacción",
        "Distribución de respuestas a la pregunta de facilidad de actualización y lista de comentarios destacados.",
        yCursor
      );

      // Guardar PDF
      doc.save(`informe_dashboard_${selectedYear}.pdf`);
    } catch (e) {
      // En caso de error, al menos loguearlo en consola
      // eslint-disable-next-line no-console
      console.error("Error generando PDF:", e);
    }
  };

  const redirectHomeOn403 = (resp) => {
    if (resp && resp.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("auth_user");
      localStorage.clear();
      window.location.href = "/";
      return true;
    }
    return false;
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // Total de usuarios (asociados)
        const respTotal = await fetch(`${apiBase}/usuarios?limit=1&offset=0`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (redirectHomeOn403(respTotal)) return;
        const jsonTotal = await respTotal.json().catch(() => null);
        if (respTotal.ok && jsonTotal?.success) {
          setTotalUsuarios(jsonTotal.data?.total || 0);
        }

        // Conteo de actualizaciones por año (últimos 5 años, incluyendo el actual)
        const currentYear = new Date().getFullYear();
        const years = [
          currentYear - 4,
          currentYear - 3,
          currentYear - 2,
          currentYear - 1,
          currentYear,
        ];
        const promises = years.map(async (y) => {
          const url = `${apiBase}/actualizaciones/usuarios?limit=1&offset=0&year=${y}`;
          const r = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (redirectHomeOn403(r)) return 0;
          const j = await r.json().catch(() => null);
          return r.ok && j?.success ? j.data?.total || 0 : 0;
        });
        const counts = await Promise.all(promises);

        setChartData({
          labels: years.map(String),
          datasets: [
            {
              label: "Actualizaciones por año",
              data: counts,
              backgroundColor: "rgba(54, 162, 235, 0.5)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
          ],
        });
        setChartOptions({
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Usuarios que actualizaron por año" },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  `${ctx.dataset.label || ""}: ${nf.format(
                    ctx.parsed.y ?? ctx.parsed ?? 0
                  )}`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                callback: (val) => nf.format(Number(val) || 0),
              },
            },
          },
        });
        // Tomar el valor del año en curso (último del arreglo)
        setUpdatedThisYear(counts[counts.length - 1] || 0);

        // Satisfacción del año actual
        const satUrl = `${apiBase}/actualizaciones/satisfaccion?year=${currentYear}&limit=150`;
        const rs = await fetch(satUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (redirectHomeOn403(rs)) return;
        const js = await rs.json().catch(() => null);
        if (rs.ok && js?.success) {
          const labels = (js.data?.counts || []).map((r) =>
            String(r.label ?? "(sin dato)")
          );
          const data = (js.data?.counts || []).map((r) => Number(r.count ?? 0));
          const palette = [
            "#42A5F5",
            "#66BB6A",
            "#FFA726",
            "#AB47BC",
            "#FF7043",
            "#26C6DA",
          ];
          const bg = labels.map((_, i) => palette[i % palette.length]);
          setSatData({
            labels,
            datasets: [{ data, backgroundColor: bg }],
          });
          setSatOptions({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "top" },
              title: { display: true, text: `Satisfacción ${currentYear}` },
              tooltip: {
                callbacks: {
                  label: (ctx) =>
                    `${ctx.label || ""}: ${nf.format(ctx.parsed ?? 0)}`,
                },
              },
            },
          });
          setSatComments(
            Array.isArray(js.data?.comments) ? js.data.comments : []
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalcular métricas por año seleccionado
  useEffect(() => {
    const fetchYearSpecific = async (y) => {
      try {
        // Total de actualizaciones en el año seleccionado
        const urlTot = `${apiBase}/actualizaciones/usuarios?limit=1&offset=0&year=${y}`;
        const rt = await fetch(urlTot, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (redirectHomeOn403(rt)) return;
        const jt = await rt.json().catch(() => null);
        setUpdatedThisYear(rt.ok && jt?.success ? jt.data?.total || 0 : 0);

        // Satisfacción del año seleccionado
        const satUrl = `${apiBase}/actualizaciones/satisfaccion?year=${y}&limit=150`;
        const rs = await fetch(satUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (redirectHomeOn403(rs)) return;
        const js = await rs.json().catch(() => null);
        if (rs.ok && js?.success) {
          const labels = (js.data?.counts || []).map((r) =>
            String(r.label ?? "(sin dato)")
          );
          const data = (js.data?.counts || []).map((r) => Number(r.count ?? 0));
          const palette = [
            "#42A5F5",
            "#66BB6A",
            "#FFA726",
            "#AB47BC",
            "#FF7043",
            "#26C6DA",
          ];
          const bg = labels.map((_, i) => palette[i % palette.length]);
          setSatData({ labels, datasets: [{ data, backgroundColor: bg }] });
          setSatOptions({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "top" },
              title: { display: true, text: `Satisfacción ${y}` },
              tooltip: {
                callbacks: {
                  label: (ctx) =>
                    `${ctx.label || ""}: ${nf.format(ctx.parsed ?? 0)}`,
                },
              },
            },
          });
          setSatComments(
            Array.isArray(js.data?.comments) ? js.data.comments : []
          );
        } else {
          setSatData(null);
          setSatComments([]);
        }

        // Contador de usuarios (Total vs Afiliados vs Cancelados) para el año seleccionado
        const cuUrl = `${apiBase}/contador/usuarios?year=${y}`;
        const rc = await fetch(cuUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (redirectHomeOn403(rc)) return;
        const jc = await rc.json().catch(() => null);
        if (rc.ok && jc?.success) {
          const total = Number(jc.data?.total ?? 0);
          const afiliados = Number(jc.data?.afiliados ?? 0);
          const cancelados = Number(jc.data?.cancelados ?? 0);
          const pendientes = Number(jc.data?.pendientes ?? 0);
          setCounterData({
            labels: ["Total", "Afiliados", "Pendientes", "Cancelados"],
            datasets: [
              {
                label: `Año ${y}`,
                data: [total, afiliados, pendientes, cancelados],
                backgroundColor: [
                  "rgba(54, 162, 235, 0.6)",
                  "rgba(75, 192, 192, 0.6)",
                  "rgba(223, 170, 31, 0.6)",
                  "rgba(255, 99, 132, 0.6)",
                ],
                borderColor: [
                  "rgba(54, 162, 235, 1)",
                  "rgba(75, 192, 192, 1)",
                  "rgba(223, 170, 31, 1)",
                  "rgba(255, 99, 132, 1)",
                ],
                borderWidth: 1,
              },
            ],
          });
          setCounterOptions({
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: true, text: `Contador de usuarios ${y}` },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.label || ""}: ${nf.format(ctx.parsed.x ?? 0)}`,
                },
              },
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                  callback: (val) => nf.format(Number(val) || 0),
                },
              },
            },
          });
        } else {
          setCounterData(null);
        }
      } catch {
        setUpdatedThisYear(0);
        setSatData(null);
        setSatComments([]);
        setCounterData(null);
      }
    };
    fetchYearSpecific(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  return (
    <>
      <AppMenubar />
      <div className="p-3 with-app-footer">
        <h2>Dashboard</h2>
        <div className="flex align-items-center gap-2 mb-3">
          <span>Seleccionar año:</span>
          {(() => {
            const now = new Date().getFullYear();
            const years = Array.from({ length: 7 }, (_, i) => now - i);
            return (
              <Dropdown
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.value)}
                options={years.map((y) => ({ label: String(y), value: y }))}
                style={{ width: 140 }}
              />
            );
          })()}
          <button
            type="button"
            className="p-button p-button-sm p-button-outlined"
            onClick={generatePdfReport}
            style={{ marginLeft: 12 }}
            title="Generar informe PDF"
          >
            <span className="pi pi-file-pdf" style={{ marginRight: 6 }} />
            Exportar PDF
          </button>
        </div>
        <div className="grid">
          <div className="col-12 md:col-4">
            <Card
              className="kpi-card kpi-total"
              title="Asociados"
              subTitle="Total en el sistema"
            >
              <div style={{ fontSize: 36, fontWeight: 700 }}>
                {loading ? "..." : totalUsuarios.toLocaleString()}
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-4">
            <Card
              className="kpi-card kpi-updated"
              title={`Actualizados en ${selectedYear}`}
              subTitle="Total"
            >
              <div style={{ fontSize: 36, fontWeight: 700 }}>
                {loading ? "..." : updatedThisYear.toLocaleString()}
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-4">
            <Card
              className="kpi-card kpi-percent"
              title={`% Actualizados ${selectedYear}`}
              subTitle={`${nf.format(updatedThisYear)} de ${nf.format(
                totalUsuarios
              )}`}
            >
              <div style={{ fontSize: 36, fontWeight: 700 }}>
                {loading ? "..." : `${pf.format(updatedPercent)}%`}
              </div>
            </Card>
          </div>

          <div className="col-12 md:col-8">
            <Card title="Actualizaciones por año">
              <div style={{ height: 320 }} ref={chartUpdatesRef}>
                {chartData ? (
                  <Chart type="bar" data={chartData} options={chartOptions} />
                ) : (
                  <div>Cargando…</div>
                )}
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-4">
            <Card title="Inscripciones, Afiliados y Cancelados">
              <div ref={chartCounterRef}>
                {counterData ? (
                  <Chart type="bar" data={counterData} options={counterOptions} />
                ) : (
                  <div>Cargando…</div>
                )}
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-6">
            <Card title="Satisfacción">
              <div style={{ height: 320 }} ref={chartSatisfaccionRef}>
                {satData ? (
                  <Chart type="doughnut" data={satData} options={satOptions} />
                ) : (
                  <div>Cargando…</div>
                )}
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-6">
            <Card
              className="kpi-card kpi-negative"
              title="Comentarios negativos"
            >
              {satComments && satComments.length > 0 ? (
                <ul
                  style={{ maxHeight: 300, overflowY: "auto", paddingLeft: 16 }}
                >
                  {satComments.map((c, idx) => (
                    <li key={idx} style={{ marginBottom: 8 }}>
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: "#000000ff" }}>(Sin comentarios)</div>
              )}
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
