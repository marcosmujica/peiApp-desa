/**
 * INTEGRACION_PRACTICA.js
 * 
 * Ejemplo de cómo integrar DB.js en el proyecto existente peiApp
 * Adaptado a la estructura actual del proyecto
 */

import { DB } from './src/commonApp/DB';
import { dbManager, createDB } from './src/commonApp/DBConfig';

// ==================== REEMPLAZAR database.js ====================

/**
 * Este archivo puede reemplazar gradualmente las funciones de database.js
 * manteniendo la misma interfaz para no romper el código existente
 */

// Constantes de nombres de bases de datos (compatible con código existente)
export const db_OTP = "otp";
export const db_TICKET = "tickets";
export const db_TICKET_CHAT = "ticket_chat";
export const db_TICKET_LOG_STATUS = "ticket_log_status";
export const db_USER = "users";
export const db_GROUP = "groups";
export const db_USER_ACCESS = "user_access";
export const db_PROFILE = "profile";
export const db_GROUP_TICKET = "group_ticket";
export const db_GROUP_BY_TICKET = "group_by_ticket";
export const db_HELPDESK = "helpdesk";
export const db_RATING = "ticket_rating";
export const db_TICKET_INFO = "ticket_info";
export const db_TICKET_VIEW = "ticket_view";

// URL del servidor remoto (ajustar según tu entorno)
const _urlRemoteDB = "http://34.39.168.70:5984";

// ==================== INICIALIZACIÓN ====================

/**
 * Inicializar el sistema de bases de datos
 * Llamar al inicio de la aplicación
 */
export async function db_init(userId, username, password) {
  console.log('[DB] Inicializando sistema de bases de datos...');
  
  // Configurar usuario actual
  dbManager.setUserId(userId);
  
  // Crear instancias de las bases de datos principales
  const dbConfigs = [
    { key: 'TICKETS', name: db_TICKET },
    { key: 'TICKET_CHAT', name: db_TICKET_CHAT },
    { key: 'TICKET_LOG_STATUS', name: db_TICKET_LOG_STATUS },
    { key: 'USERS', name: db_USER },
    { key: 'GROUPS', name: db_GROUP },
    { key: 'PROFILE', name: db_PROFILE }
  ];
  
  for (const config of dbConfigs) {
    dbManager.get(config.key);
  }
  
  // Esperar inicialización
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('[DB] Sistema de bases de datos inicializado');
}

/**
 * Inicializar listener de cambios
 * Compatible con database.js
 */
export async function db_initListener() {
  console.log('[DB] Listener de cambios inicializado (automático en DB.js)');
  // En DB.js la sincronización es automática, no se necesita listener manual
}

// ==================== FUNCIONES DE COMPATIBILIDAD ====================

/**
 * Funciones wrapper para mantener compatibilidad con código existente
 */

// Helper para obtener instancia de DB
function _getDB(dbName) {
  const dbKeyMap = {
    [db_TICKET]: 'TICKETS',
    [db_TICKET_CHAT]: 'TICKET_CHAT',
    [db_TICKET_LOG_STATUS]: 'TICKET_LOG_STATUS',
    [db_USER]: 'USERS',
    [db_GROUP]: 'GROUPS',
    [db_USER_ACCESS]: 'USER_ACCESS',
    [db_PROFILE]: 'PROFILE',
    [db_GROUP_TICKET]: 'GROUP_TICKET',
    [db_GROUP_BY_TICKET]: 'GROUP_BY_TICKET',
    [db_HELPDESK]: 'HELPDESK',
    [db_RATING]: 'RATING',
    [db_TICKET_INFO]: 'TICKET_INFO',
    [db_TICKET_VIEW]: 'TICKET_VIEW',
    [db_OTP]: 'OTP'
  };
  
  const key = dbKeyMap[dbName] || dbName.toUpperCase();
  return dbManager.get(key);
}

// Crear/agregar documento
export async function db_add(dbName, id, data) {
  const db = _getDB(dbName);
  const result = await db.put(id, data);
  return { ...result, id: result._id }; // Compatibilidad: agregar campo 'id'
}

// Obtener documento
export async function db_get(dbName, id) {
  const db = _getDB(dbName);
  const result = await db.get(id);
  if (result) {
    return { ...result, id: result._id }; // Compatibilidad
  }
  return false; // Compatible con código existente
}

// Actualizar documento
export async function db_updateDoc(dbName, id, data) {
  const db = _getDB(dbName);
  const existing = await db.get(id);
  if (!existing) return false;
  
  const result = await db.put(id, {
    ...existing,
    ...data
  });
  return { ...result, id: result._id };
}

// Obtener todos los documentos
export async function db_getAll(dbName) {
  const db = _getDB(dbName);
  const results = await db.getAll();
  // Agregar campo 'id' para compatibilidad
  return results.map(doc => ({ ...doc, id: doc._id }));
}

// Buscar documentos
export async function db_find(dbName, query) {
  const db = _getDB(dbName);
  const results = await db.find(query);
  // Retornar en formato { id, data } para compatibilidad
  return results.map(doc => ({
    id: doc._id,
    data: doc
  }));
}

// Eliminar documento
export async function db_delete(dbName, id) {
  const db = _getDB(dbName);
  return await db.delete(id);
}

// ==================== FUNCIONES ESPECÍFICAS (Compatible con database.js) ====================

export async function db_getLocalProfile() {
  try {
    let aux = await db_get(db_PROFILE, "profile");
    if (aux == false) {
      // Importar LOCAL_PROFILE si existe
      // const LOCAL_PROFILE = require('./dataTypes').LOCAL_PROFILE;
      const auxProfile = { userId: '', name: '', email: '' }; // Crear perfil vacío
      await db_add(db_PROFILE, "profile", auxProfile);
      return auxProfile;
    }
    return aux;
  } catch (e) {
    console.log("Error db_getLocalProfile: " + JSON.stringify(e));
  }
}

export async function db_addTicketRating(idTicket, rating) {
  return await db_add(db_RATING, idTicket, { idTicket, rating });
}

export async function db_addTicketInfo(data) {
  return await db_add(db_TICKET_INFO, null, data);
}

export async function db_updateTicketRating(idTicket, rating) {
  return await db_updateDoc(db_RATING, idTicket, { idTicket, rating });
}

export async function db_getTicketRating(idTicket) {
  let aux = await db_getAll(db_RATING);
  if (!aux) return 0;
  
  let aux2 = aux.find((item) => item.idTicket == idTicket);
  return aux2 == undefined ? 0 : aux2.rating;
}

export async function db_updateGroupUsers(id, data) {
  return await db_updateDoc(db_GROUP_TICKET, id, data);
}

export async function db_addTicket(data) {
  return await db_add(db_TICKET, null, data);
}

export async function db_addGroupByTicket(data) {
  return await db_add(db_GROUP_BY_TICKET, null, data);
}

export async function db_addGroupUsers(idGroup, data) {
  return await db_add(db_GROUP_TICKET, idGroup, data);
}

export async function db_addUserConfig(id, doc) {
  try {
    return await db_add(db_USER, id, doc);
  } catch (e) {
    console.log("Error en addUserConfig: " + JSON.stringify(e));
  }
}

export async function db_getTicketChat(idTicket) {
  let data = await db_find(db_TICKET_CHAT, { idTicket: idTicket });
  return data.map(item => item.data);
}

export async function db_getTicketLog(idTicket) {
  let aux = await db_getAll(db_TICKET_LOG_STATUS);
  if (aux != []) {
    aux = aux.filter((item) => item.idTicket == idTicket);
  }
  return aux;
}

export async function db_getTicketLogByStatus(idTicket, idStatus, sortBy = "TS", order = "asc") {
  let results = await db_find(db_TICKET_LOG_STATUS, { idTicket: idTicket, idStatus: idStatus });
  results = results.map(item => item.data);
  
  if (Array.isArray(results) && results.length > 0) {
    if (order === "asc") {
      results.sort((a, b) => (a[sortBy] ?? 0) - (b[sortBy] ?? 0));
    } else if (order === "desc") {
      results.sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));
    }
  }
  return results;
}

export async function db_addTicketChat(data) {
  return await db_add(db_TICKET_CHAT, null, data);
}

export async function db_addTicketListItem(idTicket, data) {
  return await db_add(db_TICKET_VIEW, idTicket, data);
}

export async function db_getTicket(idTicket) {
  return await db_get(db_TICKET, idTicket);
}

export async function db_getTicketInfo(idTicket) {
  let data = await db_find(db_TICKET_INFO, { "idTicket": idTicket });
  return data.map(item => item.data);
}

export async function db_updateTicket(idTicket, data) {
  return await db_updateDoc(db_TICKET, idTicket, data);
}

export async function db_updateTicketListItem(idTicket, data) {
  return await db_updateDoc(db_TICKET_VIEW, idTicket, data);
}

export async function db_getTicketViewByTicketId(idTicket) {
  return await db_find(db_TICKET_VIEW, { idTicket: idTicket });
}

export async function db_updateTicketInfo(idTicket, idUser, type, data) {
  try {
    // Importar deepObjectMerge si existe
    // import { deepObjectMerge } from './functions';
    
    let aux = await db_find(db_TICKET_INFO, { idTicket: idTicket, idUser: idUser, type: type });
    if (!aux || aux.length == 0) return false;
    
    const existing = aux[0];
    // existing.data.info = deepObjectMerge(existing.data.info, data);
    existing.data.info = { ...existing.data.info, ...data }; // Merge simple
    
    return await db_updateDoc(db_TICKET_INFO, existing.id, existing.data);
  } catch (e) {
    console.log(e);
    console.log("Error db_updateTicketInfo: " + JSON.stringify(e));
    return false;
  }
}

export async function db_getAllTickets() {
  return await db_getAll(db_TICKET);
}

export async function db_getAllTicketItem(data) {
  let aux = await db_find(db_TICKET_VIEW, data);
  return aux.map((item) => item.data);
}

export async function db_getGroupInfo(id) {
  return await db_get(db_GROUP_TICKET, id);
}

export async function db_saveProfile(profile) {
  return await db_updateDoc(db_PROFILE, "profile", profile);
}

export async function db_setNewUser(id, data) {
  try {
    const result = await db_add(db_USER, id, data);
    return result;
  } catch (e) {
    console.error('Error en db_setNewUser:', e);
    return null;
  }
}

export async function db_checkOTP(phone, otp) {
  try {
    let auxCheck = await db_get(db_OTP, "otp");
    
    if (auxCheck) {
      if (auxCheck.phone === phone && auxCheck.otp === otp) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.log("Error db_checkOTP: " + JSON.stringify(e));
    return false;
  }
}

// ==================== FUNCIONES DE GESTIÓN ====================

/**
 * Cerrar todas las bases de datos
 * Llamar al hacer logout
 */
export async function db_closeAll() {
  console.log('[DB] Cerrando todas las bases de datos...');
  await dbManager.closeAll();
  console.log('[DB] Todas las bases de datos cerradas');
}

/**
 * Detener sincronización de todas las bases de datos
 * Útil cuando la app pasa a background
 */
export function db_stopAllSync() {
  console.log('[DB] Deteniendo sincronización...');
  dbManager.stopAllSync();
}

/**
 * Obtener estado del sistema de bases de datos
 */
export function db_getStatus() {
  return dbManager.getStatus();
}

// ==================== EJEMPLO DE USO EN App.js ====================

/**
 * Ejemplo de cómo inicializar en App.js
 */
export const ejemploIntegracionApp = `
import { db_init, db_closeAll, db_getLocalProfile } from './src/commonApp/INTEGRACION_PRACTICA';
import { getProfile } from './src/commonApp/profile';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function initApp() {
      try {
        // Obtener perfil del usuario
        const profile = await getProfile();
        
        if (profile && profile.userId) {
          // Inicializar bases de datos
          await db_init(
            profile.userId,
            profile.username || 'admin',
            profile.password || 'password123'
          );
          
          console.log('App inicializada correctamente');
          setReady(true);
        }
      } catch (error) {
        console.error('Error inicializando app:', error);
      }
    }
    
    initApp();
    
    // Cleanup al desmontar
    return () => {
      db_closeAll();
    };
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return <YourMainComponent />;
}
`;

// ==================== EJEMPLO DE USO EN COMPONENTES ====================

export const ejemploUsoComponente = `
import { 
  db_addTicket, 
  db_getTicket, 
  db_getAllTickets 
} from './src/commonApp/INTEGRACION_PRACTICA';

// En tu componente
async function handleCreateTicket(ticketData) {
  try {
    const result = await db_addTicket({
      ...ticketData,
      createdAt: new Date().toISOString(),
      status: 'open'
    });
    
    console.log('Ticket creado:', result.id);
    
    // Se sincroniza automáticamente con el servidor
    
  } catch (error) {
    console.error('Error creando ticket:', error);
  }
}

async function loadTickets() {
  try {
    const tickets = await db_getAllTickets();
    console.log('Tickets cargados:', tickets.length);
    return tickets;
  } catch (error) {
    console.error('Error cargando tickets:', error);
    return [];
  }
}
`;

// ==================== EXPORT DEFAULT ====================

export default {
  db_init,
  db_initListener,
  db_closeAll,
  db_stopAllSync,
  db_getStatus,
  
  // CRUD
  db_add,
  db_get,
  db_updateDoc,
  db_getAll,
  db_find,
  db_delete,
  
  // Específicas
  db_getLocalProfile,
  db_addTicket,
  db_getTicket,
  db_updateTicket,
  db_getAllTickets,
  db_addTicketChat,
  db_getTicketChat,
  // ... todas las demás funciones
};
