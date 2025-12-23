'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, X, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

export const MaintenanceBanner: React.FC = () => {
  const { user } = useAuth();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const config = await api.getSystemConfig();
      setIsMaintenanceMode(config.maintenanceMode || false);
    } catch (error) {
      // Si hay error, asumir que no está en mantenimiento
      setIsMaintenanceMode(false);
    }
  };

  const isAdmin = user && ['owner', 'admin', 'administrador'].includes(user.rol);

  if (!isMaintenanceMode || !isAdmin || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="bg-orange-500/90 backdrop-blur-sm border-b border-orange-400/20 px-4 py-3"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Wrench className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <p className="text-white font-medium text-sm">
                Modo Mantenimiento Activo
              </p>
              <p className="text-orange-100 text-xs">
                Solo los administradores pueden acceder al panel
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.location.href = '/settings'}
              className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-md text-xs transition-colors"
            >
              <Settings className="w-3 h-3" />
              <span>Configurar</span>
            </button>
            
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};