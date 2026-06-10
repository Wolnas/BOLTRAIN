import api from './auth';

/* ─── Flujo 1: Paquetes de Tienda (España) ─── */
export const listarPaquetesTienda   = ()       => api.get('/paquetes/tienda');
export const pedidosSinTienda       = (clienteId) => api.get('/paquetes/tienda/pedidos-disponibles', { params: clienteId ? { clienteId } : {} });
export const crearPaqueteTienda     = (datos)  => api.post('/paquetes/tienda', datos);
export const actualizarEstadoTienda = (id, d)  => api.put(`/paquetes/tienda/${id}`, d);
export const eliminarPaqueteTienda  = (id)      => api.delete(`/paquetes/tienda/${id}`);

/* ─── Flujo 2: Paquetes de Cliente (Bolivia) ─── */
export const listarPaquetesCliente    = ()           => api.get('/paquetes/cliente');
export const misPaquetesCliente       = ()           => api.get('/paquetes/cliente/mios');
export const pedidosDisponiblesCliente = (clienteId) => api.get(`/paquetes/cliente/pedidos-disponibles/${clienteId}`);
export const crearPaqueteCliente      = (datos)      => api.post('/paquetes/cliente', datos);
export const actualizarEstadoCliente  = (id, d)      => api.put(`/paquetes/cliente/${id}`, d);
export const eliminarPaqueteCliente   = (id)          => api.delete(`/paquetes/cliente/${id}`);
