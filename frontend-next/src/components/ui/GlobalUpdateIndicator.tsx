'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, WifiOff, CheckCircle, AlertCircle, Activity, 
  Zap, Radio, Signal, Loader2, Bot, Shield, 
  Cpu, Database, Globe, RefreshCw 
} from 'lucide-react';
import { useGlobalUpdate } from '@/contexts/GlobalUpdateContext';
import { useBotGlobalState } from '@/contexts/BotGlobalStateContext';
import { useSocket } from '@/contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const GlobalUpdateIndicator: React.FC = () => {
  const { isRefreshing, lastUpdate, dashboardStats } = useGlobalUpdate();
  const { isGloballyOn } = useBotGlobalState();
  const { isConnected } = useSocket();

  const getSystemStatus = () => {
    if (!isGloballyOn) return 'critical';
    if (!isConnected) return 'warning';
    if (isRefreshing) return 'updating';
    return 'healthy';
  };

  const getStatusConfig = () => {
    const status = getSystemStatus();
    
    const configs = {
      healthy: {
        color: 'from-emerald-500 to-teal-600',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30',
        textColor: 'text-emerald-400',
        icon: <CheckCircle className="w-4 h-4" />,
        pulse: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
        title: 'Sistema Operativo',
        subtitle: 'Todo funcionando correctamente'
      },
      warning: {
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        textColor: 'text-amber-400',
        icon: <WifiOff className="w-4 h-4" />,
        pulse: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
        title: 'Conexión Limitada',
        subtitle: 'Bot desconectado de WhatsApp'
      },
      critical: {
        color: 'from-red-500 to-rose-600',
        bgColor: 'bg-red-500/10 border-red-500/30',
        textColor: 'text-red-400',
        icon: <AlertCircle className="w-4 h-4" />,
        pulse: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
        title: 'Sistema Desactivado',
        subtitle: 'Bot desactivado globalmente'
      },
      updating: {
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-500/10 border-blue-500/30',
        textColor: 'text-blue-400',
        icon: <RefreshCw className="w-4 h-4 animate-spin" />,
        pulse: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
        title: 'Sincronizando',
        subtitle: 'Actualizando datos en tiempo real'
      }
    };
    
    return configs[status];
  };

  const config = getStatusConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed top-4 right-4 z-50"
    >
      <motion.div
        animate={{ 
          boxShadow: isRefreshing ? config.pulse : 'none',
        }}
        transition={{ repeat: isRefreshing ? Infinity : 0, duration: 2 }}
        className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl ${config.bgColor}`}
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-5`} />
        
        {/* Animated Border */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${config.textColor.replace('text-', 'rgb(')}, transparent)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'xor',
            padding: '1px'
          }}
        />
        
        <div className="relative p-4 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              animate={{ 
                rotate: isRefreshing ? 360 : 0,
                scale: isRefreshing ? [1, 1.1, 1] : 1
              }}
              transition={{ 
                rotate: { duration: 2, repeat: isRefreshing ? Infinity : 0, ease: "linear" },
                scale: { duration: 1, repeat: isRefreshing ? Infinity : 0 }
              }}
              className={`p-2 rounded-xl bg-gradient-to-br ${config.color} shadow-lg`}
            >
              <Bot className="w-5 h-5 text-white" />
            </motion.div>
            
            <div className="flex-1">
              <h3 className={`font-semibold text-sm ${config.textColor}`}>
                {config.title}
              </h3>
              <p className="text-xs text-gray-400">
                {config.subtitle}
              </p>
            </div>
            
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`${config.textColor}`}
            >
              {config.icon}
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded-lg bg-white/5">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Globe className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Grupos</span>
              </div>
              <span className="text-sm font-bold text-white">
                {dashboardStats?.totalGrupos || 0}
              </span>
            </div>
            
            <div className="text-center p-2 rounded-lg bg-white/5">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">SubBots</span>
              </div>
              <span className="text-sm font-bold text-white">
                {dashboardStats?.totalSubbots || 0}
              </span>
            </div>
            
            <div className="text-center p-2 rounded-lg bg-white/5">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Activos</span>
              </div>
              <span className="text-sm font-bold text-white">
                {dashboardStats?.comunidad?.usuariosActivos || 0}
              </span>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {isConnected ? (
                  <Signal className="w-4 h-4 text-emerald-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
              </motion.div>
              <span className="text-xs text-gray-300">
                Socket.IO {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            
            <AnimatePresence>
              {isRefreshing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="flex items-center gap-1"
                >
                  <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                  <span className="text-xs text-blue-400">Sync</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-center"
            >
              <span className="text-xs text-gray-500">
                Última actualización: {formatDistanceToNow(lastUpdate, { locale: es, addSuffix: true })}
              </span>
            </motion.div>
          )}

          {/* Pulse Animation */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${config.color} pointer-events-none`}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export const MiniUpdateIndicator: React.FC = () => {
  const { isRefreshing } = useGlobalUpdate();
  const { isGloballyOn } = useBotGlobalState();
  const { isConnected } = useSocket();

  const getStatusConfig = () => {
    if (!isGloballyOn) return {
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-500/20 border-red-500/30',
      textColor: 'text-red-400',
      icon: <Shield className="w-3 h-3" />,
      text: 'Desactivado'
    };
    
    if (!isConnected) return {
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-500/20 border-amber-500/30',
      textColor: 'text-amber-400',
      icon: <WifiOff className="w-3 h-3" />,
      text: 'Sin Conexión'
    };
    
    return {
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-500/20 border-emerald-500/30',
      textColor: 'text-emerald-400',
      icon: <CheckCircle className="w-3 h-3" />,
      text: 'Operativo'
    };
  };

  const config = getStatusConfig();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative overflow-hidden flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium border backdrop-blur-sm ${config.bgColor}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-10`} />
      
      <motion.div
        animate={{ 
          rotate: isRefreshing ? 360 : 0,
          scale: isRefreshing ? [1, 1.2, 1] : 1
        }}
        transition={{ 
          rotate: { duration: 2, repeat: isRefreshing ? Infinity : 0, ease: "linear" },
          scale: { duration: 1, repeat: isRefreshing ? Infinity : 0 }
        }}
        className="relative z-10"
      >
        {config.icon}
      </motion.div>
      
      <span className={`relative z-10 hidden sm:inline ${config.textColor}`}>
        {config.text}
      </span>
      
      {isRefreshing && (
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-1 h-1 rounded-full bg-current opacity-60"
        />
      )}
    </motion.div>
  );
};