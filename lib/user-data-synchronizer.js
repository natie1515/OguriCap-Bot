/**
 * User Data Synchronizer
 * Unifica y sincroniza datos de usuarios entre diferentes sistemas:
 * - global.db.data.panel.users (Panel web users)
 * - global.db.data.panel.registros (WhatsApp registrations)
 * - Database class db.data.usuarios (JWT system)
 */

import Database from './database.js';
import bcrypt from 'bcryptjs';
import configManager from './config-manager.js';

class UserDataSynchronizer {
  constructor() {
    this.db = new Database('./database.json');
    this.auditLogs = [];
  }

  /**
   * Obtener configuración
   */
  getConfig() {
    return configManager.getConfig('main');
  }

  /**
   * Sincronizar panel.users con db.data.usuarios (Database class)
   */
  async syncPanelWithDatabase() {
    try {
      if (!global.db?.data?.panel?.users) {
        console.log('UserDataSynchronizer: No panel users found to sync');
        return { synced: 0, errors: 0 };
      }

      const panelUsers = global.db.data.panel.users;
      const jwtUsers = this.db.data.usuarios || {};
      
      let syncedCount = 0;
      let errorCount = 0;

      for (const [panelId, panelUser] of Object.entries(panelUsers)) {
        try {
          // Buscar usuario existente en JWT system por username
          const existingJwtUser = Object.values(jwtUsers).find(u => u.username === panelUser.username);
          
          if (existingJwtUser) {
            // Actualizar datos existentes
            await this.mergeUserData(existingJwtUser, panelUser, 'panel');
            syncedCount++;
          } else {
            // Crear nuevo usuario en JWT system
            await this.createJwtUserFromPanel(panelUser);
            syncedCount++;
          }

          this.auditLogs.push({
            action: 'sync_panel_to_jwt',
            username: panelUser.username,
            timestamp: new Date().toISOString(),
            success: true
          });

        } catch (error) {
          console.error(`Error syncing panel user ${panelUser.username}:`, error);
          errorCount++;
          
          this.auditLogs.push({
            action: 'sync_panel_to_jwt',
            username: panelUser.username,
            timestamp: new Date().toISOString(),
            success: false,
            error: error.message
          });
        }
      }

      console.log(`UserDataSynchronizer: Synced ${syncedCount} panel users, ${errorCount} errors`);
      return { synced: syncedCount, errors: errorCount };

    } catch (error) {
      console.error('UserDataSynchronizer: Error in syncPanelWithDatabase:', error);
      throw error;
    }
  }

  /**
   * Sincronizar panel.registros con db.data.usuarios
   */
  async syncRegistrosWithDatabase() {
    try {
      if (!global.db?.data?.panel?.registros) {
        console.log('UserDataSynchronizer: No registros found to sync');
        return { synced: 0, errors: 0 };
      }

      const registros = global.db.data.panel.registros;
      const jwtUsers = this.db.data.usuarios || {};
      
      let syncedCount = 0;
      let errorCount = 0;

      for (const [regId, registro] of Object.entries(registros)) {
        try {
          // Buscar usuario existente en JWT system por username
          const existingJwtUser = Object.values(jwtUsers).find(u => u.username === registro.username);
          
          if (existingJwtUser) {
            // Actualizar datos existentes
            await this.mergeUserData(existingJwtUser, registro, 'whatsapp');
            syncedCount++;
          } else {
            // Crear nuevo usuario en JWT system
            await this.createJwtUserFromRegistro(registro);
            syncedCount++;
          }

          this.auditLogs.push({
            action: 'sync_registro_to_jwt',
            username: registro.username,
            timestamp: new Date().toISOString(),
            success: true
          });

        } catch (error) {
          console.error(`Error syncing registro ${registro.username}:`, error);
          errorCount++;
          
          this.auditLogs.push({
            action: 'sync_registro_to_jwt',
            username: registro.username,
            timestamp: new Date().toISOString(),
            success: false,
            error: error.message
          });
        }
      }

      console.log(`UserDataSynchronizer: Synced ${syncedCount} registros, ${errorCount} errors`);
      return { synced: syncedCount, errors: errorCount };

    } catch (error) {
      console.error('UserDataSynchronizer: Error in syncRegistrosWithDatabase:', error);
      throw error;
    }
  }

  /**
   * Crear usuario JWT desde panel user
   */
  async createJwtUserFromPanel(panelUser) {
    const config = this.getConfig();
    const bcryptRounds = config?.security?.bcryptRounds || 10;
    
    // Generar contraseña por defecto si no existe
    let hashedPassword = null;
    if (panelUser.password) {
      // Si ya tiene contraseña, asumimos que está en texto plano y la hasheamos
      hashedPassword = await bcrypt.hash(panelUser.password, bcryptRounds);
    } else {
      // Generar contraseña temporal
      const tempPassword = 'panel' + Math.random().toString(36).substring(2, 8);
      hashedPassword = await bcrypt.hash(tempPassword, bcryptRounds);
      
      // Actualizar panel user con contraseña temporal
      panelUser.temp_password = tempPassword;
      panelUser.require_password_change = true;
    }

    // Generar nuevo ID para JWT system
    const jwtUsers = this.db.data.usuarios || {};
    const userIds = Object.keys(jwtUsers).map(id => parseInt(id)).filter(id => !isNaN(id));
    const newId = userIds.length > 0 ? Math.max(...userIds) + 1 : 1;

    // Crear usuario en JWT system
    if (!this.db.data.usuarios) this.db.data.usuarios = {};
    this.db.data.usuarios[newId] = {
      id: newId,
      username: panelUser.username,
      password: hashedPassword,
      rol: panelUser.rol || 'usuario',
      whatsapp_number: panelUser.whatsapp_number || null,
      email: panelUser.email || null,
      nombre: panelUser.nombre || panelUser.username,
      fecha_registro: panelUser.fecha_registro || new Date().toISOString(),
      activo: panelUser.activo !== false,
      source: 'panel',
      synced_at: new Date().toISOString(),
      
      // Password management
      temp_password: panelUser.temp_password || null,
      temp_password_expires: panelUser.temp_password ? 
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
      temp_password_used: false,
      require_password_change: panelUser.require_password_change || false,
      
      // Login tracking
      last_login: panelUser.last_login || null,
      login_ip: panelUser.login_ip || null,
      login_count: 0
    };

    // Guardar cambios
    this.db.save();
    
    console.log(`Created JWT user from panel: ${panelUser.username}`);
  }

  /**
   * Crear usuario JWT desde registro WhatsApp
   */
  async createJwtUserFromRegistro(registro) {
    const config = this.getConfig();
    const bcryptRounds = config?.security?.bcryptRounds || 10;
    
    // Usar contraseña temporal del registro o generar una nueva
    let tempPassword = registro.temp_password;
    if (!tempPassword) {
      tempPassword = 'wa' + Math.random().toString(36).substring(2, 8);
      registro.temp_password = tempPassword;
    }
    
    const hashedPassword = await bcrypt.hash(tempPassword, bcryptRounds);

    // Generar nuevo ID para JWT system
    const jwtUsers = this.db.data.usuarios || {};
    const userIds = Object.keys(jwtUsers).map(id => parseInt(id)).filter(id => !isNaN(id));
    const newId = userIds.length > 0 ? Math.max(...userIds) + 1 : 1;

    // Crear usuario en JWT system
    if (!this.db.data.usuarios) this.db.data.usuarios = {};
    this.db.data.usuarios[newId] = {
      id: newId,
      username: registro.username,
      password: hashedPassword,
      rol: registro.rol || 'usuario',
      whatsapp_number: registro.wa_jid || registro.wa_number || null,
      email: null,
      nombre: registro.nombre || registro.username,
      fecha_registro: registro.fecha_registro || new Date().toISOString(),
      activo: registro.activo !== false,
      source: 'whatsapp',
      synced_at: new Date().toISOString(),
      
      // Password management
      temp_password: tempPassword,
      temp_password_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      temp_password_used: registro.temp_password_used || false,
      require_password_change: true,
      
      // Login tracking
      last_login: null,
      login_ip: null,
      login_count: 0,
      
      // WhatsApp specific
      grupo_registro: registro.grupo_registro || null
    };

    // Guardar cambios
    this.db.save();
    
    console.log(`Created JWT user from registro: ${registro.username}`);
  }

  /**
   * Fusionar datos de usuario entre sistemas
   */
  async mergeUserData(jwtUser, sourceUser, source) {
    let hasChanges = false;

    // Actualizar campos básicos si están vacíos o son más recientes
    if (sourceUser.whatsapp_number && !jwtUser.whatsapp_number) {
      jwtUser.whatsapp_number = sourceUser.whatsapp_number;
      hasChanges = true;
    }

    if (sourceUser.email && !jwtUser.email) {
      jwtUser.email = sourceUser.email;
      hasChanges = true;
    }

    if (sourceUser.nombre && (!jwtUser.nombre || jwtUser.nombre === jwtUser.username)) {
      jwtUser.nombre = sourceUser.nombre;
      hasChanges = true;
    }

    // Actualizar rol si es más privilegiado
    const roleHierarchy = { owner: 4, admin: 3, administrador: 3, moderador: 2, usuario: 1 };
    const currentLevel = roleHierarchy[jwtUser.rol] || 1;
    const sourceLevel = roleHierarchy[sourceUser.rol] || 1;
    
    if (sourceLevel > currentLevel) {
      jwtUser.rol = sourceUser.rol;
      hasChanges = true;
    }

    // Actualizar contraseña temporal si existe y es más reciente
    if (sourceUser.temp_password && !jwtUser.temp_password_used) {
      const config = this.getConfig();
      const bcryptRounds = config?.security?.bcryptRounds || 10;
      
      jwtUser.password = await bcrypt.hash(sourceUser.temp_password, bcryptRounds);
      jwtUser.temp_password = sourceUser.temp_password;
      jwtUser.temp_password_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      jwtUser.temp_password_used = false;
      jwtUser.require_password_change = true;
      hasChanges = true;
    }

    // Actualizar timestamp de sincronización
    if (hasChanges) {
      jwtUser.synced_at = new Date().toISOString();
      jwtUser.source = jwtUser.source || source;
      
      // Guardar cambios
      this.db.save();
      
      console.log(`Merged user data for ${jwtUser.username} from ${source}`);
    }
  }

  /**
   * Resolver conflictos de datos automáticamente
   */
  async resolveDataConflicts() {
    const conflicts = await this.detectConflicts();
    let resolvedCount = 0;

    for (const conflict of conflicts) {
      try {
        await this.applyConflictResolution(conflict);
        resolvedCount++;
        
        this.auditLogs.push({
          action: 'resolve_conflict',
          type: conflict.type,
          username: conflict.username,
          resolution: conflict.resolution,
          timestamp: new Date().toISOString(),
          success: true
        });
        
      } catch (error) {
        console.error(`Error resolving conflict for ${conflict.username}:`, error);
        
        this.auditLogs.push({
          action: 'resolve_conflict',
          type: conflict.type,
          username: conflict.username,
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message
        });
      }
    }

    console.log(`UserDataSynchronizer: Resolved ${resolvedCount} conflicts`);
    return { resolved: resolvedCount, total: conflicts.length };
  }

  /**
   * Detectar conflictos entre sistemas
   */
  async detectConflicts() {
    const conflicts = [];
    const jwtUsers = this.db.data.usuarios || {};
    const panelUsers = global.db?.data?.panel?.users || {};
    const registros = global.db?.data?.panel?.registros || {};

    // Detectar usuarios duplicados por username
    const usernameMap = new Map();
    
    // Mapear usuarios JWT
    Object.values(jwtUsers).forEach(user => {
      if (!usernameMap.has(user.username)) {
        usernameMap.set(user.username, []);
      }
      usernameMap.get(user.username).push({ type: 'jwt', user });
    });

    // Mapear usuarios del panel
    Object.values(panelUsers).forEach(user => {
      if (!usernameMap.has(user.username)) {
        usernameMap.set(user.username, []);
      }
      usernameMap.get(user.username).push({ type: 'panel', user });
    });

    // Mapear registros
    Object.values(registros).forEach(user => {
      if (!usernameMap.has(user.username)) {
        usernameMap.set(user.username, []);
      }
      usernameMap.get(user.username).push({ type: 'registro', user });
    });

    // Identificar conflictos
    for (const [username, userList] of usernameMap.entries()) {
      if (userList.length > 1) {
        // Hay múltiples entradas para el mismo username
        const jwtUser = userList.find(u => u.type === 'jwt')?.user;
        const panelUser = userList.find(u => u.type === 'panel')?.user;
        const registroUser = userList.find(u => u.type === 'registro')?.user;

        if (jwtUser && (panelUser || registroUser)) {
          // Conflicto de datos entre sistemas
          conflicts.push({
            type: 'data_mismatch',
            username,
            jwtUser,
            panelUser,
            registroUser,
            resolution: 'merge_data'
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Aplicar resolución de conflicto
   */
  async applyConflictResolution(conflict) {
    switch (conflict.resolution) {
      case 'merge_data':
        if (conflict.panelUser) {
          await this.mergeUserData(conflict.jwtUser, conflict.panelUser, 'panel');
        }
        if (conflict.registroUser) {
          await this.mergeUserData(conflict.jwtUser, conflict.registroUser, 'whatsapp');
        }
        break;
        
      default:
        console.warn(`Unknown conflict resolution: ${conflict.resolution}`);
    }
  }

  /**
   * Migrar usuarios existentes sin contraseñas
   */
  async migrateExistingUsers() {
    try {
      let migratedCount = 0;
      const config = this.getConfig();
      const bcryptRounds = config?.security?.bcryptRounds || 10;

      // Migrar usuarios del panel sin contraseñas
      const panelUsers = global.db?.data?.panel?.users || {};
      for (const [id, user] of Object.entries(panelUsers)) {
        if (!user.password && !user.temp_password) {
          // Generar contraseña temporal
          const tempPassword = 'migrate' + Math.random().toString(36).substring(2, 8);
          user.temp_password = tempPassword;
          user.require_password_change = true;
          
          // Crear en JWT system si no existe
          const jwtUsers = this.db.data.usuarios || {};
          const existingJwtUser = Object.values(jwtUsers).find(u => u.username === user.username);
          
          if (!existingJwtUser) {
            await this.createJwtUserFromPanel(user);
          }
          
          migratedCount++;
          
          this.auditLogs.push({
            action: 'migrate_user',
            username: user.username,
            source: 'panel',
            tempPassword: tempPassword,
            timestamp: new Date().toISOString(),
            success: true
          });
          
          console.log(`Migrated panel user: ${user.username} with temp password: ${tempPassword}`);
        }
      }

      // Migrar registros sin contraseñas
      const registros = global.db?.data?.panel?.registros || {};
      for (const [id, registro] of Object.entries(registros)) {
        if (!registro.temp_password) {
          // Generar contraseña temporal
          const tempPassword = 'wa' + Math.random().toString(36).substring(2, 8);
          registro.temp_password = tempPassword;
          registro.require_password_change = true;
          
          // Crear en JWT system si no existe
          const jwtUsers = this.db.data.usuarios || {};
          const existingJwtUser = Object.values(jwtUsers).find(u => u.username === registro.username);
          
          if (!existingJwtUser) {
            await this.createJwtUserFromRegistro(registro);
          }
          
          migratedCount++;
          
          this.auditLogs.push({
            action: 'migrate_user',
            username: registro.username,
            source: 'whatsapp',
            tempPassword: tempPassword,
            timestamp: new Date().toISOString(),
            success: true
          });
          
          console.log(`Migrated WhatsApp user: ${registro.username} with temp password: ${tempPassword}`);
        }
      }

      console.log(`UserDataSynchronizer: Migrated ${migratedCount} users`);
      return { migrated: migratedCount };

    } catch (error) {
      console.error('UserDataSynchronizer: Error in migrateExistingUsers:', error);
      throw error;
    }
  }

  /**
   * Validar integridad de datos
   */
  async validateDataIntegrity() {
    const report = {
      timestamp: new Date().toISOString(),
      jwtUsers: 0,
      panelUsers: 0,
      registros: 0,
      synchronized: 0,
      conflicts: 0,
      orphaned: 0,
      issues: []
    };

    try {
      // Contar usuarios en cada sistema
      const jwtUsers = this.db.data.usuarios || {};
      const panelUsers = global.db?.data?.panel?.users || {};
      const registros = global.db?.data?.panel?.registros || {};

      report.jwtUsers = Object.keys(jwtUsers).length;
      report.panelUsers = Object.keys(panelUsers).length;
      report.registros = Object.keys(registros).length;

      // Verificar sincronización
      for (const jwtUser of Object.values(jwtUsers)) {
        const panelUser = Object.values(panelUsers).find(u => u.username === jwtUser.username);
        const registro = Object.values(registros).find(u => u.username === jwtUser.username);
        
        if (panelUser || registro) {
          report.synchronized++;
        } else if (jwtUser.source !== 'env') {
          report.orphaned++;
          report.issues.push(`JWT user ${jwtUser.username} has no corresponding panel/registro entry`);
        }
      }

      // Detectar conflictos
      const conflicts = await this.detectConflicts();
      report.conflicts = conflicts.length;
      
      for (const conflict of conflicts) {
        report.issues.push(`Conflict: ${conflict.type} for user ${conflict.username}`);
      }

      console.log('UserDataSynchronizer: Data integrity report:', report);
      return report;

    } catch (error) {
      console.error('UserDataSynchronizer: Error in validateDataIntegrity:', error);
      report.issues.push(`Validation error: ${error.message}`);
      return report;
    }
  }

  /**
   * Ejecutar sincronización completa
   */
  async performFullSync() {
    console.log('UserDataSynchronizer: Starting full synchronization...');
    
    const results = {
      timestamp: new Date().toISOString(),
      panelSync: null,
      registrosSync: null,
      conflicts: null,
      migration: null,
      integrity: null,
      auditLogs: []
    };

    try {
      // 1. Sincronizar panel users
      results.panelSync = await this.syncPanelWithDatabase();
      
      // 2. Sincronizar registros
      results.registrosSync = await this.syncRegistrosWithDatabase();
      
      // 3. Resolver conflictos
      results.conflicts = await this.resolveDataConflicts();
      
      // 4. Migrar usuarios existentes
      results.migration = await this.migrateExistingUsers();
      
      // 5. Validar integridad
      results.integrity = await this.validateDataIntegrity();
      
      // 6. Copiar logs de auditoría
      results.auditLogs = [...this.auditLogs];
      
      console.log('UserDataSynchronizer: Full synchronization completed successfully');
      return results;

    } catch (error) {
      console.error('UserDataSynchronizer: Error in performFullSync:', error);
      results.error = error.message;
      results.auditLogs = [...this.auditLogs];
      return results;
    }
  }

  /**
   * Obtener logs de auditoría
   */
  getAuditLogs() {
    return [...this.auditLogs];
  }

  /**
   * Limpiar logs de auditoría
   */
  clearAuditLogs() {
    this.auditLogs = [];
  }
}

export default UserDataSynchronizer;