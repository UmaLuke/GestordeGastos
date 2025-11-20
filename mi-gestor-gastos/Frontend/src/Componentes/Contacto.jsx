import { useState } from "react";
import { api } from "../api";

export default function Contacto() {
  const [form, setForm] = useState({ nombre: "", email: "", mensaje: "" });
  const [ok, setOk] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post("/contacto", form);
      setOk(true);
      setForm({ nombre: "", email: "", mensaje: "" });

      setTimeout(() => { setOk(false); }, 3000);
    } catch (err) {
      console.error("Error al enviar el mensaje:", err);
      setError(err.response?.data?.message || "Error al enviar el mensaje.");
    } finally{
      setLoading(false);
    }

  };

  return (
    <section id="contacto" className="bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-6">
          CONTACTO
        </h2>

        <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-6 text-center">
          El desarrollo de este proyecto se realiza de forma distribuida. 
          Atendemos cualquier consulta sobre el proyecto; completá el siguiente 
          formulario y te respondemos a la brevedad.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Nombre"
            className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={loading}
          />
          <textarea
            rows="6"
            placeholder="Mensaje"
            className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-white"
            value={form.mensaje}
            onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
            required
            disabled={loading}
          />
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>

        {ok && (
          <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            ¡Mensaje enviado! Te contactaremos a la brevedad.
          </div>
        )}
      </div>
      {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            ❌ {error}
          </div>
        )}
    </section>
  );
}
