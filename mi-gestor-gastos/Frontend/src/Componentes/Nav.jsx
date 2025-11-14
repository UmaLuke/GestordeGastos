import { NavLink } from "react-router-dom";

export default function Nav({ user, onLogout, onOpenLogin, onOpenRegister }) {
  const base = "px-3 py-2 rounded-lg text-sm transition";
  const active = "bg-blue-600 text-white";
  const idle = "text-gray-700 hover:bg-gray-100";

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <ul className="flex gap-2 py-2">
          <li><NavLink to="/" end className={({isActive})=>`${base} ${isActive?active:idle}`}>Inicio</NavLink></li>
          
          {/* Solo mostramos "Movimientos" si el usuario está logueado */}
          {user && (
            <li><NavLink to="/movimientos" className={({isActive})=>`${base} ${isActive?active:idle}`}>Movimientos</NavLink></li>
          )}
          
          <li><a href="#contacto" className={`${base} ${idle}`}>Contacto</a></li>
        </ul>
        
        {/* Lógica condicional */}
        <div className="flex gap-2 py-2 items-center">
          {user ? (
            // Si el usuario existe, mostramos su email y el botón de salir
            <>
              <span className="text-sm text-gray-600">
                Hola, <span className="font-medium text-gray-900">{user.email}</span>
              </span>
              <button 
                onClick={onLogout} 
                className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50"
              >
                Salir
              </button>
            </>
          ) : (
            // Si no hay usuario, mostramos los botones de Acceso y Registro
            <>
              <button onClick={onOpenLogin} className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50">Acceso</button>
              <button onClick={onOpenRegister} className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Registro</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}