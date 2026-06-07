import api from './auth';

export const listarPaquetes = () => api.get('/paquetes');
export const pedidosDisponibles = (clienteId) =>
  api.get(`/paquetes/pedidos-disponibles/${clienteId}`);
export const crearPaquete = (datos) => api.post('/paquetes', datos);
export const actualizarEstado = (id, datos) => api.put(`/paquetes/${id}/estado`, datos);
export const eliminarPaquete = (id) => api.delete(`/paquetes/${id}`);
