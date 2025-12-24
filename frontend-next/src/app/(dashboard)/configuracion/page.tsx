'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  History, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  FileText,
  Database,
  Shield,
  Bell,
  Bot,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSocket } from '@/hooks/useSocket';
import toast from 'react-hot-toast';

interface ConfigSection {
  key: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  data: any;
}

interface ConfigVersion {
  id: string;
  timestamp: string;
  userId: string;
  state: string;
  checksum: string;
}

interface ConfigStats {
  totalConfigurations: number;
  currentEnvironment: string;
  totalVersions: number;
  totalBackups: number;
  lastUpdate: string;
}

export default function ConfiguracionPage() {
  const [configurations, setConfigurations] = useState<ConfigSection[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('main');
  const [configData, setConfigData] = useState<any>({});
  const [originalData, setOriginalData] = useState<any>({});
  const [versions, setVersions] = useState<ConfigVersion[]>([]);
  const [stats, setStats] = useState<ConfigStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const socket = useSocket();

  useEffect(() => {
    loadConfigurations();
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedConfig) {
      loadConfiguration(selectedConfig);
      loadVersionHistory(selectedConfig);
    }
  }, [selectedConfig]);

  useEffect(() => {
    // Detectar cambios
    const hasChanges = JSON.stringify(configData) !== JSON.stringify(originalData);
    setHasChanges(hasChanges);
  }, [configData, originalData]);

  useEffect(() => {
    if (!socket) return;

    const handleConfigUpdate = (data: any) => {
      if (data.configKey === selectedConfig) {
        loadConfiguration(selectedConfig);
        toast.success('Configuración actualizada por otro usuario');
      }
    };

    socket.on('config:updated', handleConfigUpdate);

    return () => {
      socket.off('config:updated', handleConfigUpdate);
    };
  }, [socket, selectedConfig]);

  const loadConfigurations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        
        const configSections: ConfigSection[] = [
          {
            key: 'main',
            name: 'Configuración Principal',
            description: 'Configuración general del sistema',
            icon: Settings,
            color: 'blue',
            data: data.main || {}
          },
          {
            key: 'system',
            name: 'Sistema',
            description: 'Configuración del sistema y recursos',
            icon: Database,
            color: 'green',
            data: data.main?.system || {}
          },
          {
            key: 'bot',
            name: 'Bot',
            description: 'Configuración del bot de WhatsApp',
            icon: Bot,
            color: 'purple',
            data: data.main?.bot || {}
          },
          {
            key: 'security',
            name: 'Seguridad',
            description: 'Configuración de seguridad y autenticación',
            icon: Shield,
            color: 'red',
            data: data.main?.security || {}
          },
          {
            key: 'notifications',
            name: 'Notificaciones',
            description: 'Configuración de notificaciones y alertas',
            icon: Bell,
            color: 'yellow',
            data: data.main?.notifications || {}
          }
          // Plugins removidos - funcionalidad simulada
        ];
        
        setConfigurations(configSections);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast.error('Error cargando configuraciones');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfiguration = async (key: string) => {
    try {
      const response = await fetch(`/api/config/${key}`);
      if (response.ok) {
        const data = await response.json();
        setConfigData(data);
        setOriginalData(JSON.parse(JSON.stringify(data)));
        setValidationErrors([]);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast.error('Error cargando configuración');
    }
  };

  const loadVersionHistory = async (key: string) => {
    try {
      const response = await fetch(`/api/config/${key}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Error loading version history:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/config/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/config/${selectedConfig}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });
      
      if (response.ok) {
        const result = await response.json();
        setOriginalData(JSON.parse(JSON.stringify(configData)));
        setHasChanges(false);
        toast.success('Configuración guardada exitosamente');
        
        // Recargar versiones
        loadVersionHistory(selectedConfig);
        loadStats();
      } else {
        const error = await response.json();
        if (error.validationErrors) {
          setValidationErrors(error.validationErrors);
          toast.error('Errores de validación encontrados');
        } else {
          toast.error(error.message || 'Error guardando configuración');
        }
      }
    } catch (error) {
      toast.error('Error guardando configuración');
    } finally {
      setSaving(false);
    }
  };

  const rollbackToVersion = async (versionId: string) => {
    if (!confirm('¿Estás seguro de que quieres hacer rollback a esta versión?')) return;

    try {
      const response = await fetch(`/api/config/${selectedConfig}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId })
      });
      
      if (response.ok) {
        toast.success('Rollback realizado exitosamente');
        loadConfiguration(selectedConfig);
        loadVersionHistory(selectedConfig);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error realizando rollback');
      }
    } catch (error) {
      toast.error('Error realizando rollback');
    }
  };

  const exportConfiguration = async () => {
    try {
      const response = await fetch(`/api/config/${selectedConfig}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `config-${selectedConfig}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Configuración exportada');
      }
    } catch (error) {
      toast.error('Error exportando configuración');
    }
  };

  const importConfiguration = async (file: File) => {
    try {
      const text = await file.text();
      const importedConfig = JSON.parse(text);
      
      const response = await fetch(`/api/config/${selectedConfig}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: importedConfig })
      });
      
      if (response.ok) {
        toast.success('Configuración importada exitosamente');
        loadConfiguration(selectedConfig);
        loadVersionHistory(selectedConfig);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error importando configuración');
      }
    } catch (error) {
      toast.error('Error procesando archivo de configuración');
    }
  };

  const resetConfiguration = () => {
    if (!confirm('¿Estás seguro de que quieres descartar todos los cambios?')) return;
    
    setConfigData(JSON.parse(JSON.stringify(originalData)));
    setValidationErrors([]);
    setHasChanges(false);
    toast.success('Cambios descartados');
  };

  const updateConfigValue = (path: string, value: any) => {
    const newConfig = { ...configData };
    const keys = path.split('.');
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfigData(newConfig);
  };

  const getConfigValue = (path: string) => {
    const keys = path.split('.');
    let current = configData;
    
    for (const key of keys) {
      if (current && typeof current === 'object') {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  };

  const renderConfigEditor = () => {
    if (showJsonEditor) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Editor JSON</h3>
            <Button
              onClick={() => setShowJsonEditor(false)}
              variant="secondary"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Vista Normal
            </Button>
          </div>
          
          <textarea
            value={JSON.stringify(configData, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setConfigData(parsed);
                setValidationErrors([]);
              } catch (error) {
                setValidationErrors(['JSON inválido']);
              }
            }}
            className="w-full h-96 p-4 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm"
            placeholder="Configuración en formato JSON..."
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {selectedConfig === 'main' && renderMainConfigEditor()}
        {selectedConfig === 'system' && renderSystemConfigEditor()}
        {selectedConfig === 'bot' && renderBotConfigEditor()}
        {selectedConfig === 'security' && renderSecurityConfigEditor()}
        {selectedConfig === 'notifications' && renderNotificationsConfigEditor()}
        {/* Plugins removidos - funcionalidad simulada */}
      </div>
    );
  };

  const renderMainConfigEditor = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Información General</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Versión
          </label>
          <input
            type="text"
            value={getConfigValue('version') || ''}
            onChange={(e) => updateConfigValue('version', e.target.value)}
            className="input-glass"
            placeholder="1.0.0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ambiente
          </label>
          <select
            value={getConfigValue('environment') || ''}
            onChange={(e) => updateConfigValue('environment', e.target.value)}
            className="input-glass"
          >
            <option value="development">Desarrollo</option>
            <option value="staging">Staging</option>
            <option value="production">Producción</option>
            <option value="testing">Testing</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSystemConfigEditor = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Configuración del Sistema</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nombre del Sistema
          </label>
          <input
            type="text"
            value={getConfigValue('name') || ''}
            onChange={(e) => updateConfigValue('name', e.target.value)}
            className="input-glass"
            placeholder="WhatsApp Bot Panel"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Memoria Máxima
          </label>
          <input
            type="text"
            value={getConfigValue('maxMemory') || ''}
            onChange={(e) => updateConfigValue('maxMemory', e.target.value)}
            className="input-glass"
            placeholder="512MB"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nivel de Log
          </label>
          <select
            value={getConfigValue('logLevel') || ''}
            onChange={(e) => updateConfigValue('logLevel', e.target.value)}
            className="input-glass"
          >
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="debug"
            checked={getConfigValue('debug') || false}
            onChange={(e) => updateConfigValue('debug', e.target.checked)}
            className="rounded border-gray-600 bg-gray-700 text-primary-500"
          />
          <label htmlFor="debug" className="text-sm text-gray-300">
            Modo Debug
          </label>
        </div>
      </div>
    </div>
  );

  const renderBotConfigEditor = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Configuración del Bot</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nombre del Bot
          </label>
          <input
            type="text"
            value={getConfigValue('name') || ''}
            onChange={(e) => updateConfigValue('name', e.target.value)}
            className="input-glass"
            placeholder="Oguri Bot"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Prefijo de Comandos
          </label>
          <input
            type="text"
            value={getConfigValue('prefix') || ''}
            onChange={(e) => updateConfigValue('prefix', e.target.value)}
            className="input-glass"
            placeholder="#"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cooldown de Comandos (ms)
          </label>
          <input
            type="number"
            value={getConfigValue('commandCooldown') || ''}
            onChange={(e) => updateConfigValue('commandCooldown', parseInt(e.target.value))}
            className="input-glass"
            placeholder="3000"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Máximo de Reintentos
          </label>
          <input
            type="number"
            value={getConfigValue('maxRetries') || ''}
            onChange={(e) => updateConfigValue('maxRetries', parseInt(e.target.value))}
            className="input-glass"
            placeholder="5"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoReconnect"
              checked={getConfigValue('autoReconnect') || false}
              onChange={(e) => updateConfigValue('autoReconnect', e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-primary-500"
            />
            <label htmlFor="autoReconnect" className="text-sm text-gray-300">
              Reconexión Automática
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="globallyEnabled"
              checked={getConfigValue('globallyEnabled') || false}
              onChange={(e) => updateConfigValue('globallyEnabled', e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-primary-500"
            />
            <label htmlFor="globallyEnabled" className="text-sm text-gray-300">
              Habilitado Globalmente
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityConfigEditor = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Configuración de Seguridad</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Requests por Minuto
          </label>
          <input
            type="number"
            value={getConfigValue('maxRequestsPerMinute') || ''}
            onChange={(e) => updateConfigValue('maxRequestsPerMinute', parseInt(e.target.value))}
            className="input-glass"
            placeholder="100"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Timeout de Sesión (ms)
          </label>
          <input
            type="number"
            value={getConfigValue('sessionTimeout') || ''}
            onChange={(e) => updateConfigValue('sessionTimeout', parseInt(e.target.value))}
            className="input-glass"
            placeholder="86400000"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableRateLimit"
              checked={getConfigValue('enableRateLimit') || false}
              onChange={(e) => updateConfigValue('enableRateLimit', e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-primary-500"
            />
            <label htmlFor="enableRateLimit" className="text-sm text-gray-300">
              Habilitar Rate Limiting
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableIPBlocking"
              checked={getConfigValue('enableIPBlocking') || false}
              onChange={(e) => updateConfigValue('enableIPBlocking', e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-primary-500"
            />
            <label htmlFor="enableIPBlocking" className="text-sm text-gray-300">
              Habilitar Bloqueo de IPs
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableAuditLog"
              checked={getConfigValue('enableAuditLog') || false}
              onChange={(e) => updateConfigValue('enableAuditLog', e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-primary-500"
            />
            <label htmlFor="enableAuditLog" className="text-sm text-gray-300">
              Habilitar Log de Auditoría
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsConfigEditor = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Configuración de Notificaciones</h3>
      
      {/* Email */}
      <div className="glass-card p-4">
        <h4 className="font-medium text-white mb-4">Email</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="emailEnabled"
              checked={getConfigValue('email.enabled') || false}
              onChange={(e) => updateConfigValue('email.enabled', e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-primary-500"
            />
            <label htmlFor="emailEnabled" className="text-sm text-gray-300">
              Habilitar Email
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Host SMTP
            </label>
            <input
              type="text"
              value={getConfigValue('email.smtp.host') || ''}
              onChange={(e) => updateConfigValue('email.smtp.host', e.target.value)}
              className="input-glass"
              placeholder="smtp.gmail.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Puerto SMTP
            </label>
            <input
              type="number"
              value={getConfigValue('email.smtp.port') || ''}
              onChange={(e) => updateConfigValue('email.smtp.port', parseInt(e.target.value))}
              className="input-glass"
              placeholder="587"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="smtpSecure"
              checked={getConfigValue('email.smtp.secure') || false}
              onChange={(e) => updateConfigValue('email.smtp.secure', e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-primary-500"
            />
            <label htmlFor="smtpSecure" className="text-sm text-gray-300">
              Conexión Segura
            </label>
          </div>
        </div>
      </div>
      
      {/* WhatsApp */}
      <div className="glass-card p-4">
        <h4 className="font-medium text-white mb-4">WhatsApp</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="whatsappEnabled"
              checked={getConfigValue('whatsapp.enabled') || false}
              onChange={(e) => updateConfigValue('whatsapp.enabled', e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-primary-500"
            />
            <label htmlFor="whatsappEnabled" className="text-sm text-gray-300">
              Habilitar WhatsApp
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Números de Admin (separados por coma)
            </label>
            <input
              type="text"
              value={(getConfigValue('whatsapp.adminNumbers') || []).join(', ')}
              onChange={(e) => updateConfigValue('whatsapp.adminNumbers', e.target.value.split(',').map(n => n.trim()))}
              className="input-glass"
              placeholder="1234567890, 0987654321"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Función renderPluginsConfigEditor removida - funcionalidad simulada

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración Avanzada</h1>
          <p className="text-gray-400">Gestiona la configuración del sistema con versionado y rollback</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowVersions(!showVersions)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            {showVersions ? 'Ocultar' : 'Ver'} Historial
          </Button>
          
          <Button
            onClick={exportConfiguration}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          
          <label className="cursor-pointer">
            <input
              id="import-input"
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importConfiguration(file);
              }}
              className="hidden"
            />
            <Button
              variant="secondary"
              className="flex items-center gap-2"
              onClick={() => document.getElementById('import-input')?.click()}
            >
              <Upload className="w-4 h-4" />
              Importar
            </Button>
          </label>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Configuraciones</p>
                <p className="text-xl font-bold text-white">{stats.totalConfigurations}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Database className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Ambiente</p>
                <p className="text-lg font-bold text-white capitalize">{stats.currentEnvironment}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <History className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Versiones</p>
                <p className="text-xl font-bold text-white">{stats.totalVersions}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <FileText className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Backups</p>
                <p className="text-xl font-bold text-white">{stats.totalBackups}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de configuraciones */}
        <div className="lg:col-span-1">
          <div className="glass-card p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Secciones</h2>
            <div className="space-y-2">
              {configurations.map((config) => {
                const Icon = config.icon;
                return (
                  <button
                    key={config.key}
                    onClick={() => setSelectedConfig(config.key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedConfig === config.key
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">{config.name}</p>
                      <p className="text-xs opacity-70">{config.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editor principal */}
        <div className="lg:col-span-3">
          <div className="glass-card">
            {/* Header del editor */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">
                    {configurations.find(c => c.key === selectedConfig)?.name || 'Configuración'}
                  </h2>
                  {hasChanges && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                      Cambios sin guardar
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowJsonEditor(!showJsonEditor)}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    {showJsonEditor ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    JSON
                  </Button>
                  
                  {hasChanges && (
                    <Button
                      onClick={resetConfiguration}
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Descartar
                    </Button>
                  )}
                  
                  <Button
                    onClick={saveConfiguration}
                    loading={isSaving}
                    disabled={!hasChanges}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Guardar
                  </Button>
                </div>
              </div>
            </div>

            {/* Errores de validación */}
            {validationErrors.length > 0 && (
              <div className="p-4 bg-red-500/10 border-b border-red-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">Errores de validación:</p>
                    <ul className="mt-1 text-sm text-red-300">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Contenido del editor */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              ) : (
                renderConfigEditor()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historial de versiones */}
      <AnimatePresence>
        {showVersions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card"
          >
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">
                Historial de Versiones - {selectedConfig}
              </h2>
            </div>
            
            <div className="divide-y divide-white/5">
              {versions.length === 0 ? (
                <div className="p-8 text-center">
                  <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No hay versiones registradas</p>
                </div>
              ) : (
                versions.map((version) => (
                  <div key={version.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          version.state === 'active' ? 'bg-green-400' :
                          version.state === 'rollback' ? 'bg-yellow-400' :
                          'bg-gray-400'
                        }`} />
                        <div>
                          <p className="font-medium text-white">
                            Versión {version.id.substring(0, 8)}
                          </p>
                          <p className="text-sm text-gray-400">
                            {new Date(version.timestamp).toLocaleString()} por {version.userId}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          version.state === 'active' ? 'bg-green-500/20 text-green-400' :
                          version.state === 'rollback' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {version.state}
                        </span>
                        
                        <Button
                          onClick={() => rollbackToVersion(version.id)}
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Rollback
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}