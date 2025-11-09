/**
 * Ejemplo de cómo adaptar tu clase DB.js para usar el servicio local
 * Este archivo muestra los cambios necesarios para usar la nueva capa JWT
 */

import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { EVENT_DB_CHANGE, emitEvent } from "./DBEvents";
import { DB_EVENT } from './dataTypes';

// ==================== CLASE DB MODIFICADA ====================
export class DBWithJWTService {
  constructor(dbName, options = {}) {
    this.dbName = dbName;
    this.isRemote = options.isRemote || false;
    this.userId = options.userId || '';
    this.indices = options.indices || [];
    this.syncInterval = options.syncInterval || 30000;
    this.emitEvent = options.emitEvent || false;
    
    // Configuración del servicio local JWT
    this.serviceUrl = options.serviceUrl || 'http://localhost:3001/api/db';
    this.authUrl = options.authUrl || 'http://localhost:3001/api/auth';
    this.username = options.username || 'admin';
    this.password = options.password || 'admin123';
    
    // Tokens JWT
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    
    // Estado interno (igual que antes)
    this.db = null;
    this.isWeb = Platform.OS === 'web';
    this.initialized = false;
    this.syncing = false;
    this.syncTimer = null;
    this.lastSeq = 0;
  }

  // ==================== AUTENTICACIÓN JWT ====================

  /**
   * Autentica con el servicio local y obtiene tokens JWT
   */
  async authenticate() {
    try {
      const response = await this._fetchWithTimeout(`${this.authUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.username,
          password: this.password
        })
      });

      if (!response.ok) {
        throw new Error(`Error de autenticación: ${response.status}`);
      }

      const authData = await response.json();
      
      this.accessToken = authData.accessToken;
      this.refreshToken = authData.refreshToken;
      
      // Calcular tiempo de expiración (24h por defecto menos 5 minutos de margen)
      const expiresInMs = this._parseExpiresIn(authData.expiresIn);
      this.tokenExpiresAt = new Date(Date.now() + expiresInMs - 5 * 60 * 1000);

      console.log(`[DB:${this.dbName}] ✓ Autenticado con servicio JWT`);
      
      // Programar renovación automática del token
      this._scheduleTokenRefresh();
      
      return true;
    } catch (error) {
      console.error(`[DB:${this.dbName}] Error en autenticación:`, error);
      throw error;
    }
  }

  /**
   * Renueva el access token usando el refresh token
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No hay refresh token disponible');
      }

      const response = await this._fetchWithTimeout(`${this.authUrl}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });

      if (!response.ok) {
        // Si el refresh token es inválido, re-autenticar
        if (response.status === 401) {
          console.warn(`[DB:${this.dbName}] Refresh token expirado, re-autenticando...`);
          return await this.authenticate();
        }
        throw new Error(`Error renovando token: ${response.status}`);
      }

      const authData = await response.json();
      
      this.accessToken = authData.accessToken;
      
      // Actualizar tiempo de expiración
      const expiresInMs = this._parseExpiresIn(authData.expiresIn);
      this.tokenExpiresAt = new Date(Date.now() + expiresInMs - 5 * 60 * 1000);

      console.log(`[DB:${this.dbName}] ✓ Token renovado`);
      
      // Reprogramar siguiente renovación
      this._scheduleTokenRefresh();
      
      return true;
    } catch (error) {
      console.error(`[DB:${this.dbName}] Error renovando token:`, error);
      // Intentar re-autenticar como fallback
      return await this.authenticate();
    }
  }

  /**
   * Programa la renovación automática del token
   */
  _scheduleTokenRefresh() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    if (!this.tokenExpiresAt) return;

    const timeUntilRefresh = this.tokenExpiresAt.getTime() - Date.now();
    
    if (timeUntilRefresh > 0) {
      this.tokenRefreshTimer = setTimeout(async () => {
        try {
          await this.refreshAccessToken();
        } catch (error) {
          console.error(`[DB:${this.dbName}] Error en renovación automática:`, error);
        }
      }, timeUntilRefresh);
    }
  }

  /**
   * Obtiene headers de autenticación con token JWT
   */
  async _getAuthHeaders() {
    // Verificar si el token está próximo a expirar
    if (this.tokenExpiresAt && new Date() >= this.tokenExpiresAt) {
      await this.refreshAccessToken();
    }

    if (!this.accessToken) {
      await this.authenticate();
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  // ==================== OPERACIONES REMOTAS MODIFICADAS ====================

  /**
   * Inicializa la base de datos (local y remota)
   */
  async initDB() {
    try {
      console.log(`[DB:${this.dbName}] Inicializando...`);
      
      // Inicializar base de datos local (igual que antes)
      if (this.isWeb) {
        await this._initIndexedDB();
      } else {
        await this._initSQLite();
      }
      
      // Cargar último seq guardado
      await this._loadLastSeq();
      
      this.initialized = true;
      console.log(`[DB:${this.dbName}] ✓ Inicializado correctamente`);
      
      // Si es remoto, autenticar y crear base de datos en el servicio
      if (this.isRemote) {
        await this.authenticate();
        await this._createRemoteDatabase();
        await this._startSync();
      }
    } catch (error) {
      console.error(`[DB:${this.dbName}] Error en inicialización:`, error);
      throw error;
    }
  }

  /**
   * Crea la base de datos en el servicio remoto
   */
  async _createRemoteDatabase() {
    try {
      const response = await this._fetchWithTimeout(`${this.serviceUrl}/${this.dbName}`, {
        method: 'PUT',
        headers: await this._getAuthHeaders()
      });

      if (response.ok) {
        console.log(`[DB:${this.dbName}] ✓ Base de datos remota verificada/creada`);
      }
    } catch (error) {
      console.error(`[DB:${this.dbName}] Error creando base de datos remota:`, error);
      throw error;
    }
  }

  /**
   * Sincroniza un documento individual al servicio remoto
   */
  async _syncDocumentToRemote(doc) {
    try {
      const url = `${this.serviceUrl}/${this.dbName}/documents/${doc._id}`;
      const headers = await this._getAuthHeaders();
      
      if (doc._deleted) {
        // Eliminar documento
        const response = await this._fetchWithTimeout(url, {
          method: 'DELETE',
          headers: {
            ...headers,
            'If-Match': doc._rev
          }
        });
        
        if (response.ok) {
          doc.syncStatus = 'synced';
          await this._putLocal(doc, false);
          console.log(`[DB:${this.dbName}] ✓ Documento ${doc._id} eliminado remotamente`);
        }
      } else {
        // Crear o actualizar documento
        const response = await this._fetchWithTimeout(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            data: doc.data,
            _rev: doc._rev
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          doc._rev = result.rev;
          doc.syncStatus = 'synced';
          await this._putLocal(doc, false);
          console.log(`[DB:${this.dbName}] ✓ Documento ${doc._id} sincronizado con rev ${result.rev}`);
        } else if (response.status === 409) {
          // Conflicto - manejar resolución
          await this._handleConflict(doc);
        }
      }
    } catch (error) {
      console.error(`[DB:${this.dbName}] Error sincronizando documento ${doc._id}:`, error);
    }
  }

  /**
   * Sincroniza cambios desde el servicio remoto
   */
  async _syncFromRemote() {
    if (this.syncing) return;
    
    this.syncing = true;
    
    try {
      const headers = await this._getAuthHeaders();
      let url = `${this.serviceUrl}/${this.dbName}/changes?since=${this.lastSeq}&limit=100`;
      
      // Agregar filtro por usuario si está configurado
      if (this.userId) {
        url += `&selector=${encodeURIComponent(JSON.stringify({userId: this.userId}))}`;
      }
      
      const response = await this._fetchWithTimeout(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log(`[DB:${this.dbName}] Cambios recibidos: ${data.results.length}`);
      
      // Procesar cada cambio (igual que antes)
      for (const change of data.results) {
        await this._applyRemoteChange(change);
      }
      
      // Actualizar último seq
      if (data.last_seq) {
        await this._saveLastSeq(data.last_seq);
      }
    } catch (error) {
      console.error(`[DB:${this.dbName}] Error sincronizando desde remoto:`, error);
    } finally {
      this.syncing = false;
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Convierte string de expiración a milisegundos
   */
  _parseExpiresIn(expiresIn) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      return value * units[unit];
    }
    
    // Fallback: asumir que es en segundos
    return parseInt(expiresIn) * 1000;
  }

  /**
   * Cierra la conexión y limpia recursos
   */
  async close() {
    console.log(`[DB:${this.dbName}] Cerrando...`);
    
    this.stopSync();
    
    // Limpiar timer de renovación de token
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
    
    // Logout del servicio JWT
    if (this.refreshToken) {
      try {
        await this._fetchWithTimeout(`${this.authUrl}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            refreshToken: this.refreshToken
          })
        });
      } catch (error) {
        console.warn(`[DB:${this.dbName}] Error en logout:`, error);
      }
    }
    
    if (this.isWeb && this.db) {
      this.db.close();
    }
    
    this.initialized = false;
    this.db = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    
    console.log(`[DB:${this.dbName}] ✓ Cerrado`);
  }

  // ==================== MÉTODOS LOCALES (IGUALES QUE ANTES) ====================
  
  // Todos los métodos locales (_putLocal, _getLocal, etc.) permanecen igual
  // Solo cambian los métodos de sincronización remota para usar JWT
  
  // ... resto de métodos locales igual que en tu DB.js original
}

export default DBWithJWTService;