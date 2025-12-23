import { useEffect, useState, useCallback } from 'react';
import { useGlobalUpdate } from '@/contexts/GlobalUpdateContext';
import { useBotGlobalState } from '@/contexts/BotGlobalStateContext';
import { useSocket } from '@/contexts/SocketContext';

interface UseAutoRefreshOptions {
  interval?: number; // Intervalo en milisegundos
  dependencies?: any[]; // Dependencias que triggean refresh
  enabled?: boolean; // Si está habilitado el auto-refresh
}

export const useAutoRefresh = (
  refreshFunction: () => Promise<void> | void,
  options: UseAutoRefreshOptions = {}
) => {
  const { interval = 30000, dependencies = [], enabled = true } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const { isGloballyOn } = useBotGlobalState();
  const { isConnected } = useSocket();
  const { lastUpdate } = useGlobalUpdate();

  const refresh = useCallback(async () => {
    if (isRefreshing || !enabled) return;
    
    setIsRefreshing(true);
    try {
      await refreshFunction();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error in auto-refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshFunction, isRefreshing, enabled]);

  // Auto-refresh cuando cambian las dependencias
  useEffect(() => {
    if (enabled) {
      refresh();
    }
  }, [isGloballyOn, isConnected, ...dependencies]);

  // Auto-refresh periódico (solo como respaldo si no hay Socket.IO)
  useEffect(() => {
    if (!enabled || !interval) return;
    
    // Si hay conexión Socket.IO, usar intervalos más largos como respaldo
    const actualInterval = isConnected ? interval * 3 : interval;

    const intervalId = setInterval(() => {
      if (!isRefreshing) {
        if (!isConnected) {
          console.log('🔄 Fallback refresh - Socket.IO no disponible');
        }
        refresh();
      }
    }, actualInterval);

    return () => clearInterval(intervalId);
  }, [refresh, interval, enabled, isRefreshing, isConnected]);

  // Auto-refresh cuando se actualiza el contexto global
  useEffect(() => {
    if (enabled && lastUpdate) {
      refresh();
    }
  }, [lastUpdate, enabled, refresh]);

  // Escuchar eventos personalizados
  useEffect(() => {
    if (!enabled) return;

    const handleForceRefresh = () => refresh();
    const handleGlobalUpdate = () => refresh();

    window.addEventListener('forceGlobalUpdate', handleForceRefresh);
    window.addEventListener('globalDataUpdated', handleGlobalUpdate);

    return () => {
      window.removeEventListener('forceGlobalUpdate', handleForceRefresh);
      window.removeEventListener('globalDataUpdated', handleGlobalUpdate);
    };
  }, [refresh, enabled]);

  return {
    refresh,
    isRefreshing,
    lastRefresh,
  };
};

// Hook específico para componentes que muestran estadísticas
export const useStatsAutoRefresh = (
  refreshFunction: () => Promise<void> | void,
  interval: number = 15000
) => {
  return useAutoRefresh(refreshFunction, {
    interval,
    dependencies: [], // Las estadísticas se actualizan con el contexto global
  });
};

// Hook específico para listas de datos
export const useListAutoRefresh = (
  refreshFunction: () => Promise<void> | void,
  dependencies: any[] = [],
  interval: number = 30000
) => {
  return useAutoRefresh(refreshFunction, {
    interval,
    dependencies,
  });
};

// Hook para forzar actualización global
export const useForceGlobalUpdate = () => {
  const forceUpdate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('forceGlobalUpdate'));
  }, []);

  return { forceUpdate };
};