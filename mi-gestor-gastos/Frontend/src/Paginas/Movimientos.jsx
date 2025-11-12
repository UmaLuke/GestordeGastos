// Frontend/src/Paginas/Movimientos.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../Componentes/ui/Button";
import Card from "../Componentes/ui/Card";
import Badge from "../Componentes/ui/Badge";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const CATEGORIAS = ["Insumos", "Logística", "Servicios", "Impuestos", "Otros"];
const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];

// YYYY-MM-DD local
const todayLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fmt = (n) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

export default function Movimientos() {
  // Arranca vacío
  const [items, setItems] = useState([]);

  // Filtro por fecha
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");

  // Formulario
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({
    tipo: "ingreso",
    concepto: "",
    categoria: "Insumos",
    monto: "",
  });

  // Alerta por fondos insuficientes (cuando cruza a negativo)
  const [showAlert, setShowAlert] = useState(false);
  const prevDisponible = useRef(0);

  const filtrados = useMemo(() => {
    return items.filter((it) => {
      const t = new Date(it.fecha).getTime();
      const okDesde = fDesde ? t >= new Date(fDesde).getTime() : true;
      const okHasta = fHasta ? t <= new Date(fHasta).getTime() : true;
      return okDesde && okHasta;
    });
  }, [items, fDesde, fHasta]);

  const totales = useMemo(() => {
    const ingresos = filtrados.filter(i => i.tipo === "ingreso")
      .reduce((a, b) => a + Number(b.monto || 0), 0);
    const egresos = filtrados.filter(i => i.tipo === "egreso")
      .reduce((a, b) => a + Number(b.monto || 0), 0);
    return { ingresos, egresos, disponible: ingresos - egresos };
  }, [filtrados]);

  // Detectar cruce a negativo y mostrar alerta 1 sola vez por cruce
  useEffect(() => {
    if (totales.disponible < 0 && prevDisponible.current >= 0) {
      setShowAlert(true);
      // auto-ocultar luego de 4s (opcional)
      const t = setTimeout(() => setShowAlert(false), 4000);
      return () => clearTimeout(t);
    }
    prevDisponible.current = totales.disponible;
  }, [totales.disponible]);

  // Donut: egresos por categoría
  const pieData = useMemo(() => {
    const porCat = new Map();
    filtrados.filter(i => i.tipo === "egreso").forEach(i => {
      porCat.set(i.categoria, (porCat.get(i.categoria) || 0) + Number(i.monto));
    });
    return Array.from(porCat, ([name, value]) => ({ name, value }));
  }, [filtrados]);

  const addMovimiento = (e) => {
    e.preventDefault();
    const montoNum = Number(form.monto);
    if (!form.concepto || !montoNum || montoNum <= 0) return;

    const nuevo = {
      fecha: todayLocal(), // SIEMPRE hoy
      concepto: form.concepto,
      categoria: form.tipo === "ingreso" ? "Ingresos" : form.categoria,
      tipo: form.tipo,
      monto: montoNum,
    };

    setItems(prev => [nuevo, ...prev]);
    setForm({ tipo: "ingreso", concepto: "", categoria: "Insumos", monto: "" });
    setOpenForm(false);
  };

  return (
    <main className="bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Encabezado + filtros */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Movimientos</h2>
            <p className="text-gray-600">
              Cargá ingresos/egresos del día. La fecha se completa automáticamente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={fDesde}
              onChange={(e) => setFDesde(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="Desde"
              max={todayLocal()}
            />
            <input
              type="date"
              value={fHasta}
              onChange={(e) => setFHasta(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm"
              placeholder="Hasta"
              max={todayLocal()}
            />
            <Button variant="outline" onClick={() => { setFDesde(""); setFHasta(""); }}>
              Limpiar
            </Button>
            <Button onClick={() => setOpenForm(v => !v)}>
              {openForm ? "Cerrar" : "Nuevo movimiento"}
            </Button>
          </div>
        </div>

        {/* Alerta fondos insuficientes */}
        {showAlert && (
          <div
            className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 flex items-center justify-between"
            role="alert"
            aria-live="assertive"
          >
            <span className="font-semibold">FONDOS INSUFICIENTES</span>
            <button
              onClick={() => setShowAlert(false)}
              className="text-rose-700 hover:underline text-sm"
            >
              Ocultar
            </button>
          </div>
        )}

        {/* Formulario (fecha fija, sin spinners en Monto) */}
        {openForm && (
          <Card>
            <form onSubmit={addMovimiento} className="grid md:grid-cols-6 gap-3 items-end">
              {/* Fecha mostrada, NO editable */}
              <div className="md:col-span-1">
                <label className="text-sm font-medium">Fecha</label>
                <div className="w-full border rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-700 select-none">
                  {todayLocal()}
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="text-sm font-medium">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>

              {form.tipo === "egreso" && (
                <div className="md:col-span-1">
                  <label className="text-sm font-medium">Categoría</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="text-sm font-medium">Concepto</label>
                <input
                  type="text"
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  placeholder={form.tipo === "ingreso" ? "Ej: Transferencia" : "Ej: Compra denim"}
                  required
                />
              </div>

              <div className="md:col-span-1">
                <label className="text-sm font-medium">Monto (ARS)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm appearance-none [appearance:textfield] [-moz-appearance:textfield]"
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="md:col-span-6 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setOpenForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </Card>
        )}

        {/* Resumen */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-sm text-gray-600">Ingresado</p>
            <p className="text-2xl font-semibold text-emerald-600">{fmt(totales.ingresos)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-600">Gastado</p>
            <p className="text-2xl font-semibold text-rose-600">{fmt(totales.egresos)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-600">Disponible</p>
            <p className={`text-2xl font-semibold ${totales.disponible < 0 ? "text-rose-600" : "text-emerald-700"}`}>
              {fmt(totales.disponible)}
            </p>
          </Card>
        </div>

        {/* Tabla + gráfico */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden p-0">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold">Listado</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-2">Fecha</th>
                    <th className="text-left font-medium px-4 py-2">Concepto</th>
                    <th className="text-left font-medium px-4 py-2">Categoría</th>
                    <th className="text-right font-medium px-4 py-2">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((f, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">{f.fecha}</td>
                      <td className="px-4 py-2">{f.concepto}</td>
                      <td className="px-4 py-2">
                        {f.tipo === "ingreso" ? (
                          <Badge color="green">Ingresos</Badge>
                        ) : (
                          <Badge
                            color={
                              f.categoria === "Insumos" ? "blue" :
                              f.categoria === "Logística" ? "violet" :
                              f.categoria === "Servicios" ? "green" :
                              f.categoria === "Impuestos" ? "red" : "gray"
                            }
                          >
                            {f.categoria}
                          </Badge>
                        )}
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${f.tipo === "egreso" ? "text-rose-600" : "text-emerald-600"}`}>
                        {f.tipo === "egreso" ? "- " + fmt(f.monto) : "+ " + fmt(f.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">Egresos por categoría</h3>
            {pieData.length === 0 ? (
              <p className="text-sm text-gray-600">No hay egresos en el rango seleccionado.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(Number(v))} separator=" " />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
