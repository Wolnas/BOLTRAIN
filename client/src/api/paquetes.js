import api from './auth';

/* ─── Paquetes de Tienda (warehouse España) ─── */
export const listarPaquetesTienda   = ()         => api.get('/paquetes/tienda');
export const pedidosSinTienda       = (clienteId) => api.get('/paquetes/tienda/pedidos-disponibles', { params: clienteId ? { clienteId } : {} });
export const crearPaqueteTienda     = (datos)    => api.post('/paquetes/tienda', datos);
export const actualizarEstadoTienda = (id, d)    => api.put(`/paquetes/tienda/${id}`, d);
export const eliminarPaqueteTienda  = (id)        => api.delete(`/paquetes/tienda/${id}`);

/* ─── Cajas para Bolivia ─── */
export const listarPaquetesBolivia   = ()      => api.get('/paquetes/bolivia');
export const pedidosSinCaja          = ()      => api.get('/paquetes/bolivia/pedidos-disponibles');
export const crearPaqueteBolivia     = (datos) => api.post('/paquetes/bolivia', datos);
export const actualizarEstadoBolivia = (id, d) => api.put(`/paquetes/bolivia/${id}`, d);
export const eliminarPaqueteBolivia  = (id)     => api.delete(`/paquetes/bolivia/${id}`);

/* ─── Vista cliente ─── */
export const misPedidos = () => api.get('/paquetes/mispedidos');
