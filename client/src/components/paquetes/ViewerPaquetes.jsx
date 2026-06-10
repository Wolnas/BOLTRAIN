import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { misPedidos } from '../../api/paquetes';
import { PageWrapper, Spinner, VacioEstado, staggerContainer } from '../dashboard/ui';
import TimelinePedido from './TimelinePedido';
import toast from 'react-hot-toast';

/* Vista del cliente: sólo SUS pedidos y su estado. Sin locutorio,
   precios, notas internas ni otros clientes. */
export default function ViewerPaquetes() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await misPedidos();
      setPedidos(data.pedidos);
    } catch {
      toast.error('Error cargando tus pedidos');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <PageWrapper className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-crema">Mis Pedidos</h1>
        <p className="font-body text-sm text-crema/50 mt-0.5">Sigue el estado de tus compras desde España hasta Bolivia</p>
      </div>

      {cargando ? (
        <Spinner />
      ) : pedidos.length === 0 ? (
        <VacioEstado icono={<Package size={48} strokeWidth={1} />} titulo="Sin pedidos" texto="Aún no tienes pedidos en camino." />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
          {pedidos.map((p) => <TimelinePedido key={p.id} pedido={p} />)}
        </motion.div>
      )}
    </PageWrapper>
  );
}
