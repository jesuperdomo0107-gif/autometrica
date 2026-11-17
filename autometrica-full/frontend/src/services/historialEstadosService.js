// src/services/historialEstadosService.js
import api from "./api";

export const getHistorial = (params) => api.get("/historial-estados/", { params });
export const getHistorialPorOrden = (ordenId) =>
  api.get("/historial-estados/", { params: { orden_id: ordenId } });
export const crearHistorial = (datos) => api.post("/historial-estados/", datos);
