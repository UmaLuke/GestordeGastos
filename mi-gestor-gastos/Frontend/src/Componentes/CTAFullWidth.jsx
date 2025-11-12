// Frontend/src/Componentes/CTAFullWidth.jsx
import { Link } from "react-router-dom";

export default function CTAFullWidth({ onRegister }) {
  return (
    <section className="relative w-full overflow-hidden">
      {/* banda degradé a lo ancho */}
      <div className="bg-gradient-to-b from-teal-200 via-indigo-400 to-violet-600">
        {/* glow sutil */}
        <div className="absolute inset-x-0 -top-24 h-40 opacity-30 blur-3xl pointer-events-none"
             style={{ background: "radial-gradient(60% 50% at 50% 0%, rgba(255,255,255,.7), transparent)" }} />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-white">
          <h3 className="text-2xl md:text-4xl font-semibold leading-snug">
            ¿Querés comenzar a organizar tus gastos?
          </h3>
          <p className="mt-2 md:text-lg text-white/90">
            Gestioná tu dinero con nosotros.
          </p>

          <div className="mt-6">
            {onRegister ? (
              <button
                onClick={onRegister}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl
                           bg-white/90 text-gray-900 font-semibold shadow hover:shadow-lg transition"
              >
                Crear cuenta
              </button>
            ) : (
              <Link
                to="/?auth=register"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl
                           bg-white/90 text-gray-900 font-semibold shadow hover:shadow-lg transition"
              >
                Crear cuenta
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
