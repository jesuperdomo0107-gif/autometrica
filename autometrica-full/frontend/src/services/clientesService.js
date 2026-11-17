// src/services/clientesService.js
import api from "./api";

export const getClientes = async (params) => {
  const res = await api.get("/clientes/", { params });
  return res.data;
};

export const getClienteById = async (id) => {
  const res = await api.get(`/clientes/${id}`);
  return res.data;
};

export const getClientePorUsuario = async (usuarioId) => {
  const res = await api.get(`/clientes/usuario/${usuarioId}`);
  return res.data;
};

export const crearCliente = async (datos) => {
  const res = await api.post("/clientes/", datos);
  return res.data;
};

export const actualizarCliente = async (id, datos) => {
  const res = await api.put(`/clientes/${id}`, datos);
  return res.data;
};

export const eliminarCliente = async (id) => {
  const res = await api.delete(`/clientes/${id}`);
  return res.data;
};

