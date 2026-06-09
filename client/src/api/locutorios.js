import api from './auth';

// Selector (solo activos)
export const listarLocutorios = () => api.get('/locutorios');
// Gestión admin (incluye inactivos)
export const listarTodosLocutorios = () => api.get('/locutorios/todos');
export const crearLocutorio = (datos) => api.post('/locutorios', datos);
export const actualizarLocutorio = (id, datos) => api.put(`/locutorios/${id}`, datos);
export const toggleActivoLocutorio = (id) => api.patch(`/locutorios/${id}/activo`);
