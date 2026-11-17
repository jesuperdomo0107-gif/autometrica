import api from './api';

export const getInventario = async () => {
  const response = await api.get('/inventario/');
  return response.data;
};

export const getAlertasStockMinimo = async () => {
  const response = await api.get('/inventario/alertas');
  return response.data;
};

export const crearInventarioItem = async (itemData) => {
  const response = await api.post('/inventario/', itemData);
  return response.data;
};

export const actualizarInventarioItem = async (id, itemData) => {
  const response = await api.put(`/inventario/${id}`, itemData);
  return response.data;
};

export const eliminarInventarioItem = async (id) => {
  await api.delete(`/inventario/${id}`);
};
