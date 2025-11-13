import axios from "axios";

// 1. Creamos la instancia de axios como ya la tenías
export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// 2. ¡La parte Mágica! (Un "Interceptor")
// Esto se ejecuta ANTES de CADA petición que hagamos con "api".
api.interceptors.request.use(
  (config) => {
    // 3. Busca el token en el almacenamiento local del navegador
    const token = localStorage.getItem("user_token");

    // 4. Si el token existe, lo añade a los encabezados (headers)
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    // 5. Deja que la petición continúe
    return config;
  },
  (error) => {
    // Maneja errores si algo falla antes de enviar
    return Promise.reject(error);
  }
);