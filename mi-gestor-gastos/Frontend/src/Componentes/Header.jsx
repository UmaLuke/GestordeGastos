// Frontend/src/Componentes/Header.jsx
export default function Header() {
  return (
    <header className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white">
      <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold">G</div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">Gestor de Gastos</h1>
            <p className="text-xs text-white/80">Tu dinero, bajo control.</p>
          </div>
        </div>
      </div>
    </header>
  );
}
