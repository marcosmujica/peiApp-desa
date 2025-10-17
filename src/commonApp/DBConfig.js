/**
 * DBConfig.js - Configuración centralizada para las bases de datos
 * 
 * Este archivo centraliza toda la configuración de las bases de datos
 * para facilitar el mantenimiento y evitar duplicación de código
 */

// ==================== CONFIGURACIÓN DEL SERVIDOR ====================

export const DB_CONFIG = {
  // URL del servidor CouchDB
  // PRODUCCIÓN
  COUCH_URL: 'http://34.39.168.70:5984',
  
  // DESARROLLO (descomentar para usar)
  // COUCH_URL: 'http://192.168.68.53:5984',
  // COUCH_URL: 'http://localhost:5984',
  
  // Credenciales (usar variables de entorno en producción)
  USERNAME: 'admin',
  PASSWORD: 'password123',
  
  // Configuración de sincronización
  SYNC_INTERVAL: 30000, // 30 segundos
  FETCH_TIMEOUT: 10000, // 10 segundos
};

// ==================== DEFINICIÓN DE BASES DE DATOS ====================

/**
 * Configuración de cada base de datos del sistema
 */
export const DATABASES = {
  // Base de datos de usuarios
  USERS: {
    name: 'users',
    isRemote: true,
    indices: ['email', 'phone', 'role', 'status']
  },
  
  // Base de datos de tickets
  TICKETS: {
    name: 'tickets',
    isRemote: true,
    indices: ['userId', 'status', 'priority', 'assignedTo', 'createdAt', 'updatedAt']
  },
  
  // Base de datos de mensajes de tickets
  TICKET_CHAT: {
    name: 'ticket_chat',
    isRemote: true,
    indices: ['ticketId', 'userId', 'createdAt']
  },
  
  // Base de datos de logs de estado de tickets
  TICKET_LOG_STATUS: {
    name: 'ticket_log_status',
    isRemote: true,
    indices: ['ticketId', 'idUser', 'idStatus', 'TS']
  },
  
  // Base de datos de grupos
  GROUPS: {
    name: 'groups',
    isRemote: true,
    indices: ['name', 'type', 'createdBy', 'createdAt']
  },
  
  // Base de datos de grupos por ticket
  GROUP_TICKET: {
    name: 'group_ticket',
    isRemote: true,
    indices: ['groupId', 'ticketId']
  },
  
  // Base de datos de acceso de usuarios
  USER_ACCESS: {
    name: 'user_access',
    isRemote: true,
    indices: ['userId', 'resource', 'permission']
  },
  
  // Base de datos de perfiles (local)
  PROFILE: {
    name: 'profile',
    isRemote: false,
    indices: ['userId']
  },
  
  // Base de datos de OTP (local y temporal)
  OTP: {
    name: 'otp',
    isRemote: false,
    indices: ['phone', 'createdAt']
  },
  
  // Base de datos de ratings
  RATING: {
    name: 'ticket_rating',
    isRemote: true,
    indices: ['ticketId', 'userId', 'rating']
  },
  
  // Base de datos de información de tickets
  TICKET_INFO: {
    name: 'ticket_info',
    isRemote: true,
    indices: ['ticketId', 'idUser', 'type']
  },
  
  // Base de datos de vista de tickets
  TICKET_VIEW: {
    name: 'ticket_view',
    isRemote: true,
    indices: ['ticketId', 'userId', 'status']
  },
  
  // Base de datos de helpdesk
  HELPDESK: {
    name: 'helpdesk',
    isRemote: true,
    indices: ['userId', 'category', 'status']
  },
  
  // Base de datos de grupos por ticket (alternativa)
  GROUP_BY_TICKET: {
    name: 'group_by_ticket',
    isRemote: true,
    indices: ['ticketId', 'groupId']
  }
};

// ==================== FUNCIÓN AUXILIAR PARA CREAR INSTANCIAS ====================

import { DB } from './DB';

/**
 * Crea una instancia de DB con la configuración especificada
 * 
 * @param {string} dbKey - Clave de la base de datos en DATABASES
 * @param {string} userId - ID del usuario logueado (para filtrado)
 * @param {Object} overrides - Opciones adicionales para sobrescribir
 * @returns {DB} Instancia de la base de datos
 */
export function createDB(dbKey, userId = '', overrides = {}) {
  const config = DATABASES[dbKey];
  
  if (!config) {
    throw new Error(`Base de datos '${dbKey}' no encontrada en configuración`);
  }
  
  return new DB(config.name, {
    ...config,
    couchUrl: DB_CONFIG.COUCH_URL,
    username: DB_CONFIG.USERNAME,
    password: DB_CONFIG.PASSWORD,
    userId: userId,
    syncInterval: DB_CONFIG.SYNC_INTERVAL,
    fetchTimeout: DB_CONFIG.FETCH_TIMEOUT,
    ...overrides
  });
}

// ==================== GESTOR DE INSTANCIAS ====================

/**
 * Gestor singleton de instancias de bases de datos
 * Mantiene una única instancia de cada base de datos
 */
class DBManager {
  constructor() {
    this.instances = new Map();
    this.currentUserId = '';
  }
  
  /**
   * Establece el usuario actual
   */
  setUserId(userId) {
    this.currentUserId = userId;
  }
  
  /**
   * Obtiene una instancia de base de datos
   * Si ya existe, retorna la existente; si no, la crea
   */
  get(dbKey, overrides = {}) {
    const key = `${dbKey}_${this.currentUserId}`;
    
    if (!this.instances.has(key)) {
      const db = createDB(dbKey, this.currentUserId, overrides);
      this.instances.set(key, db);
    }
    
    return this.instances.get(key);
  }
  
  /**
   * Cierra una instancia específica
   */
  async close(dbKey) {
    const key = `${dbKey}_${this.currentUserId}`;
    const db = this.instances.get(key);
    
    if (db) {
      await db.close();
      this.instances.delete(key);
    }
  }
  
  /**
   * Cierra todas las instancias
   */
  async closeAll() {
    const promises = [];
    
    for (const [key, db] of this.instances.entries()) {
      promises.push(db.close());
    }
    
    await Promise.all(promises);
    this.instances.clear();
  }
  
  /**
   * Detiene la sincronización de todas las instancias
   */
  stopAllSync() {
    for (const db of this.instances.values()) {
      db.stopSync();
    }
  }
  
  /**
   * Obtiene el estado de todas las instancias
   */
  getStatus() {
    const status = [];
    
    for (const [key, db] of this.instances.entries()) {
      status.push({
        key: key,
        dbName: db.dbName,
        initialized: db.initialized,
        isRemote: db.isRemote,
        syncing: db.syncing,
        lastSeq: db.lastSeq
      });
    }
    
    return status;
  }
}

// Exportar instancia singleton
export const dbManager = new DBManager();

// ==================== HOOKS PARA REACT (OPCIONAL) ====================

/**
 * Hook personalizado para usar una base de datos en componentes React
 * Requiere React y hooks
 */
export function useDB(dbKey, userId = '') {
  // Importar React solo si es necesario
  // import { useEffect, useState } from 'react';
  
  // const [db, setDb] = useState(null);
  // const [ready, setReady] = useState(false);
  
  // useEffect(() => {
  //   dbManager.setUserId(userId);
  //   const dbInstance = dbManager.get(dbKey);
    
  //   // Esperar inicialización
  //   const checkReady = setInterval(() => {
  //     if (dbInstance.initialized) {
  //       setDb(dbInstance);
  //       setReady(true);
  //       clearInterval(checkReady);
  //     }
  //   }, 100);
    
  //   return () => {
  //     clearInterval(checkReady);
  //   };
  // }, [dbKey, userId]);
  
  // return { db, ready };
}

// ==================== EJEMPLOS DE USO ====================

/**
 * Ejemplo 1: Uso directo con createDB
 */
export async function ejemploUsoDirecto() {
  // Crear instancia de tickets para un usuario
  const dbTickets = createDB('TICKETS', 'user_123');
  
  // Esperar inicialización
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Usar la base de datos
  const ticket = await dbTickets.put(null, {
    userId: 'user_123',
    title: 'Nuevo ticket',
    status: 'open'
  });
  
  console.log('Ticket creado:', ticket);
  
  // Cerrar cuando termine
  await dbTickets.close();
}

/**
 * Ejemplo 2: Uso con DBManager (recomendado)
 */
export async function ejemploUsoManager() {
  // Establecer usuario actual
  dbManager.setUserId('user_123');
  
  // Obtener instancia (se crea automáticamente si no existe)
  const dbTickets = dbManager.get('TICKETS');
  
  // Esperar inicialización
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Usar la base de datos
  const tickets = await dbTickets.getAll();
  console.log('Total tickets:', tickets.length);
  
  // No es necesario cerrar - el manager lo hace automáticamente
  // Si cambias de usuario:
  // await dbManager.closeAll();
  // dbManager.setUserId('otro_usuario');
}

/**
 * Ejemplo 3: Múltiples bases de datos
 */
export async function ejemploMultiplesDB() {
  dbManager.setUserId('user_456');
  
  // Obtener múltiples instancias
  const dbTickets = dbManager.get('TICKETS');
  const dbUsers = dbManager.get('USERS');
  const dbMessages = dbManager.get('TICKET_CHAT');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Usar todas las bases de datos
  const tickets = await dbTickets.getAll();
  const user = await dbUsers.get('user_456');
  const messages = await dbMessages.find({ userId: 'user_456' });
  
  console.log('Tickets:', tickets.length);
  console.log('Usuario:', user);
  console.log('Mensajes:', messages.length);
  
  // Ver estado de todas las instancias
  console.log('Estado:', dbManager.getStatus());
}

/**
 * Ejemplo 4: Manejo de sesión de usuario
 */
export async function ejemploSesionUsuario() {
  // Usuario hace login
  const userId = 'user_789';
  dbManager.setUserId(userId);
  
  // Obtener bases de datos necesarias
  const dbProfile = dbManager.get('PROFILE');
  const dbTickets = dbManager.get('TICKETS');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Cargar perfil
  const profile = await dbProfile.get(userId);
  console.log('Perfil cargado:', profile);
  
  // Trabajar con tickets
  const myTickets = await dbTickets.getAll();
  console.log('Mis tickets:', myTickets.length);
  
  // Usuario hace logout
  await dbManager.closeAll();
  dbManager.setUserId('');
  
  console.log('Sesión cerrada');
}

// ==================== EXPORTACIONES ====================

export default {
  DB_CONFIG,
  DATABASES,
  createDB,
  dbManager,
  useDB
};
