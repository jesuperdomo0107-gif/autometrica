// src/services/reportesService.js
import api from "./api";

export const getReportes = (params) => api.get("/reportes-ingresos/", { params });
export const getReporteById = (id) => api.get(`/reportes-ingresos/${id}`);
export const getReportePorPeriodo = (tallerId, anio, mes) =>
  api.get(`/reportes-ingresos/taller/${tallerId}/periodo/${anio}/${mes}`);
export const crearReporte = (datos) => api.post("/reportes-ingresos/", datos);
export const actualizarReporte = (id, datos) => api.put(`/reportes-ingresos/${id}`, datos);
