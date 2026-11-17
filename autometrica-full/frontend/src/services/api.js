// src/services/api.js
// Instancia base de Axios apuntando al backend de FastAPI.
//
// - Desarrollo: VITE_API_URL vacío -> "/api/v1" y el proxy de Vite (vite.config.js)
//   reenvía a http://127.0.0.1:8000.
// - Producción (Render): VITE_API_URL=https://TU-BACKEND.onrender.com/api/v1
//   (se inyecta en tiempo de build, así que hay que recompilar si cambia).
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "/api/v1").trim().replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_URL,
  // Render free "duerme" el backend tras 15 min sin tráfico; el primer arranque
  // puede tardar ~1 min, por lo que 10 s era insuficiente.
  timeout: 70000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor global de errores: muestra el mensaje del backend si existe
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg =
      error.response?.data?.detail ||
      (error.code === "ECONNABORTED"
        ? "El servidor tardó demasiado en responder. Si es la primera visita, el servidor gratuito puede estar despertando; intenta de nuevo en un minuto."
        : "Error de conexión con el servidor backend (FastAPI). Verifica que el backend esté en línea y que VITE_API_URL sea correcta.");
    return Promise.reject(new Error(msg));
  }
);

export default api;
