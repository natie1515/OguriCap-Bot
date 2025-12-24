'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Database, 
  HardDrive, 
  MemoryStick, 
  Network, 
  Server, 
  Shield, 
  TrendingUp,
  Zap,
  FileText,
  Bell,
  Settings,
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'

// Componentes UI simples
const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: string, className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === 'secondary' ? 'bg-gray-100 text-gray-800' : 
    variant === 'destructive' ? 'bg-red-100 text-red-800' : 
    'bg-blue-100 text-blue-800'
  } ${className}`}>
    {children}
  </span>
)

const Progress = ({ value = 0, className = '' }: { value?: number, className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
    <div 
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
)

const Tabs = ({ defaultValue, className = '', children }: { defaultValue?: string, className?: string, children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = useState(defaultValue || '')
  return (
    <div className={`w-full ${className}`} data-active-tab={activeTab} data-set-tab={setActiveTab}>
      {children}
    </div>
  )
}

const TabsList = ({ className = '', children }: { className?: string, children: React.ReactNode }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}>
    {children}
  </div>
)

const TabsTrigger = ({ value, children, className = '' }: { value: string, children: React.ReactNode, className?: string }) => {
  const [activeTab, setActiveTab] = useState('')
  
  useEffect(() => {
    const tabsElement = document.querySelector('[data-active-tab]')
    if (tabsElement) {
      const currentTab = tabsElement.getAttribute('data-active-tab')
      setActiveTab(currentTab || '')
    }
  }, [])
  
  const handleClick = () => {
    const tabsElement = document.querySelector('[data-set-tab]')
    if (tabsElement) {
      setActiveTab(value)
      // Trigger re-render of parent
      const event = new CustomEvent('tabChange', { detail: value })
      document.dispatchEvent(event)
    }
  }
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
        activeTab === value 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'hover:bg-white/50'
      } ${className}`}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ value, children, className = '' }: { value: string, children: React.ReactNode, className?: string }) => {
  const [activeTab, setActiveTab] = useState('')
  
  useEffect(() => {
    const handleTabChange = (e: any) => {
      setActiveTab(e.detail)
    }
    
    document.addEventListener('tabChange', handleTabChange)
    return () => document.removeEventListener('tabChange', handleTabChange)
  }, [])
  
  if (activeTab !== value) return null
  
  return (
    <div className={`mt-2 ${className}`}>
      {children}
    </div>
  )
}

interface SystemMetrics {
  cpu: { usage: number; cores: number; loadAverage: number[] }
  memory: { usage: number; total: number; free: number; used: number }
  disk: { usage: number; total: string; used: string; available: string }
  network: { interfaces: number; active: number }
  uptime: number
}

interface SystemStatus {
  isRunning: boolean
  systems: {
    metrics: boolean
    alerts: boolean
    reporting: boolean
    resourceMonitor: boolean
    logManager: boolean
    backupSystem: boolean
    securityMonitor: boolean
  }
}

interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  resolved: boolean
}

interface Report {
  id: string
  type: string
  title: string
  generatedAt: string
  size: number
  status: 'completed' | 'generating' | 'failed'
}

export default function SistemaPage() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [metricsHistory, setMetricsHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSystemData = async () => {
    try {
      setError(null)
      
      // Cargar métricas del sistema
      const metricsRes = await fetch('/api/system/metrics')
      if (metricsRes.ok) {
        const metrics = await metricsRes.json()
        setSystemMetrics(metrics)
      }
      
      // Cargar estado de sistemas
      const statusRes = await fetch('/api/system/status')
      if (statusRes.ok) {
        const status = await statusRes.json()
        setSystemStatus(status)
      }
      
      // Cargar alertas activas
      const alertsRes = await fetch('/api/system/alerts')
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json()
        setAlerts(alertsData.alerts || [])
      }
      
      // Cargar reportes recientes
      const reportsRes = await fetch('/api/system/reports')
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        setReports(reportsData.reports || [])
      }
      
      // Cargar historial de métricas
      const historyRes = await fetch('/api/system/metrics/history?timeRange=3600000') // 1 hora
      if (historyRes.ok) {
        const history = await historyRes.json()
        setMetricsHistory(history.data || [])
      }
      
    } catch (error) {
      console.error('Error cargando datos del sistema:', error)
      setError('Error cargando datos del sistema')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh cada 30 segundos
  useAutoRefresh(loadSystemData, { interval: 30000 })

  const generateReport = async (type: string) => {
    try {
      const response = await fetch('/api/system/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      
      if (response.ok) {
        await loadSystemData() // Recargar datos
      }
    } catch (error) {
      console.error('Error generando reporte:', error)
    }
  }

  const restartSystem = async (systemName: string) => {
    try {
      const response = await fetch(`/api/system/${systemName}/restart`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadSystemData() // Recargar datos
      }
    } catch (error) {
      console.error('Error reiniciando sistema:', error)
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      case 'info': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getSystemStatusColor = (isRunning: boolean) => {
    return isRunning ? 'text-green-500' : 'text-red-500'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Cargando datos del sistema...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema Avanzado</h1>
          <p className="text-muted-foreground">
            Monitoreo y gestión de sistemas en tiempo real
          </p>
        </div>
        <Button onClick={() => loadSystemData()} variant="secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="systems">Sistemas</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemMetrics?.cpu.usage.toFixed(1)}%
                </div>
                <Progress value={systemMetrics?.cpu.usage || 0} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {systemMetrics?.cpu.cores} núcleos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memoria</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemMetrics?.memory.usage.toFixed(1)}%
                </div>
                <Progress value={systemMetrics?.memory.usage || 0} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {formatBytes(systemMetrics?.memory.used || 0)} / {formatBytes(systemMetrics?.memory.total || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disco</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemMetrics?.disk.usage.toFixed(1)}%
                </div>
                <Progress value={systemMetrics?.disk.usage || 0} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {systemMetrics?.disk.used} / {systemMetrics?.disk.total}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatUptime(systemMetrics?.uptime || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Sistema activo
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Estado de sistemas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Estado de Sistemas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {systemStatus && Object.entries(systemStatus.systems).map(([name, isRunning]) => (
                  <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium capitalize">
                      {name.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className={`flex items-center space-x-1 ${getSystemStatusColor(isRunning)}`}>
                      {isRunning ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      <span className="text-xs">{isRunning ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alertas recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Alertas Recientes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay alertas activas
                </p>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                      <Badge variant={alert.resolved ? 'secondary' : 'destructive'}>
                        {alert.resolved ? 'Resuelta' : alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          {/* Gráficos de métricas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU y Memoria (Última hora)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memoria %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uso de Disco</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Area type="monotone" dataKey="disk" stroke="#ffc658" fill="#ffc658" name="Disco %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Métricas detalladas */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas Detalladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Load Average</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">1 min:</span>
                      <span className="text-sm font-mono">
                        {systemMetrics?.cpu.loadAverage[0]?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">5 min:</span>
                      <span className="text-sm font-mono">
                        {systemMetrics?.cpu.loadAverage[1]?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">15 min:</span>
                      <span className="text-sm font-mono">
                        {systemMetrics?.cpu.loadAverage[2]?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Red</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Interfaces:</span>
                      <span className="text-sm font-mono">
                        {systemMetrics?.network.interfaces}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Activas:</span>
                      <span className="text-sm font-mono">
                        {systemMetrics?.network.active}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Sistema</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Plataforma:</span>
                      <span className="text-sm font-mono">{process.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Node.js:</span>
                      <span className="text-sm font-mono">{process.version}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Gestión de Alertas</span>
              </CardTitle>
              <CardDescription>
                Alertas del sistema y configuración de notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full mt-1 ${getSeverityColor(alert.severity)}`} />
                        <div className="flex-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={alert.resolved ? 'secondary' : 'destructive'}>
                        {alert.resolved ? 'Resuelta' : alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {alerts.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">No hay alertas activas</p>
                    <p className="text-muted-foreground">El sistema está funcionando correctamente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Reportes del Sistema</span>
              </CardTitle>
              <CardDescription>
                Generar y descargar reportes del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button onClick={() => generateReport('daily')} variant="secondary">
                    Reporte Diario
                  </Button>
                  <Button onClick={() => generateReport('performance')} variant="secondary">
                    Reporte de Rendimiento
                  </Button>
                  <Button onClick={() => generateReport('security')} variant="secondary">
                    Reporte de Seguridad
                  </Button>
                </div>

                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.generatedAt).toLocaleString()} • {formatBytes(report.size)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={report.status === 'completed' ? 'secondary' : 'default'}>
                          {report.status}
                        </Badge>
                        {report.status === 'completed' && (
                          <Button size="sm" variant="secondary">
                            Descargar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="systems" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Control de Sistemas</span>
              </CardTitle>
              <CardDescription>
                Gestionar y controlar los sistemas del bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {systemStatus && Object.entries(systemStatus.systems).map(([name, isRunning]) => (
                  <div key={name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium capitalize">
                          {name.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <p className={`text-sm ${getSystemStatusColor(isRunning)}`}>
                          {isRunning ? 'Activo' : 'Inactivo'}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => restartSystem(name)}
                      >
                        Reiniciar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configuración del Sistema</span>
              </CardTitle>
              <CardDescription>
                Configurar parámetros y umbrales del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Umbrales de Alertas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">CPU (%)</label>
                      <input 
                        type="number" 
                        className="w-full mt-1 px-3 py-2 border rounded-md" 
                        defaultValue={80}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Memoria (%)</label>
                      <input 
                        type="number" 
                        className="w-full mt-1 px-3 py-2 border rounded-md" 
                        defaultValue={85}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Disco (%)</label>
                      <input 
                        type="number" 
                        className="w-full mt-1 px-3 py-2 border rounded-md" 
                        defaultValue={90}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Intervalos de Monitoreo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Métricas (segundos)</label>
                      <input 
                        type="number" 
                        className="w-full mt-1 px-3 py-2 border rounded-md" 
                        defaultValue={5}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Alertas (segundos)</label>
                      <input 
                        type="number" 
                        className="w-full mt-1 px-3 py-2 border rounded-md" 
                        defaultValue={30}
                      />
                    </div>
                  </div>
                </div>

                <Button>Guardar Configuración</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}