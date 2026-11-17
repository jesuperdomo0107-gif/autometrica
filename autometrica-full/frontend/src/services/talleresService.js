// src/services/talleresService.js
import api from "./api";

export const getTalleres = (params) => api.get("/talleres/", { params });
export const getTallerById = (id) => api.get(`/talleres/${id}`);
export const getTallerPorCodigo = (codigo) => api.get(`/talleres/codigo/${encodeURIComponent(codigo)}`);
export const crearTaller = (datos) => api.post("/talleres/", datos);
export const actualizarTaller = (id, datos) => api.put(`/talleres/${id}`, datos);
