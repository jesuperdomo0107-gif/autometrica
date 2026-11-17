import api from './api';

export const getAuditLogs = async () => {
  const response = await api.get('/audit-logs/');
  return response.data;
};

export const crearAuditLog = async (logData) => {
  const response = await api.post('/audit-logs/', logData);
  return response.data;
};
