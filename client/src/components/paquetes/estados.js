/* Configuración compartida de estados para los flujos de paquetes.
   Paleta BOLTRAIN: dorado #c9a84c, verde éxito #22c55e. */

/* ─── Paquete de Tienda (warehouse) — 4 estados del viaje del pedido ─── */
export const TIENDA_CFG = {
  en_camino:       { label: 'En camino',      cls: 'text-blue-300 border-blue-500/40 bg-blue-500/10',   pulse: 'pulse', punto: '#3b82f6' },
  en_warehouse:    { label: 'En warehouse',   cls: 'text-dorado border-dorado/40 bg-dorado/10',          pulse: 'glow',  punto: '#c9a84c' },
  enviado_bolivia: { label: 'Enviado Bolivia', cls: 'text-purple-300 border-purple-500/40 bg-purple-500/10', pulse: null, punto: '#a78bfa' },
  entregado:       { label: 'Entregado',      cls: 'text-green-300 border-green-500/40 bg-green-500/10', pulse: null,    punto: '#22c55e' },
};

export const TIENDA_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'en_camino', label: 'En Camino' },
  { key: 'en_warehouse', label: 'En Warehouse' },
  { key: 'enviado_bolivia', label: 'Enviados' },
  { key: 'entregado', label: 'Entregados' },
];

/* Filtros de la sección warehouse del trabajador ("Recogidos" = ya salió/entregó) */
export const WAREHOUSE_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'en_camino', label: 'En Camino' },
  { key: 'en_warehouse', label: 'En Warehouse' },
  { key: 'recogidos', label: 'Recogidos' },
];

/* ─── Caja para Bolivia — 3 estados ─── */
export const BOLIVIA_CFG = {
  armando:   { label: 'Armando',   cls: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10', pulse: true,  siguiente: { estado: 'enviado',   texto: 'Marcar Enviada' } },
  enviado:   { label: 'Enviada',   cls: 'text-blue-300 border-blue-500/40 bg-blue-500/10',       pulse: false, siguiente: { estado: 'entregado', texto: 'Marcar Entregada' } },
  entregado: { label: 'Entregada', cls: 'text-green-300 border-green-500/40 bg-green-500/10',     pulse: false, siguiente: null },
};

export const BOLIVIA_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'armando', label: 'Armando' },
  { key: 'enviado', label: 'Enviadas' },
  { key: 'entregado', label: 'Entregadas' },
];

/* Pasos del timeline del cliente (vista viewer) */
export const TIMELINE_PASOS = [
  { key: 'en_camino',       label: 'En Camino' },
  { key: 'en_warehouse',    label: 'En Warehouse' },
  { key: 'enviado_bolivia', label: 'Enviado Bolivia' },
  { key: 'entregado',       label: 'Entregado' },
];
export const TIMELINE_INDICE = { en_camino: 0, en_warehouse: 1, enviado_bolivia: 2, entregado: 3 };

/* Pulso animado según tipo (usa keyframes definidos en index.css) */
export const pulseStyle = (tipo) =>
  tipo === 'pulse' ? { animation: 'pulse 2s ease-in-out infinite' }
  : tipo === 'glow' ? { animation: 'pulseGold 2s ease-in-out infinite' }
  : tipo === true   ? { animation: 'pulse 2s ease-in-out infinite' }
  : {};
