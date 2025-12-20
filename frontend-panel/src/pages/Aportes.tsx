import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  X,
  FileText,
  Image,
  Video,
  Music,
  Radio,
  Zap,
} from 'lucide-react';
import { AnimatedCard, StatCard } from '../components/ui/AnimatedCard';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { AnimatedTableRow } from '../components/ui/AnimatedList';
import { useSocketAportes } from '../hooks/useSocketEvents';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';
import api from '../config/api';

interface Aporte {
  id: number;
  titulo: string;
  descripcion: string;
  contenido: string;
  tipo: string;
  fuente: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  usuario: string;
  fecha_creacion: string;
  grupo_nombre?: string;
  archivo?: string;
}

const Aportes: React.FC = () => {
  const [aportes, setAportes] = useState<Aporte[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [selectedAporte, setSelectedAporte] = useState<Aporte | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Socket.IO para actualizaciones en tiempo real
  const { isConnected: isSocketConnected } = useSocket();
  useSocketAportes();

  useEffect(() => {
    loadAportes();
    loadStats();
  }, [page, estadoFilter, tipoFilter]);

  const loadAportes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (searchTerm) params.append('search', searchTerm);
      if (estadoFilter !== 'all') params.append('estado', estadoFilter);
      if (tipoFilter !== 'all') params.append('tipo', tipoFilter);

      const response = await api.get(`/api/aportes?${params}`);
      setAportes(response.data?.aportes || []);
      setPagination(response.data?.pagination);
    } catch (err) {
      toast.error('Error al cargar aportes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/api/aportes/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats');
    }
  };

  const updateEstado = async (id: number, estado: string, motivo?: string) => {
    try {
      await api.patch(`/api/aportes/${id}/estado`, { estado, motivo_rechazo: motivo });
      setAportes(prev => prev.map(a => a.id === id ? { ...a, estado: estado as any } : a));
      toast.success(`Aporte ${estado}`);
      setSelectedAporte(null);
      loadStats();
    } catch (err) {
      toast.error('Error al actualizar estado');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { class: string; icon: React.ReactNode }> = {
      pendiente: { class: 'badge-warning', icon: <Clock className="w-3 h-3" /> },
      aprobado: { class: 'badge-success', icon: <CheckCircle className="w-3 h-3" /> },
      rechazado: { class: 'badge-danger', icon: <XCircle className="w-3 h-3" /> },
    };
    const c = config[estado] || config.pendiente;
    return (
      <span className={`badge ${c.class}`}>
        {c.icon}
        <span className="ml-1">{estado.charAt(0).toUpperCase() + estado.slice(1)}</span>
      </span>
    );
  };

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, React.ReactNode> = {
      imagen: <Image className="w-4 h-4" />,
      video: <Video className="w-4 h-4" />,
      audio: <Music className="w-4 h-4" />,
      documento: <FileText className="w-4 h-4" />,
    };
    return icons[tipo] || <Package className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold text-white">Gestión de Aportes</h1>
          <p className="text-gray-400 mt-1">Revisa y modera los aportes de la comunidad</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 items-center">
          {/* Indicador de Socket.IO */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            isSocketConnected 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            <Radio className={`w-3 h-3 ${isSocketConnected ? 'animate-pulse' : ''}`} />
            {isSocketConnected ? 'Tiempo Real' : 'Sin conexión'}
          </div>
          <AnimatedButton variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={loadAportes} loading={loading}>
            Actualizar
          </AnimatedButton>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Aportes"
          value={stats?.total || 0}
          icon={<Package className="w-6 h-6" />}
          color="primary"
          delay={0}
        />
        <StatCard
          title="Pendientes"
          value={stats?.pendientes || 0}
          icon={<Clock className="w-6 h-6" />}
          color="warning"
          delay={0.1}
        />
        <StatCard
          title="Aprobados"
          value={stats?.aprobados || 0}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
          delay={0.2}
        />
        <StatCard
          title="Rechazados"
          value={stats?.rechazados || 0}
          icon={<XCircle className="w-6 h-6" />}
          color="danger"
          delay={0.3}
        />
      </div>

      {/* Filters */}
      <AnimatedCard delay={0.2} className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar aportes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadAportes()}
              className="input-search w-full"
            />
          </div>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="input-glass md:w-40">
            <option value="all">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="input-glass md:w-40">
            <option value="all">Todos los tipos</option>
            <option value="imagen">Imágenes</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="documento">Documentos</option>
            <option value="otro">Otros</option>
          </select>
        </div>
      </AnimatedCard>

      {/* Aportes Table */}
      <AnimatedCard delay={0.3} className="overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Lista de Aportes</h2>
          <p className="text-gray-400 text-sm mt-1">{aportes.length} aportes mostrados</p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Cargando aportes...</p>
          </div>
        ) : aportes.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No hay aportes</h3>
            <p className="text-gray-400">No se encontraron aportes con los filtros aplicados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-glass w-full">
              <thead>
                <tr>
                  <th>Aporte</th>
                  <th>Tipo</th>
                  <th>Usuario</th>
                  <th>Grupo</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {aportes.map((aporte, index) => (
                    <AnimatedTableRow key={aporte.id} index={index}>
                      <td>
                        <div className="max-w-xs">
                          <p className="font-medium text-white truncate">{aporte.titulo}</p>
                          <p className="text-xs text-gray-500 truncate">{aporte.descripcion || aporte.contenido}</p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-gray-400">
                          {getTipoIcon(aporte.tipo)}
                          <span className="text-sm capitalize">{aporte.tipo}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-gray-300">{aporte.usuario || '-'}</span>
                      </td>
                      <td>
                        <span className="text-gray-400 text-sm">{aporte.grupo_nombre || aporte.fuente || '-'}</span>
                      </td>
                      <td>{getEstadoBadge(aporte.estado)}</td>
                      <td>
                        <span className="text-gray-400 text-sm">{formatDate(aporte.fecha_creacion)}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelectedAporte(aporte)}
                            className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                          {aporte.estado === 'pendiente' && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateEstado(aporte.id, 'aprobado')}
                                className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateEstado(aporte.id, 'rechazado')}
                                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </AnimatedTableRow>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <AnimatedButton variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Anterior
              </AnimatedButton>
              <AnimatedButton variant="secondary" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                Siguiente
              </AnimatedButton>
            </div>
          </div>
        )}
      </AnimatedCard>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAporte && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedAporte(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal-content p-6 max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Detalle del Aporte</h3>
                <button onClick={() => setSelectedAporte(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Estado</span>
                  {getEstadoBadge(selectedAporte.estado)}
                </div>

                <div className="p-4 rounded-xl bg-white/5">
                  <h4 className="font-medium text-white mb-2">{selectedAporte.titulo}</h4>
                  <p className="text-gray-400 text-sm">{selectedAporte.descripcion}</p>
                </div>

                {selectedAporte.contenido && (
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-gray-400 mb-2">Contenido</p>
                    <p className="text-white whitespace-pre-wrap">{selectedAporte.contenido}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-gray-500">Usuario</p>
                    <p className="text-white">{selectedAporte.usuario || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-gray-500">Tipo</p>
                    <p className="text-white capitalize">{selectedAporte.tipo}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-gray-500">Grupo</p>
                    <p className="text-white">{selectedAporte.grupo_nombre || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-gray-500">Fecha</p>
                    <p className="text-white">{formatDate(selectedAporte.fecha_creacion)}</p>
                  </div>
                </div>

                {selectedAporte.estado === 'pendiente' && (
                  <div className="flex gap-3 pt-4">
                    <AnimatedButton
                      variant="success"
                      fullWidth
                      icon={<ThumbsUp className="w-4 h-4" />}
                      onClick={() => updateEstado(selectedAporte.id, 'aprobado')}
                    >
                      Aprobar
                    </AnimatedButton>
                    <AnimatedButton
                      variant="danger"
                      fullWidth
                      icon={<ThumbsDown className="w-4 h-4" />}
                      onClick={() => updateEstado(selectedAporte.id, 'rechazado')}
                    >
                      Rechazar
                    </AnimatedButton>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Aportes;
