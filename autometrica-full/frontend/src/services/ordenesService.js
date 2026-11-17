// src/services/ordenesService.js
import api from "./api";

export const getOrdenes = async (params) => {
  const res = await api.get("/ordenes/", { params });
  return res.data;
};

export const getOrdenById = async (id) => {
  const res = await api.get(`/ordenes/${id}`);
  return res.data;
};

export const getOrdenPorNumero = async (numero) => {
  const res = await api.get(`/ordenes/numero/${numero}`);
  return res.data;
};

export const crearOrden = async (datos) => {
  const res = await api.post("/ordenes/", datos);
  return res.data;
};

export const actualizarOrden = async (id, datos) => {
  const res = await api.put(`/ordenes/${id}`, datos);
  return res.data;
};

export const eliminarOrden = async (id) => {
  const res = await api.delete(`/ordenes/${id}`);
  return res.data;
};

