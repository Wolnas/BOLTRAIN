import api from './auth';

export const listarPedidos = (estado) =>
  api.get('/pedidos', { params: estado && estado !== 'todos' ? { estado } : {} });

export const crearPedido = (datos) => api.post('/pedidos', datos);
export const actualizarPedido = (id, datos) => api.put(`/pedidos/${id}`, datos);
export const cambiarEstadoPedido = (id, estado) => api.patch(`/pedidos/${id}/estado`, { estado });
export const eliminarPedido = (id) => api.delete(`/pedidos/${id}`);
