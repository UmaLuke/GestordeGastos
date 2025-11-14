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
import { api } from "./api"; // Importamos nuestra API configurada

function AppInner() {
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState("login");
  
  // --- Estados para la autenticación ---
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // --- Cargar usuario al inicio si hay token ---
  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (token) {
      api.get("/usuarios/me")
        .then(response => {
          setUser(response.data);
          console.log("✅ Usuario cargado:", response.data);
        })
        .catch(error => {
          console.error("❌ Token inválido o expirado:", error);
          localStorage.removeItem("user_token");
        });
    }
  }, []);

  // --- Abrir modal desde URL (?auth=register) ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("auth") === "register") openRegister();
  }, [location.search]);

  // --- Abrir modales ---
  const openLogin = () => { 
    setMode("login"); 
    setAuthError(null); 
    setAuthOpen(true); 
  };
  
  const openRegister = () => { 
    setMode("register"); 
    setAuthError(null); 
    setAuthOpen(true); 
  };

  // --- Cerrar modal ---
  const handleCloseAuth = () => {
    setAuthOpen(false);
    setAuthError(null);
    const params = new URLSearchParams(location.search);
    if (params.has("auth")) {
      params.delete("auth");
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  };

  // --- 🔥 FUNCIÓN PRINCIPAL: Manejar Registro y Login ---
  const handleSubmitAuth = async ({ mode, email, password }) => {
    setAuthError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        // 1️⃣ REGISTRO
        console.log("📝 Intentando registrar:", email);
        await api.post("/usuarios", {
          nombre: email.split("@")[0], // Usamos la parte antes del @ como nombre
          email: email,
          password: password
        });
        
        console.log("✅ Registro exitoso, procediendo a login...");
        
        // 2️⃣ Login automático después del registro
        await handleLogin(email, password);

      } else {
        // 3️⃣ LOGIN directo
        console.log("🔐 Intentando login:", email);
        await handleLogin(email, password);
      }
    } catch (error) {
      console.error("❌ Error en autenticación:", error);
      
      // Manejo de errores mejorado
      if (error.response) {
        // El servidor respondió con un error
        const detail = error.response.data?.detail || "Error desconocido";
        
        if (detail.includes("ya existe") || detail.includes("already exists")) {
          setAuthError("Este email ya está registrado. Intenta iniciar sesión.");
        } else if (detail.includes("incorrectos") || detail.includes("incorrect")) {
          setAuthError("Email o contraseña incorrectos.");
        } else {
          setAuthError(detail);
        }
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        setAuthError("No se pudo conectar al servidor. Verifica que el backend esté corriendo.");
      } else {
        setAuthError("Error inesperado. Por favor intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Función auxiliar para el Login ---
  const handleLogin = async (email, password) => {
    // FastAPI espera FormData para OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    // 1️⃣ Solicitar token
    const tokenResponse = await api.post("/token", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    
    const token = tokenResponse.data.access_token;
    console.log("🎫 Token recibido:", token.substring(0, 20) + "...");
    
    // 2️⃣ Guardar token en localStorage
    localStorage.setItem("user_token", token);
    
    // 3️⃣ Obtener datos del usuario
    const userResponse = await api.get("/usuarios/me");
    setUser(userResponse.data);
    console.log("✅ Login exitoso:", userResponse.data);
    
    // 4️⃣ Cerrar modal y redirigir
    handleCloseAuth();
    navigate("/movimientos");
  };

  // --- Función de Logout ---
  const handleLogout = () => {
    console.log("👋 Cerrando sesión...");
    setUser(null);
    localStorage.removeItem("user_token");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <Nav 
        user={user} 
        onLogout={handleLogout}
        onOpenLogin={openLogin} 
        onOpenRegister={openRegister} 
      />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Ruta protegida: solo usuarios logueados */}
          <Route 
            path="/movimientos" 
            element={
              user ? (
                <Movimientos user={user} />
              ) : (
                <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                  <h2 className="text-2xl font-semibold mb-4">
                    🔒 Acceso Restringido
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Necesitas iniciar sesión para ver tus movimientos.
                  </p>
                  <button
                    onClick={openLogin}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              )
            } 
          />
        </Routes>

        <Contacto />
        
        {/* Solo mostrar CTA si el usuario NO está logueado */}
        {!user && <CTAFullWidth onRegister={openRegister} />}
      </div>

      <Footer />

      <AuthModal
        open={authOpen}
        mode={mode}
        authError={authError}
        loading={loading}
        onClose={handleCloseAuth}
        onSwitchMode={() => {
          setMode(mode === "login" ? "register" : "login");
          setAuthError(null);
        }}
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