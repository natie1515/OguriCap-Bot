#!/usr/bin/env node

// Script de reporte diario de recursos

import fs from 'fs';
import path from 'path';

const generateDailyReport = async () => {
  try {
    const { default: resourceMonitor } = await import('../../lib/resource-monitor.js');
    
    const stats = resourceMonitor.getStats();
    const history = resourceMonitor.getHistoricalData();
    
    // Calcular estadísticas del día
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const dayData = history.filter(d => d.timestamp > oneDayAgo);
    
    const report = {
      date: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      
      summary: {
        totalDataPoints: dayData.length,
        avgCpu: dayData.reduce((sum, d) => sum + d.cpu, 0) / dayData.length || 0,
        maxCpu: Math.max(...dayData.map(d => d.cpu)) || 0,
        avgMemory: dayData.reduce((sum, d) => sum + d.memory, 0) / dayData.length || 0,
        maxMemory: Math.max(...dayData.map(d => d.memory)) || 0,
        avgDisk: dayData.reduce((sum, d) => sum + d.disk, 0) / dayData.length || 0,
        maxDisk: Math.max(...dayData.map(d => d.disk)) || 0
      },
      
      alerts: stats.alerts,
      thresholds: stats.thresholds,
      
      recommendations: []
    };
    
    // Generar recomendaciones
    if (report.summary.maxCpu > 80) {
      report.recommendations.push('Considerar optimizar procesos con alto uso de CPU');
    }
    
    if (report.summary.maxMemory > 85) {
      report.recommendations.push('Revisar uso de memoria y posibles memory leaks');
    }
    
    if (report.summary.maxDisk > 80) {
      report.recommendations.push('Limpiar espacio en disco y revisar archivos grandes');
    }
    
    // Guardar reporte
    const reportPath = path.join(__dirname, `daily-report-${report.date}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Reporte diario generado: ${reportPath}`);
    
    return report;
  } catch (error) {
    console.error('Error generando reporte diario:', error);
  }
};

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDailyReport();
}

export default generateDailyReport;
