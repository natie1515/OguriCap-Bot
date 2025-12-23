'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function MaintenancePage() {
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (response.ok && !data.maintenanceMode) {
        // El mantenimiento terminó, redirigir al dashboard
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Verificar cada 30 segundos si el mantenimiento terminó
  useEffect(() => {
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center"
        >
          {/* Icono animado */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6 bg-orange-500/20 rounded-full flex items-center justify-center"
          >
            <Wrench className="w-8 h-8 text-orange-400" />
          </motion.div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white mb-4">
            Sistema en Mantenimiento
          </h1>

          {/* Descripción */}
          <p className="text-gray-300 mb-6 leading-relaxed">
            Estamos realizando mejoras en el sistema para brindarte una mejor experiencia. 
            El servicio estará disponible nuevamente en breve.
          </p>

          {/* Información adicional */}
          <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center text-gray-400 mb-2">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm">Tiempo estimado: Unos minutos</span>
            </div>
            <div className="flex items-center justify-center text-gray-400">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="text-sm">Disculpa las molestias</span>
            </div>
          </div>

          {/* Botón de verificar */}
          <Button
            onClick={checkStatus}
            disabled={isChecking}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Verificar Estado
              </>
            )}
          </Button>

          {/* Footer */}
          <p className="text-xs text-gray-500 mt-6">
            © 2025 Oguri Bot Panel - Sistema de Gestión
          </p>
        </motion.div>
      </div>
    </div>
  );
}