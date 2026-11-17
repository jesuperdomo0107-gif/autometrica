// src/services/vehiculosService.js
import api from "./api";

export const getVehiculos = async (params) => {
  const res = await api.get("/vehiculos/", { params });
  return res.data;
};

export const getVehiculoById = async (id) => {
  const res = await api.get(`/vehiculos/${id}`);
  return res.data;
};

export const getVehiculoPorPlaca = async (placa) => {
  const res = await api.get(`/vehiculos/placa/${placa}`);
  return res.data;
};

export const crearVehiculo = async (datos) => {
  const res = await api.post("/vehiculos/", datos);
  return res.data;
};

export const actualizarVehiculo = async (id, datos) => {
  const res = await api.put(`/vehiculos/${id}`, datos);
  return res.data;
};

export const eliminarVehiculo = async (id) => {
  const res = await api.delete(`/vehiculos/${id}`);
  return res.data;
};

