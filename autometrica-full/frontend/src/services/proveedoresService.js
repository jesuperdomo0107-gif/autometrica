import api from './api';

export const getProveedores = async () => {
  const response = await api.get('/proveedores/');
  return response.data;
};

export const crearProveedor = async (data) => {
  const response = await api.post('/proveedores/', data);
  return response.data;
};

export const actualizarProveedor = async (id, data) => {
  const response = await api.put(`/proveedores/${id}`, data);
  return response.data;
};

export const eliminarProveedor = async (id) => {
  await api.delete(`/proveedores/${id}`);
};
