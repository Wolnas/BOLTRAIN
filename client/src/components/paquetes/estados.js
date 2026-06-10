/* Configuración compartida de estados para los dos flujos de paquetes.
   Paleta BOLTRAIN: dorado #c9a84c, verde éxito #22c55e. */

/* ─── Flujo 1: Paquete de Tienda ─── */
export const TIENDA_CFG = {
  en_transito:  { label: 'En tránsito',   cls: 'text-blue-300 border-blue-500/40 bg-blue-500/10',   pulse: 'pulse', punto: '#3b82f6' },
  en_locutorio: { label: 'En locutorio',  cls: 'text-dorado border-dorado/40 bg-dorado/10',          pulse: 'glow',  punto: '#c9a84c' },
  recogido:     { label: 'Recogido',      cls: 'text-green-300 border-green-500/40 bg-green-500/10', pulse: null,    punto: '#22c55e' },
};

export const TIENDA_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'en_transito', label: 'En Tránsito' },
  { key: 'en_locutorio', label: 'En Locutorio' },
  { key: 'recogido', label: 'Recogidos' },
];

/* ─── Flujo 2: Paquete de Cliente ─── */
export const CLIENTE_CFG = {
  armando:   { label: 'Armando',   cls: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10', pulse: true,  siguiente: { estado: 'enviado',   texto: 'Marcar Enviado' } },
  enviado:   { label: 'Enviado',   cls: 'text-blue-300 border-blue-500/40 bg-blue-500/10',       pulse: false, siguiente: { estado: 'entregado', texto: 'Marcar Entregado' } },
  entregado: { label: 'Entregado', cls: 'text-green-300 border-green-500/40 bg-green-500/10',     pulse: false, siguiente: null },
};

export const CLIENTE_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'armando', label: 'Armando' },
  { key: 'enviado', label: 'Enviados' },
  { key: 'entregado', label: 'Entregados' },
];

/* Pulso animado según tipo (usa keyframes definidos en index.css) */
export const pulseStyle = (tipo) =>
  tipo === 'pulse' ? { animation: 'pulse 2s ease-in-out infinite' }
  : tipo === 'glow' ? { animation: 'pulseGold 2s ease-in-out infinite' }
  : tipo === true   ? { animation: 'pulse 2s ease-in-out infinite' }
  : {};
