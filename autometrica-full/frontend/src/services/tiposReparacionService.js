// src/services/tiposReparacionService.js
import api from './api';

export const getTiposReparacion = (params) => api.get('/tipos-reparacion/', { params });
export const getTipoReparacionById = (id) => api.get(`/tipos-reparacion/${id}`);
export const crearTipoReparacion = (datos) => api.post('/tipos-reparacion/', datos);
export const actualizarTipoReparacion = (id, datos) => api.put(`/tipos-reparacion/${id}`, datos);
export const eliminarTipoReparacion = (id) => api.delete(`/tipos-reparacion/${id}`);
