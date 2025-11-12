// Frontend/src/Componentes/Features.jsx
export default function Features() {
  const items = [
    { title: "1) Creá tu cuenta", desc: "Registrate con tu email en segundos." },
    { title: "2) Cargá tus movimientos", desc: "Ingresos y gastos, todo categorizado." },
    { title: "3) Mirá tu resumen", desc: "Saldo al instante y control mensual." },
  ];
  return (
    <section className="bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Cómo usar el gestor (¡es re fácil!)</h3>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="bg-white border rounded-2xl shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <h4 className="font-semibold mb-1">{it.title}</h4>
              <p className="text-sm text-gray-600">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
