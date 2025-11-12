// Frontend/src/App.jsx
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "./Componentes/Header";
import Nav from "./Componentes/Nav";
import Footer from "./Componentes/Footer";
import Contacto from "./Componentes/Contacto";
import AuthModal from "./Componentes/AuthModal";
import Home from "./Paginas/Home";
import Movimientos from "./Paginas/Movimientos";
import CTAFullWidth from "./Componentes/CTAFullWidth";

function AppInner() {
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState("login");

  const location = useLocation();
  const navigate = useNavigate();

  const openLogin = () => { setMode("login"); setAuthOpen(true); };
  const openRegister = () => { setMode("register"); setAuthOpen(true); };

  // abrir modal desde URL (?auth=register)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("auth") === "register") openRegister();
  }, [location.search]);

  const handleCloseAuth = () => {
    setAuthOpen(false);
    const params = new URLSearchParams(location.search);
    if (params.has("auth")) {
      params.delete("auth");
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  };

  const handleSubmitAuth = async ({ mode, email, password }) => {
    console.log("AUTH submit:", mode, email, password);
    handleCloseAuth();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Nav onOpenLogin={openLogin} onOpenRegister={openRegister} />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movimientos" element={<Movimientos />} />
        </Routes>

        <Contacto />

        {/* CTA Full width debajo de Contacto */}
        <CTAFullWidth onRegister={openRegister} />
      </div>

      <Footer />

      <AuthModal
        open={authOpen}
        mode={mode}
        onClose={handleCloseAuth}
        onSwitchMode={() => setMode(mode === "login" ? "register" : "login")}
        onSubmit={handleSubmitAuth}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
