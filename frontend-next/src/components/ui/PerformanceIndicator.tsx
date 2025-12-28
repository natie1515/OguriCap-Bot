'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Clock, TrendingUp } from 'lucide-react';

interface PerformanceIndicatorProps {
  metrics?: {
    tiempoRespuesta: number;
    disponibilidad: number;
    errorRate: number;
    throughput: number;
  };
  className?: string;
}

export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({
  metrics,
  className = ""
}) => {
  const hasMetrics =
    metrics &&
    typeof metrics.tiempoRespuesta === 'number' &&
    typeof metrics.disponibilidad === 'number' &&
    typeof metrics.errorRate === 'number' &&
    typeof metrics.throughput === 'number';

  const safeMetrics = {
    tiempoRespuesta: hasMetrics ? metrics.tiempoRespuesta : 0,
    disponibilidad: hasMetrics ? metrics.disponibilidad : 0,
    errorRate: hasMetrics ? metrics.errorRate : 0,
    throughput: hasMetrics ? metrics.throughput : 0,
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (!hasMetrics) return 'text-gray-400';
    if (value <= thresholds.good) return 'text-emerald-400';
    if (value <= thresholds.warning) return 'text-amber-400';
    return 'text-red-400';
  };

  const getAvailabilityColor = (value: number) => {
    if (!hasMetrics) return 'text-gray-400';
    if (value >= 99) return 'text-emerald-400';
    if (value >= 95) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Response Time */}
      <motion.div
        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors"
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <motion.span
            className={`text-sm font-medium ${getStatusColor(safeMetrics.tiempoRespuesta, { good: 100, warning: 300 })}`}
            animate={{ 
              textShadow: hasMetrics && safeMetrics.tiempoRespuesta <= 100 ? [
                "0 0 5px rgba(16, 185, 129, 0.5)",
                "0 0 10px rgba(16, 185, 129, 0.8)",
                "0 0 5px rgba(16, 185, 129, 0.5)"
              ] : undefined
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {hasMetrics ? `${safeMetrics.tiempoRespuesta}ms` : '—'}
          </motion.span>
        </div>
        <p className="text-xs text-gray-400">Tiempo Respuesta</p>
        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              !hasMetrics ? 'bg-gray-600' :
              safeMetrics.tiempoRespuesta <= 100 ? 'bg-emerald-500' :
              safeMetrics.tiempoRespuesta <= 300 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${hasMetrics ? Math.min((300 - safeMetrics.tiempoRespuesta) / 300 * 100, 100) : 0}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
      </motion.div>

      {/* Availability */}
      <motion.div
        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors"
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-2">
          <Activity className="w-5 h-5 text-gray-400" />
          <motion.span
            className={`text-sm font-medium ${getAvailabilityColor(safeMetrics.disponibilidad)}`}
            animate={{ 
              textShadow: hasMetrics && safeMetrics.disponibilidad >= 99 ? [
                "0 0 5px rgba(16, 185, 129, 0.5)",
                "0 0 10px rgba(16, 185, 129, 0.8)",
                "0 0 5px rgba(16, 185, 129, 0.5)"
              ] : undefined
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {hasMetrics ? `${safeMetrics.disponibilidad.toFixed(1)}%` : '—'}
          </motion.span>
        </div>
        <p className="text-xs text-gray-400">Disponibilidad</p>
        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              !hasMetrics ? 'bg-gray-600' :
              safeMetrics.disponibilidad >= 99 ? 'bg-emerald-500' :
              safeMetrics.disponibilidad >= 95 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${hasMetrics ? safeMetrics.disponibilidad : 0}%` }}
            transition={{ duration: 1, delay: 0.4 }}
          />
        </div>
      </motion.div>

      {/* Error Rate */}
      <motion.div
        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors"
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-2">
          <Zap className="w-5 h-5 text-gray-400" />
          <motion.span
            className={`text-sm font-medium ${getStatusColor(safeMetrics.errorRate, { good: 1, warning: 5 })}`}
            animate={{ 
              textShadow: hasMetrics && safeMetrics.errorRate <= 1 ? [
                "0 0 5px rgba(16, 185, 129, 0.5)",
                "0 0 10px rgba(16, 185, 129, 0.8)",
                "0 0 5px rgba(16, 185, 129, 0.5)"
              ] : undefined
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {hasMetrics ? `${safeMetrics.errorRate.toFixed(1)}%` : '—'}
          </motion.span>
        </div>
        <p className="text-xs text-gray-400">Tasa de Error</p>
        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              !hasMetrics ? 'bg-gray-600' :
              safeMetrics.errorRate <= 1 ? 'bg-emerald-500' :
              safeMetrics.errorRate <= 5 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${hasMetrics ? Math.min(safeMetrics.errorRate * 10, 100) : 0}%` }}
            transition={{ duration: 1, delay: 0.6 }}
          />
        </div>
      </motion.div>

      {/* Throughput */}
      <motion.div
        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/70 transition-colors"
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-2">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          <motion.span
            className={`text-sm font-medium ${hasMetrics ? 'text-cyan-400' : 'text-gray-400'}`}
            animate={{ 
              textShadow: hasMetrics ? [
                "0 0 5px rgba(34, 211, 238, 0.5)",
                "0 0 10px rgba(34, 211, 238, 0.8)",
                "0 0 5px rgba(34, 211, 238, 0.5)"
              ] : undefined
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {hasMetrics ? `${safeMetrics.throughput}/min` : '—'}
          </motion.span>
        </div>
        <p className="text-xs text-gray-400">Throughput</p>
        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${hasMetrics ? 'bg-cyan-500' : 'bg-gray-600'}`}
            initial={{ width: 0 }}
            animate={{ width: `${hasMetrics ? Math.min(safeMetrics.throughput * 2, 100) : 0}%` }}
            transition={{ duration: 1, delay: 0.8 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PerformanceIndicator;
