import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api"; // ← Nuestra API configurada
import Button from "../Componentes/ui/Button";
import Card from "../Componentes/ui/Card";
import Badge from "../Componentes/ui/Badge";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const CATEGORIAS = ["Insumos", "Logística", "Servicios", "Impuestos", "Otros"];
const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"];

const todayLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fmt = (n) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

export default function Movimientos({ user }) {
  //Los items vienen del backend
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Filtros por fecha
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
  const [submitting, setSubmitting] = useState(false);
  // Alerta fondos insuficientes
  const [showAlert, setShowAlert] = useState(false);
  const prevDisponible = useRef(0);
  // CARGAR DATOS AL INICIO
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar movimientos y categorías en paralelo
        const [movimientosRes, categoriasRes] = await Promise.all([
          api.get("/movimientos"),
          api.get("/categorias")
        ]);

        console.log("✅ Movimientos cargados:", movimientosRes.data);
        console.log("✅ Categorías cargadas:", categoriasRes.data);

        // Transformar movimientos para que coincidan con el formato esperado
        const movimientosTransformados = movimientosRes.data.map(m => ({
          fecha: m.fecha,
          concepto: m.descripcion,
          categoria: m.categoria_id ? 
            categoriasRes.data.find(c => c.id === m.categoria_id)?.nombre || "Otros" 
            : "Ingresos",
          tipo: m.monto > 0 ? "ingreso" : "egreso",
          monto: Math.abs(m.monto),
          id: m.id // Guardamos el ID para poder editar/borrar
        }));

        setItems(movimientosTransformados);
        setCategorias(categoriasRes.data);
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
        setError(err.response?.data?.detail || "Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      cargarDatos();
    }
  }, [user]);

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

  // Detectar cruce a negativo
  useEffect(() => {
    if (totales.disponible < 0 && prevDisponible.current >= 0) {
      setShowAlert(true);
      const t = setTimeout(() => setShowAlert(false), 4000);
      return () => clearTimeout(t);
    }
    prevDisponible.current = totales.disponible;
  }, [totales.disponible]);

  // Datos para el gráfico
  const pieData = useMemo(() => {
    const porCat = new Map();
    filtrados.filter(i => i.tipo === "egreso").forEach(i => {
      porCat.set(i.categoria, (porCat.get(i.categoria) || 0) + Number(i.monto));
    });
    return Array.from(porCat, ([name, value]) => ({ name, value }));
  }, [filtrados]);

  // GUARDAR MOVIMIENTO EN LA BASE DE DATOS
  const addMovimiento = async (e) => {
    e.preventDefault();
    const montoNum = Number(form.monto);
    if (!form.concepto || !montoNum || montoNum <= 0) return;

    setSubmitting(true);

    try {
      // Buscar el ID de la categoría
      let categoriaId = null;
      if (form.tipo === "egreso") {
        const cat = categorias.find(c => c.nombre === form.categoria && c.tipo === "egreso");
        categoriaId = cat?.id || null;
      }

      // Enviar al backend
      const payload = {
        descripcion: form.concepto,
        monto: form.tipo === "ingreso" ? montoNum : -montoNum, // Negativos para egresos
        categoria_id: categoriaId
      };

      console.log("📤 Enviando movimiento:", payload);

      const response = await api.post("/movimientos", payload);
      console.log("✅ Movimiento guardado:", response.data);

      // Agregar a la lista local
      const nuevoMovimiento = {
        fecha: response.data.fecha,
        concepto: response.data.descripcion,
        categoria: categoriaId ? 
          categorias.find(c => c.id === categoriaId)?.nombre || "Otros"
          : "Ingresos",
        tipo: form.tipo,
        monto: montoNum,
        id: response.data.id
      };

      setItems(prev => [nuevoMovimiento, ...prev]);

      // Limpiar formulario
      setForm({ tipo: "ingreso", concepto: "", categoria: "Insumos", monto: "" });
      setOpenForm(false);
    } catch (err) {
      console.error("❌ Error guardando movimiento:", err);
      alert(err.response?.data?.detail || "Error al guardar el movimiento");
    } finally {
      setSubmitting(false);
    }
  };

  // ESTADO DE CARGA
  if (loading) {
    return (
      <main className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Cargando movimientos...</p>
        </div>
      </main>
    );
  }

  // ESTADO DE ERROR
  if (error) {
    return (
      <main className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Movimientos</h2>
            <p className="text-gray-600">
              Hola <span className="font-medium text-gray-900">{user?.nombre || user?.email}</span>, 
              aquí están tus movimientos guardados.
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
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 flex items-center justify-between">
            <span className="font-semibold">⚠️ FONDOS INSUFICIENTES</span>
            <button onClick={() => setShowAlert(false)} className="text-rose-700 hover:underline text-sm">
              Ocultar
            </button>
          </div>
        )}

        {/* Formulario */}
        {openForm && (
          <Card>
            <form onSubmit={addMovimiento} className="grid md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-1">
                <label className="text-sm font-medium">Fecha</label>
                <div className="w-full border rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-700">
                  {todayLocal()}
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="text-sm font-medium">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                  disabled={submitting}
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
                    disabled={submitting}
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
                  disabled={submitting}
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
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                  placeholder="0,00"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="md:col-span-6 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setOpenForm(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
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

        {/* Tabla + Gráfico */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden p-0">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold">Listado ({filtrados.length})</h3>
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
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No hay movimientos. ¡Crea el primero! 🚀
                      </td>
                    </tr>
                  ) : (
                    filtrados.map((f, i) => (
                      <tr key={f.id || i} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">{f.fecha}</td>
                        <td className="px-4 py-2">{f.concepto}</td>
                        <td className="px-4 py-2">
                          {f.tipo === "ingreso" ? (
                            <Badge color="green">Ingresos</Badge>
                          ) : (
                            <Badge color={
                              f.categoria === "Insumos" ? "blue" :
                              f.categoria === "Logística" ? "violet" :
                              f.categoria === "Servicios" ? "green" :
                              f.categoria === "Impuestos" ? "red" : "gray"
                            }>
                              {f.categoria}
                            </Badge>
                          )}
                        </td>
                        <td className={`px-4 py-2 text-right font-medium ${f.tipo === "egreso" ? "text-rose-600" : "text-emerald-600"}`}>
                          {f.tipo === "egreso" ? "- " + fmt(f.monto) : "+ " + fmt(f.monto)}
                        </td>
                      </tr>
                    ))
                  )}
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
                    <Tooltip formatter={(v) => fmt(Number(v))} />
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