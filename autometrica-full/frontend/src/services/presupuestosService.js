// src/services/presupuestosService.js
import api from './api';

export const getPresupuestos = async (params) => {
  const response = await api.get('/presupuestos/', { params });
  return response.data;
};

export const getPresupuestoById = async (id) => {
  const response = await api.get(`/presupuestos/${id}`);
  return response.data;
};

export const getPresupuestosPorOrden = async (ordenId) => {
  const response = await api.get(`/presupuestos/orden/${ordenId}`);
  return response.data;
};

export const crearPresupuesto = async (data) => {
  const response = await api.post('/presupuestos/', data);
  return response.data;
};

export const actualizarPresupuesto = async (id, data) => {
  const response = await api.put(`/presupuestos/${id}`, data);
  return response.data;
};

export const eliminarPresupuesto = async (id) => {
  const response = await api.delete(`/presupuestos/${id}`);
  return response.data;
};
