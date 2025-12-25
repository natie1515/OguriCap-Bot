/**
 * Startup Synchronization
 * Ejecuta sincronización automática al iniciar el sistema
 */

import UserDataSynchronizer from './user-data-synchronizer.js';

class StartupSync {
  constructor() {
    this.synchronizer = new UserDataSynchronizer();
    this.hasRun = false;
  }

  /**
   * Ejecutar sincronización de inicio
   */
  async runStartupSync() {
    if (this.hasRun) {
      console.log('StartupSync: Already executed, skipping...');
      return;
    }

    try {
      console.log('StartupSync: Starting user data synchronization...');
      
      // Esperar un poco para que el sistema se inicialice completamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ejecutar sincronización completa
      const results = await this.synchronizer.performFullSync();
      
      console.log('StartupSync: Synchronization completed successfully');
      console.log('StartupSync Results:', {
        panelUsers: results.panelSync?.synced || 0,
        registros: results.registrosSync?.synced || 0,
        conflicts: results.conflicts?.resolved || 0,
        migrations: results.migration?.migrated || 0
      });
      
      this.hasRun = true;
      
      // Programar sincronización periódica (cada 30 minutos)
      this.schedulePeriodicSync();
      
    } catch (error) {
      console.error('StartupSync: Error during startup synchronization:', error);
      
      // Reintentar en 5 minutos si falla
      setTimeout(() => {
        this.hasRun = false;
        this.runStartupSync();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Programar sincronización periódica
   */
  schedulePeriodicSync() {
    // Sincronización cada 30 minutos
    setInterval(async () => {
      try {
        console.log('StartupSync: Running periodic synchronization...');
        
        // Solo sincronizar datos nuevos, no migrar
        await this.synchronizer.syncPanelWithDatabase();
        await this.synchronizer.syncRegistrosWithDatabase();
        await this.synchronizer.resolveDataConflicts();
        
        console.log('StartupSync: Periodic synchronization completed');
        
      } catch (error) {
        console.error('StartupSync: Error during periodic synchronization:', error);
      }
    }, 30 * 60 * 1000); // 30 minutos
  }

  /**
   * Forzar nueva sincronización
   */
  async forceSyncNow() {
    this.hasRun = false;
    return await this.runStartupSync();
  }

  /**
   * Obtener estado de sincronización
   */
  async getSyncStatus() {
    try {
      const integrity = await this.synchronizer.validateDataIntegrity();
      return {
        hasRun: this.hasRun,
        integrity,
        lastRun: this.hasRun ? new Date().toISOString() : null
      };
    } catch (error) {
      return {
        hasRun: this.hasRun,
        error: error.message,
        lastRun: null
      };
    }
  }
}

// Instancia singleton
const startupSync = new StartupSync();

// Auto-ejecutar cuando se importa el módulo
if (global.db?.data) {
  // Solo ejecutar si la base de datos ya está disponible
  startupSync.runStartupSync();
} else {
  // Esperar a que la base de datos esté disponible
  const checkDatabase = () => {
    if (global.db?.data) {
      startupSync.runStartupSync();
    } else {
      setTimeout(checkDatabase, 1000);
    }
  };
  checkDatabase();
}

export default startupSync;