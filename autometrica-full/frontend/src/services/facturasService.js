import api from './api';

export const getFacturas = async () => {
  const response = await api.get('/facturas/');
  return response.data;
};

export const crearFactura = async (data) => {
  const response = await api.post('/facturas/', data);
  return response.data;
};

export const actualizarFactura = async (id, data) => {
  const response = await api.put(`/facturas/${id}`, data);
  return response.data;
};

export const registrarPagoManual = async (facturaId, pagoData) => {
  const response = await api.post(`/facturas/${facturaId}/pagos`, pagoData);
  return response.data;
};

export const getPagosPorFactura = async (facturaId) => {
  const response = await api.get(`/facturas/${facturaId}/pagos`);
  return response.data;
};
