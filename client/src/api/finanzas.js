import api from './auth';

export const obtenerResumen = (mes, anio) =>
  api.get('/finanzas/resumen', { params: { mes, anio } });
export const obtenerBalance = () => api.get('/finanzas/balance');
export const listarComprasDolares = (mes, anio) =>
  api.get('/finanzas/compras-dolares', { params: { mes, anio } });
export const crearCompraDolares = (datos) => api.post('/finanzas/compras-dolares', datos);
export const eliminarCompraDolares = (id) => api.delete(`/finanzas/compras-dolares/${id}`);
