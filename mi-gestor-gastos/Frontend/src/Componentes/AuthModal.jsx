import { useState, useEffect } from "react";

export default function AuthModal({ open, mode="login", onClose, onSwitchMode, onSubmit }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => {
    if (open) { setEmail(""); setPass(""); }
  }, [open, mode]);

  if (!open) return null;

  const title = mode === "login" ? "Acceso" : "Crear cuenta";
  const altTxt = mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?";
  const altBtn = mode === "login" ? "Crear cuenta" : "Iniciar sesión";
  const submitLabel = mode === "login" ? "Ingresar" : "Registrarme";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({ mode, email, password: pass });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Ventana */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border p-6 relative">
          {/* Botón X */}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
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
              className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={pass}
              onChange={(e)=>setPass(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {submitLabel}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600 mr-2">{altTxt}</span>
            <button onClick={onSwitchMode} className="text-blue-600 hover:underline">
              {altBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
