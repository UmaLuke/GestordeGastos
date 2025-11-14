export default function Footer() {
  return (
    <footer className="bg-[#0E0A1F] text-gray-300">
      <div className="h-1 w-full bg-gradient-to-r from-teal-300 via-indigo-400 to-violet-600 opacity-60" />

      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-2">
        {/* Marca + logo (inline SVG para evitar problemas de carga) */}
        <div className="space-y-3">
          {/* LOGO inline */}
          <div className="h-10 w-auto">
            <svg width="220" height="48" viewBox="0 0 220 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gestión y orden">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="220" y2="48" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#66F0D1"/>
                  <stop offset="1" stopColor="#7C4DFF"/>
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#g)"/>
              {/* U */}
              <path d="M16 14v11c0 6.627 5.373 12 12 12s12-5.373 12-12V14h-6v11c0 3.314-2.686 6-6 6s-6-2.686-6-6V14h-6z" fill="#fff"/>
              {/* Texto */}
              <text x="56" y="22" fontFamily="Inter, ui-sans-serif, system-ui" fontSize="18" fontWeight="700" fill="#FFFFFF">Gestión</text>
              <text x="56" y="38" fontFamily="Inter, ui-sans-serif, system-ui" fontSize="12" fontWeight="600" fill="#F2E96D">y orden</text>
            </svg>
          </div>

          <p className="text-sm text-gray-400 max-w-md">
            Ordená tus finanzas con una experiencia simple, clara y potente.
            Registrá tus movimientos, visualizá tendencias y tomá mejores decisiones.
          </p>
        </div>

        {/* Umacorp (sin Simple Academy) */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Umacorp</h4>
          <ul className="space-y-2 text-sm">
            <li><a className="hover:text-white/90" href="/">Cómo funciona</a></li>
            <li><a className="hover:text-white/90" href="/movimientos">Movimientos</a></li>
            <li><a className="hover:text-white/90" href="#contacto">Contacto</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <hr className="border-white/10" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-[1fr_auto] items-center">
        <p className="text-xs leading-relaxed text-gray-400">
          Umacorp no brinda asesoramiento financiero. La información de este sitio es de carácter informativo
          y puede contener estimaciones. Verificá siempre antes de tomar decisiones económicas. Al utilizar
          la plataforma, aceptás nuestros Términos y Condiciones y Política de Privacidad.
        </p>
        <div className="text-right text-xs text-gray-500">
          © {new Date().getFullYear()} Umacorp. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
