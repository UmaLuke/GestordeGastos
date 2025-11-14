import { Link } from "react-router-dom";
import Features from "../Componentes/Features";
import cielo from "../assets/cielo.jpg";

export default function Home() {
  return (
    <main className="bg-white">
      {/* HERO con imagen de fondo */}
      <section
        className="relative min-h-[68vh] flex items-center overflow-hidden"
        style={{ backgroundImage: `url(${cielo})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-white/0" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
          <div className="max-w-2xl text-white drop-shadow-[0_1px_0_rgba(0,0,0,.25)]">
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
              Tu dinero, claro y bajo control
            </h1>
            <p className="mt-3 md:text-lg text-white/90">
              Registrá ingresos y egresos, mirá resúmenes y tomá mejores decisiones.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/movimientos" className="px-5 py-3 rounded-xl bg-white text-gray-900 font-semibold shadow hover:shadow-lg transition">
                Ver movimientos
              </Link>
              <a href="#contacto" className="px-5 py-3 rounded-xl bg-white/10 text-white border border-white/40 hover:bg-white/15 transition">
                Consultas
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de características */}
      <Features />
    </main>
  );
}
