// Frontend/src/Componentes/AuthModal.jsx
import { useState, useEffect } from "react";

export default function AuthModal({ 
  open, 
  mode = "login", 
  onClose, 
  onSwitchMode, 
  onSubmit, 
  authError,
  loading 
}) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => {
    if (open) {
      setEmail("");
      setPass("");
    }
  }, [open, mode]);

  if (!open) return null;

  const title = mode === "login" ? "Acceso" : "Crear cuenta";
  const altTxt = mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?";
  const altBtn = mode === "login" ? "Crear cuenta" : "Iniciar sesión";
  const submitLabel = mode === "login" ? "Ingresar" : "Registrarme";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Evitar doble submit
    
    await onSubmit?.({ mode, email, password: pass });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={!loading ? onClose : undefined}
      />
      
      {/* Ventana */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border p-6 relative">
          {/* Botón X */}
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar"
            className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ×
          </button>

          <h3 className="text-xl font-semibold mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-6">
            Ingresá tu correo electrónico y contraseña.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Correo electrónico"
              className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              disabled={loading}
              maxLength={72} // Límite de bcrypt
            />

            {/* Mostrar error si existe */}
            {authError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Cargando...</span>
                </>
              ) : (
                submitLabel
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600 mr-2">{altTxt}</span>
            <button 
              onClick={onSwitchMode} 
              disabled={loading}
              className="text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {altBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}