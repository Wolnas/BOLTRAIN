import api from './auth';

export const listarUsuarios  = (params) => api.get('/usuarios', { params });
export const listarClientes  = ()       => api.get('/usuarios', { params: { rol: 'viewer' } });
export const crearCliente    = (datos)  => api.post('/usuarios', datos);
export const actualizarCliente = (id, datos) => api.put(`/usuarios/${id}`, datos);
export const toggleActivoCliente = (id) => api.patch(`/usuarios/${id}/activo`);
export const listarLocutorios = ()      => api.get('/locutorios');
