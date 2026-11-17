// src/services/usuariosService.js
import api from "./api";

export const getUsuarios = async (params) => {
  const res = await api.get("/usuarios/", { params });
  return res.data;
};

export const getUsuarioById = async (id) => {
  const res = await api.get(`/usuarios/${id}`);
  return res.data;
};

export const getUsuarioPorCorreo = async (correo) => {
  const res = await api.get(`/usuarios/correo/${correo}`);
  return res.data;
};

export const crearUsuario = async (datos) => {
  const res = await api.post("/usuarios/", datos);
  return res.data;
};

export const actualizarUsuario = async (id, datos) => {
  const res = await api.put(`/usuarios/${id}`, datos);
  return res.data;
};

export const eliminarUsuario = async (id) => {
  const res = await api.delete(`/usuarios/${id}`);
  return res.data;
};

