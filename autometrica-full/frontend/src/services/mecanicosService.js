// src/services/mecanicosService.js
import api from "./api";

export const getMecanicos = (params) => api.get("/mecanicos/", { params });
export const getMecanicoById = (id) => api.get(`/mecanicos/${id}`);
export const crearMecanico = (datos) => api.post("/mecanicos/", datos);
export const actualizarMecanico = (id, datos) => api.put(`/mecanicos/${id}`, datos);
export const eliminarMecanico = (id) => api.delete(`/mecanicos/${id}`);
