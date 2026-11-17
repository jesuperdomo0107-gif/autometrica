import api from './api';

export const getCitas = async () => {
  const response = await api.get('/citas/');
  return response.data;
};

export const getCitasPorCliente = async (clienteId) => {
  const response = await api.get(`/citas/cliente/${clienteId}`);
  return response.data;
};

export const crearCita = async (citaData) => {
  const response = await api.post('/citas/', citaData);
  return response.data;
};

export const actualizarCita = async (id, citaData) => {
  const response = await api.put(`/citas/${id}`, citaData);
  return response.data;
};

export const eliminarCita = async (id) => {
  await api.delete(`/citas/${id}`);
};
