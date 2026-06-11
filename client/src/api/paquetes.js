import api from './auth';

/* ─── Paquetes de tienda (warehouse España) — tabla `paquetes` ─── */
export const listarPaquetesTienda   = ()         => api.get('/paquetes');
export const pedidosSinTienda       = (clienteId) => api.get('/paquetes/disponibles-tienda', { params: clienteId ? { clienteId } : {} });
export const crearPaqueteTienda     = (datos)    => api.post('/paquetes', datos);
export const actualizarEstadoTienda = (id, d)    => api.put(`/paquetes/${id}`, d);
export const eliminarPaqueteTienda  = (id)        => api.delete(`/paquetes/${id}`);

/* ─── Cajas para Bolivia — tabla `paquetes_bolivia` ─── */
export const listarPaquetesBolivia   = ()      => api.get('/paquetes/bolivia');
export const pedidosSinCaja          = ()      => api.get('/paquetes/disponibles');
export const crearPaqueteBolivia     = (datos) => api.post('/paquetes/bolivia', datos);
export const actualizarEstadoBolivia = (id, d) => api.put(`/paquetes/bolivia/${id}`, d);
export const eliminarPaqueteBolivia  = (id)     => api.delete(`/paquetes/bolivia/${id}`);

/* ─── Vista cliente ─── */
export const misPedidos = () => api.get('/paquetes/mispedidos');
