/**
 * DB.js - Clase autónoma para acceso a CouchDB
 * 
 * Características:
 * - Almacenamiento local: IndexedDB (web) o expo-sqlite (mobile)
 * - Sincronización bidireccional con CouchDB
 * - No usa PouchDB
 * - Sincronización basada en _changes con seguimiento de seq
 * - Autenticación Basic Auth
 * - CRUD completo
 * - Filtrado por usuario
 * 
 * Estructura de documentos:
 * {
 *   _id: "doc_001",           // ID único
 *   _rev: "1-abc123",         // Revisión de CouchDB
 *   _deleted: false,          // Flag de eliminación
 *   syncStatus: "pending",    // Estado de sincronización (solo local)
 *   data: {                   // Datos del usuario
 *     name: "Juan",
 *     email: "juan@example.com",
 *     ...
 *   }
 * }
 */

import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { openDB } from 'idb';
import {EVENT_DB_CHANGE, emitEvent } from "./DBEvents";
import { DB_EVENT } from './dataTypes';
import { getUId } from './functions';
import { _idUser } from "./profile"

// ==================== CONFIGURACIÓN ====================
const SYNC_INTERVAL = 60000; // 60 segundos
const FETCH_TIMEOUT = 10000; // 10 segundos

// ==================== CLASE PRINCIPAL ====================
export class DB {
  /**
   * Constructor de la clase DB
   * 
   * @param {string} dbName - Nombre de la base de datos
   * @param {Object} options - Opciones de configuración
   * @param {Array<string>} options.indices - Índices para SQLite (ej: ['userId', 'type'])
   * @param {boolean} options.isRemote - Si es true, sincroniza con servidor remoto
   * @param {string} options.couchUrl - URL del servidor CouchDB
   * @param {string} options.username - Usuario para autenticación
   * @param {string} options.password - Contraseña para autenticación
   * @param {string} options.userId - ID del usuario logueado (para filtrado)
   * @param {number} options.syncInterval - Intervalo de sincronización en ms
   * @param {number} options.fetchTimeout - Timeout para fetch en ms
   */
  constructor(dbName, options = {}) {
    this.dbName = dbName;
    this.isRemote = options.isRemote || false;
    this.couchUrl = options.couchUrl ;
    this.username = options.username ;
    this.password = options.password ;
    this.filterArray = options.filterArray || [] // mm - array de views con valor "field" y "value"
    this.userId = options.userId || '';
    this.indices = options.indices || [];
    this.syncInterval = options.syncInterval || SYNC_INTERVAL;
    this.fetchTimeout = options.fetchTimeout || FETCH_TIMEOUT;
    this.emitEvent = options.emitEvent || false
    
    // Estado interno
    this.db = null;
    this.isWeb = Platform.OS === 'web';
    this.initialized = false;
    this.syncing = false;
    this.syncTimer = null;
    this.lastSeq = '0';
    
    // Inicializar automáticamente
    
  }

  // ==================== INICIALIZACIÓN ====================
  
  /**
   * Inicializa la base de datos local y comienza sincronización
   */
  async initDB() {
    try {
      console.log(`[DB:${this.dbName}] Inicializando...`);
      
      // Inicializar base de datos local
      if (this.isWeb) {
        await this._initIndexedDB();
      } else {
        await this._initSQLite();
      }
      // Cargar último seq guardado
      await this._loadLastSeq();
      
      this.initialized = true;
      console.log(`[DB:${this.dbName}] ✓ Inicializado correctamente`);
      
      // Si es remota, iniciar sincronización
      if (this.isRemote) {
      //  console.log (this.dbName + " SYNC REMOTO")
        await this._startSync();
      }
    } catch (error) {
      //console.log(`[DB:${this.dbName}] Error en inicialización:`, error);
      throw error;
    }
  }

  /**
   * Inicializa IndexedDB para web
   */
  async _initIndexedDB() {
    this.db = await openDB(this.dbName, 1, {
      upgrade(db) {
        // Store principal
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: '_id' });
          store.createIndex('_rev', '_rev', { unique: false });
          store.createIndex('_deleted', '_deleted', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
        }
        
        // Store para metadatos (seq, etc)
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      }
    });
    console.log(`[DB:${this.dbName}] IndexedDB inicializado`);
  }

  /**
   * Inicializa SQLite para mobile
   */
  async _initSQLite() {
    try {
      // Si ya hay una conexión, no intentar abrir de nuevo
      const startTime = Date.now();
// Tu operación aquí
      if (this.db) {
        //console.log(`[DB:${this.dbName}] Conexión SQLite ya existe, verificando...`);
        try {
          //console.log(`[DB:${this.dbName}] Conexión SQLite activa y funcional`);
          return;
        } catch (e) {
          //console.warn(`[DB:${this.dbName}] Conexión existente no responde, reabriendo...`);
          this.db = null;
        }
      }

      this.db = await SQLite.openDatabaseAsync(this.dbName);
      
      if (!this.db) {
        throw new Error('No se pudo establecer conexión SQLite');
      }
      
      //console.log(`[DB:${this.dbName}] Conexión SQLite establecida`);
      
      // Configurar SQLite con parámetros optimizados para móviles en una sola consulta
      const configStartTime = performance.now();
      
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        PRAGMA cache_size = -2000;
        PRAGMA temp_store = MEMORY;
        PRAGMA synchronous = NORMAL;
        PRAGMA busy_timeout = 30000;
        PRAGMA wal_autocheckpoint = 1000;
        PRAGMA page_size = 4096;
        PRAGMA optimize;
      `);
      
      const configEndTime = performance.now();
      
      
      // Descomentar solo si necesitas resetear las tablas
       await this.db.execAsync('DROP TABLE IF EXISTS documents');
       await this.db.execAsync('DROP TABLE IF EXISTS metadata');

      // Crear tabla principal usando execAsync (no getAllAsync)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS documents (
          _id TEXT PRIMARY KEY,
          _rev TEXT,
          _deleted INTEGER DEFAULT 0,
          syncStatus TEXT DEFAULT 'synced',
          data TEXT NOT NULL
        );
      `);
/*
      // Crear índices soliºcitados
      for (const index of this.indices) {
        await this.db.runAsync(`
          CREATE INDEX IF NOT EXISTS idx_${index} 
          ON documents(json_extract(data, '$.${index}'));
        `);
        console.log(`[DB:${this.dbName}] Índice 'idx_${index}' creado/verificado`);
      }
  */    
      // Crear tabla de metadatos
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS metadata (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
      //console.log(`[DB:${this.dbName}] ✓ SQLite inicializado correctamente`);
    } catch (error) {
      //console.error(`[DB:${this.dbName}] Error inicializando SQLite:`, error);
      this.db = null;
      this.initialized = false;
      throw error;
    }
  }

  // ==================== MÉTODOS CRUD ====================

  async put2(id, doc) {
    await this._ensureInitialized();
    
    try {
      const docId = id || this._generateId();
      const existingDoc = await this._getLocal(docId);
      
      // Agregar/actualizar timestamp updatedAt automáticamente
      const dataWithTimestamp = {
        ...doc,
        updatedAt: new Date().toISOString()
      };
      
      // Si es un documento nuevo, agregar también createdAt
      if (!existingDoc && !doc.createdAt) {
        dataWithTimestamp.createdAt = dataWithTimestamp.updatedAt;
      }
      
      // Estructura: campos de control en root, datos del usuario en 'data'
      const newDoc = {
        _id: docId,
        _rev: existingDoc ? this._incrementRev(existingDoc._rev) : '1-' + this._generateId(),
        _deleted: false,
        syncStatus: 'pending',
        data: dataWithTimestamp // Los datos del usuario van en el campo 'data' con timestamps
      };
      
      // Guardar localmente
      await this._putLocal(newDoc);
      
      //console.log(`[DB:${this.dbName}] ✓ Documento ${docId} guardado localmente (updatedAt: ${dataWithTimestamp.updatedAt})`);
      
      /*// Si es remoto, sincronizar inmediatamente
      if (this.isRemote) {
        
        this._syncDocumentToRemote(newDoc).catch(err => {
          //console.error(`[DB:${this.dbName}] Error sincronizando documento:`, err);
        });
      }*/
      
      return docId;
    } catch (error) {
      console.log(`[DB:${this.dbName}] Error en put:`, error);
      throw error;
    }
  }
  /**
   * Crea o actualiza un documento
   * @param {string} id - ID del documento
   * @param {Object} doc - Documento a guardar (se guardará en el campo 'data')
   * @returns {Promise<Object>} Documento guardado con estructura { _id, _rev, _deleted, syncStatus, data }
   */
  async put(id, doc, sync=true) {
    await this._ensureInitialized();
    
    try {
      const docId = id || this._generateId();
      const existingDoc = await this._getLocal(docId);
      
      // Agregar/actualizar timestamp updatedAt automáticamente
      const dataWithTimestamp = {
        ...doc,
        updatedAt: new Date().toISOString()
      };
      
      // Si es un documento nuevo, agregar también createdAt
      if (!existingDoc && !doc.createdAt) {
        dataWithTimestamp.createdAt = dataWithTimestamp.updatedAt;
      }
      
      // Estructura: campos de control en root, datos del usuario en 'data'
      const newDoc = {
        _id: docId,
        _rev: existingDoc ? this._incrementRev(existingDoc._rev) : '1-' + this._generateId(),
        _deleted: false,
        syncStatus: 'pending',
        data: dataWithTimestamp // Los datos del usuario van en el campo 'data' con timestamps
      };
      
      // Guardar localmente
      await this._putLocal(newDoc);
      
      //console.log(`[DB:${this.dbName}] ✓ Documento ${docId} guardado localmente (updatedAt: ${dataWithTimestamp.updatedAt})`);
      
      // Si es remoto, sincronizar inmediatamente
      if (this.isRemote && sync) {
        
        this._syncDocumentToRemote(newDoc).catch(err => {
          //console.error(`[DB:${this.dbName}] Error sincronizando documento:`, err);
        });
      }
      
      return docId;
    } catch (error) {
      console.log(`[DB:${this.dbName}] Error en put:`, error);
      throw error;
    }
  }

  /**
   * Actualiza un documento existente
   * @param {string} id - ID del documento
   * @param {Object} data - Datos a actualizar (se guardará en el campo 'data')
   * @param {string} rev - Revisión actual del documento
   * @returns {Promise<Object>} Documento actualizado con estructura { _id, _rev, _deleted, syncStatus, data }
   */
  async update(id, data, rev) {

    await this._ensureInitialized();
    
    try {
      const existingDoc = await this.getWithHeader(id);
      if (!existingDoc) {
        throw new Error(`Documento ${id} no encontrado`);
      }
      
      // Verificar que el _rev coincida para evitar conflictos
      if (rev && existingDoc._rev !== rev) {
        //throw new Error(`Conflicto de revisión: esperado ${rev}, actual ${existingDoc._rev}`);
      }
      
      // Agregar/actualizar timestamp updatedAt automáticamente
      const dataWithTimestamp = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      // Mantener createdAt si existe
      if (existingDoc.data?.createdAt) {
        dataWithTimestamp.createdAt = existingDoc.data.createdAt;
      }
      
      // Estructura: campos de control en root, datos del usuario en 'data'
      const updatedDoc = {
        _id: id,
        _rev: this._incrementRev(existingDoc._rev),
        _deleted: false,
        syncStatus: 'pending',
        data: dataWithTimestamp
      };
      
      // Guardar localmente
      await this._putLocal(updatedDoc);
      
      // Si es remoto, sincronizar inmediatamente
      if (this.isRemote) {
        this._syncDocumentToRemote(updatedDoc).catch(err => {
          console.log(`[DB:${this.dbName}] Error sincronizando documento:`, err);
        });
      }
      
      return updatedDoc;
    } catch (error) {
      console.log(`[DB:${this.dbName}] Error en update:`, error);
      throw error;
    }
  }

  /**
   * Obtiene un documento por ID
   * @param {string} id - ID del documento
   * @returns {Promise<Object|null>} Documento o null si no existe
   */
  async get(id) {
    await this._ensureInitialized();
    try {
      const doc = await this._getLocal(id);
      
      if (doc && !doc._deleted) {
        return doc;
      }
      
      return false;
    } catch (error) {
      console.error(`[DB:${this.dbName}] Error en get:`, error);
      throw error;
    }
  }

  async getWithHeader(id) {
    if (this.isWeb) {
      const all = await this._getAllLocal();
      return all.find((r) => r._id === id) || null;
    }
    const rows = await this.db.getAllAsync ("SELECT * FROM documents where _id=?", [id])
    return !rows || rows.length === 0 ? false : rows[0];
  }

  /**
   * Elimina un documento
   * @param {string} id - ID del documento
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async delete(id) {
    await this._ensureInitialized();
    
    try {
      const doc = await this._getLocal(id);
      
      if (!doc) {
        console.warn(`[DB:${this.dbName}] Documento ${id} no encontrado`);
        return false;
      }
      
      const deletedDoc = {
        ...doc,
        _deleted: true,
        _rev: this._incrementRev(doc._rev),
        syncStatus: 'pending'
      };
      
      await this._putLocal(deletedDoc);
      
      //console.log(`[DB:${this.dbName}] ✓ Documento ${id} marcado como eliminado`);
      
      // Si es remoto, sincronizar inmediatamente
      if (this.isRemote) {
        this._syncDocumentToRemote(deletedDoc).catch(err => {
          console.error(`[DB:${this.dbName}] Error sincronizando eliminación:`, err);
        });
      }
      
      return true;
    } catch (error) {
      console.error(`[DB:${this.dbName}] Error en delete:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los documentos (no eliminados)
   * @param {Object} query - Filtros opcionales (se buscan en el campo 'data')
   * @returns {Promise<Array>} Array de documentos
   */
  async getAll(query = {}) {
    await this._ensureInitialized();
    
    try {
      const allDocs = await this._getAllLocal();
      // Filtrar eliminados
      let docs = allDocs.filter(doc => !doc._deleted);

      if (query!={}){
        // Aplicar query si existe (buscar en el campo 'data')
        if (Object.keys(query).length > 0) {
          docs = docs.filter(doc => {
            // Buscar en el campo 'data' si existe
            const dataToSearch = doc.data || doc;
            return Object.keys(query).every(key => {
              return dataToSearch[key] === query[key];
            });
          });
        }
      }
      // mm - si trae el campo data lo devuelvo sino el doc entero

      return docs.map ((item)=> ({ ...item.data || item, id : item._id}));

    } catch (error) {
      //console.error(`[DB:${this.dbName}] Error en getAll:`, error);
      //console.error(`[DB:${this.dbName}] Estado: initialized=${this.initialized}, db=${!!this.db}, isWeb=${this.isWeb}`);
      //throw error;
    }
  }

  /**
   * Busca documentos que coincidan con un query
   * @param {Object} query - Objeto con criterios de búsqueda (se buscan en el campo 'data')
   * @returns {Promise<Array>} Array de documentos que coinciden
   */
  async find(query) {
    let result = await this.getAll(query);
    return result
  }

  // ==================== MÉTODOS LOCALES ====================

  // mm - por compatibilidad con lo que ya tengo
  async add (doc, id, sync=true)
  {
    return (await this.put (id,doc, sync))
  }
  /**
   * Guarda un documento en la base de datos local
   * @param {Object} doc - Documento a guardar
   * @param {boolean} shouldEmitEvent - Si debe emitir evento (default: true para cambios locales, false para sync)
   */
  async _putLocal(doc, shouldEmitEvent = true) {
    try{
      // Validar que la base de datos esté lista
      await this._validateDatabaseReady();

      // Validar que el documento sea válido
      if (!doc) {
        throw new Error('Documento es null o undefined');
      }
      
      if (!doc._id) {
        throw new Error('Documento no tiene _id');
      }
      
      if (this.isWeb) {
        await this.db.put('documents', doc);
      } else {
        // Si doc.data es string JSON válido → lo uso directamente
        let dataJson = ""
        if (typeof doc.data === 'string') {
          dataJson = doc.data;
        }
        // Si es objeto o undefined → lo serializo
        else {
          dataJson = JSON.stringify(doc.data || {});
        }

        // Validar que el JSON no esté vacío o sea inválido
        if (!dataJson || dataJson === 'null') {
          throw new Error(`Datos inválidos para documento ${doc._id}`);
        }
        /*console.log(`[_putLocal] Guardando documento ${doc._id}:`, {
          _rev: doc._rev,
          _deleted: doc._deleted,
          syncStatus: doc.syncStatus,
          data: dataJson,
          dataLength: dataJson.length
          });
          */
        await this.db.runAsync(
          `INSERT OR REPLACE INTO documents (_id, _rev, _deleted, syncStatus, data) 
          VALUES (?, ?, ?, ?, ?)`,[
            doc._id, 
            doc._rev || '1-new', 
            doc._deleted ? 1 : 0, 
            doc.syncStatus || 'synced',
            dataJson
          ]
        );
        
        //console.log(`[_putLocal] ✓ Documento ${doc._id} guardado correctamente`);
      }
      if (this.emitEvent && shouldEmitEvent)
      {
        // mm - genero evento de actualizacion
        let event = new DB_EVENT ()
        event.table = this.dbName
        event._id = doc._id
        event._rev = doc._rev
        event.data = doc.data
        event.source = "LOCAL"
        emitEvent(EVENT_DB_CHANGE, event)
      }
    }
    catch (e){
      console.log(`[_putLocal] Error guardando documento:`, {
        docId: doc?._id,
        error: e?.message || String(e),
        stack: e?.stack || 'No stack trace available'
      });
      throw e;
    }
  }

  /**
   * Obtiene un documento de la base de datos local
   */
  async _getLocal(id) {
    try{
      // Validar que la base de datos esté lista
      await this._validateDatabaseReady();
      
      if (!id) {
        throw new Error('ID es requerido para obtener documento');
      }
      
      if (this.isWeb) {
        let aux = await this.db.get('documents', id);
        return aux == undefined ? false : aux.data 
      } else {
        const result = await this.db.getFirstAsync(
          'SELECT * FROM documents WHERE _id = ?',
          [id]
        );
        
        if (result!= null) {
          const row = result;
          const doc = JSON.parse(row.data);
          doc._id = row._id;
          doc._rev = row._rev;
          doc._deleted = row._deleted === 1;
          doc.syncStatus = row.syncStatus;
          return doc;
        }
        
        return false;
      }
    }
    catch (e) {console.log ("getLocal"); console.log (e)}
    return null
  }

  /**
   * Obtiene todos los documentos de la base de datos local
   */
  async _getAllLocal() {
    // Validar que la base de datos esté lista
    await this._validateDatabaseReady();
    
    if (!this.db) {
      throw new Error(`[DB:${this.dbName}] Conexión a base de datos es null después de validación`);
    }
    
    /// mmm !! se obtiene todo el registro, incluyendo el header
    if (this.isWeb) {
      return  await this.db.getAll('documents');
    } else {
      try {
        const result = await this.db.getAllAsync('SELECT * FROM documents');
        return result.map(row => {
          const doc = {}
          doc.data = JSON.parse(row.data);
          doc._id = row._id;
          doc._rev = row._rev;
          doc._deleted = row._deleted === 1;
          doc.syncStatus = row.syncStatus;
          return doc;
        });
      } catch (error) {
        console.error(`[DB:${this.dbName}] Estado db:`, {
          hasDb: !!this.db,
          initialized: this.initialized,
          dbType: typeof this.db
        });
        throw error;
      }
    }
  }

  /**
   * Obtiene documentos pendientes de sincronización
   */
  async _getPendingDocs() {
    // Validar que la base de datos esté lista
    await this._validateDatabaseReady();
    
    if (this.isWeb) {
      const allDocs = await this.db.getAllFromIndex('documents', 'syncStatus', 'pending');
      return allDocs;
    } else {
      const result = await this.db.getAllAsync(
        'SELECT * FROM documents WHERE syncStatus = ?',
        ['pending']
      );
      
      return result.map(row => {
        const doc = JSON.parse(row.data);
        doc._id = row._id;
        doc._rev = row._rev;
        doc._deleted = row._deleted === 1;
        doc.syncStatus = row.syncStatus;
        return doc;
      });
    }
  }

  // ==================== SINCRONIZACIÓN ====================

  /**
   * Inicia el proceso de sincronización periódica
   */
  async _startSync() {
    //console.log(`[DB:${this.dbName}] Iniciando sincronización (cada ${this.syncInterval/1000}s)`);
    
    // Sincronización inicial
    await this._syncFromRemote();
    await this._syncPendingToRemote();
    
    // Programar sincronizaciones periódicas
    this.syncTimer = setInterval(async () => {
      if (!this.syncing) {
        await this._syncFromRemote();
        await this._syncPendingToRemote();
      }
    }, this.syncInterval);
  }

  /**
   * Detiene la sincronización periódica
   */
  stopSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      //console.log(`[DB:${this.dbName}] Sincronización detenida`);
    }
  }

  /**
   * Sincroniza cambios desde el servidor remoto
   */
  async _syncFromRemote() {
    if (this.syncing) return;
    
    this.syncing = true;
    
    try {
      // Validar y sanitizar lastSeq
      const safeLastSeq = this.lastSeq && String(this.lastSeq).trim() !== '' ? String(this.lastSeq) : '0';
      //console.log(`[DB:${this.dbName}] → Sincronizando desde remoto (seq: ${safeLastSeq})`);
      
      // Construir URL con filtro por usuario si está configurado
      let url = `${this.couchUrl}/${this.dbName}/_changes?include_docs=true&since=${safeLastSeq}`;
      
      let fetchOptions = {
        method: 'GET',
        headers: this._getAuthHeaders()
      };

      if (Object.keys(this.filterArray).length > 0) {
        // Verificar que _idUser esté definido
        if (!_idUser) {
          console.warn(`[DB:${this.dbName}] _idUser no está definido, saltando sincronización con filtros`);
          this.syncing = false;
          return;
        }
        
        // mm - cambio si el valor del campo es "" entonces remplazo por el userid
        const processedFilters = {};
        for (const [name, value] of Object.entries(this.filterArray)) {
          processedFilters["data." + name] = value === "" ? _idUser : value;
        }
        
        // Cambiar a POST y enviar el selector en el body
        url = `${this.couchUrl}/${this.dbName}/_changes?include_docs=true&since=${safeLastSeq}&filter=_selector`;

        // mmm - genera post o get segun si llevar selector o no
        fetchOptions = {
          method: 'POST',
          headers: {
            ...this._getAuthHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ selector: processedFilters })
        };
        //console.log(`[DB:${this.dbName}] Filtros aplicados:`, processedFilters);
        //console.log(`[DB:${this.dbName}] Body enviado:`, fetchOptions.body);
      }
      const response = await this._fetchWithTimeout(url, fetchOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DB:${this.dbName}] Error HTTP ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      
      //console.log(`[DB:${this.dbName}] Cambios recibidos: ${data.results.length}`);
      //console.log ("recibido remoto " + this.dbName)
      //console.log (data.results)
      // Procesar cada cambio
      for (const change of data.results) {
        await this._applyRemoteChange(change);
      }
      
      // Actualizar último seq
      if (data.last_seq) {
        await this._saveLastSeq(data.last_seq);
      }
      
      //console.log(`[DB:${this.dbName}] ✓ Sincronización desde remoto completada`);
    } catch (error) {
      console.log(`[DB:${this.dbName}] Error sincronizando desde remoto:`, error);
      console.log (error)
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Aplica un cambio recibido del servidor remoto
   * Usa resolución de conflictos basada en updatedAt: gana la versión más reciente
   */
  async _applyRemoteChange(change) {
    try {
      // Validar que el cambio tenga documento
      if (!change || !change.doc) {
        //console.log(`[DB:${this.dbName}] ⚠ Cambio sin documento válido, ignorando:`, change);
        return;
      }

      const remoteDoc = change.doc;
      
      // Validar que el documento tenga _id
      if (!remoteDoc._id) {
        //console.log(`[DB:${this.dbName}] ⚠ Documento remoto sin _id, ignorando:`, remoteDoc);
        return;
      }

      const localDoc = await this._getLocal(remoteDoc._id);
      
      if (!localDoc) {
        // No existe localmente, aplicar el cambio remoto directamente
        remoteDoc.syncStatus = 'synced';
        await this._putLocal(remoteDoc, true); // mm - emito evento porque viene del servidor
        //console.log(`[DB:${this.dbName}] ✓ Aplicado cambio remoto nuevo: ${remoteDoc._id}`);
      } else {
        // Existe localmente - resolver conflicto por updatedAt
        const localUpdatedAt = localDoc.data?.updatedAt ? new Date(localDoc.data.updatedAt).getTime() : 0;
        const remoteUpdatedAt = remoteDoc.data?.updatedAt ? new Date(remoteDoc.data.updatedAt).getTime() : 0;
        
        if (remoteUpdatedAt >= localUpdatedAt) {
          // La versión remota es más reciente o igual - aplicar
          remoteDoc.syncStatus = 'synced';
          await this._putLocal(remoteDoc, true); // mm - emito evento porque viene del servidor
          //console.log(`[DB:${this.dbName}] ✓ Aplicado cambio remoto más reciente: ${remoteDoc._id} (${new Date(remoteUpdatedAt).toISOString()} >= ${new Date(localUpdatedAt).toISOString()})`);
        } else {
          // La versión local es más reciente - mantener local y marcar para sincronizar
          localDoc.syncStatus = 'pending';
          await this._putLocal(localDoc, false); // No emitir evento - es una actualización de syncStatus
          //console.log(`[DB:${this.dbName}] ⚠ Versión local más reciente, manteniendo: ${localDoc._id} (${new Date(localUpdatedAt).toISOString()} > ${new Date(remoteUpdatedAt).toISOString()})`);
          
          // Programar sincronización inmediata para enviar la versión local al servidor
          if (this.isRemote) {
            this._syncDocumentToRemote(localDoc).catch(err => {
              console.log(`[DB:${this.dbName}] Error sincronizando versión local más reciente:`, err);
            });
          }
        }
      }
    } catch (error) {
      console.log(`[DB:${this.dbName}] Error aplicando cambio remoto:`, error);
    }
  }

  /**
   * Sincroniza documentos pendientes al servidor remoto
   */
  async _syncPendingToRemote() {
    try {
      const pendingDocs = await this._getPendingDocs();
      
      if (pendingDocs.length === 0) {
        return;
      }
      
      //console.log(`[DB:${this.dbName}] → Sincronizando ${pendingDocs.length} documentos pendientes`);
      
      for (const doc of pendingDocs) {
        await this._syncDocumentToRemote(doc);
      }
      
      //console.log(`[DB:${this.dbName}] ✓ Sincronización pendientes completada`);
    } catch (error) {
      console.error(`[DB:${this.dbName}] Error sincronizando pendientes:`, error);
    }
  }

  /**
   * Sincroniza un documento individual al servidor remoto
   * Implementa resolución de conflictos basada en updatedAt: gana la versión más reciente
   */
  async _syncDocumentToRemote(doc) {
    try {
      const url = `${this.couchUrl}/${this.dbName}/${doc._id}`;
      
      // Si el documento está eliminado
      if (doc._deleted) {
        // Primero obtener el _rev remoto
        const getResponse = await this._fetchWithTimeout(url, {
          method: 'GET',
          headers: this._getAuthHeaders()
        });
        
        if (getResponse.ok) {
          const remoteDoc = await getResponse.json();
          // Eliminar con el _rev correcto
          const deleteUrl = `${url}?rev=${remoteDoc._rev}`;
          const deleteResponse = await this._fetchWithTimeout(deleteUrl, {
            method: 'DELETE',
            headers: this._getAuthHeaders()
          });
          
          if (deleteResponse.ok) {
            doc.syncStatus = 'synced';
            await this._putLocal(doc, false); // No emitir evento - actualización de sync
            //console.log(`[DB:${this.dbName}] ✓ Documento ${doc._id} eliminado remotamente`);
          }
        } else if (getResponse.status === 404) {
          // Ya no existe remotamente, marcar como sincronizado
          doc.syncStatus = 'synced';
          await this._putLocal(doc, false); // No emitir evento - actualización de sync
        }
      } else {
        // Crear o actualizar documento
        // Primero verificar si existe en el servidor
        const checkResponse = await this._fetchWithTimeout(url, {
          method: 'GET',
          headers: this._getAuthHeaders()
        });
        
        let docToSend;
        let shouldSync = true;
        
        if (checkResponse.ok) {
          // El documento existe en el servidor - verificar cuál es más reciente
          const remoteDoc = await checkResponse.json();
          
          // Comparar timestamps updatedAt
          const localUpdatedAt = doc.data?.updatedAt ? new Date(doc.data.updatedAt).getTime() : 0;
          const remoteUpdatedAt = remoteDoc.data?.updatedAt ? new Date(remoteDoc.data.updatedAt).getTime() : 0;
          
          if (localUpdatedAt > remoteUpdatedAt) {
            // El documento local es más reciente - enviar al servidor
            docToSend = {
              _id: doc._id,
              _rev: remoteDoc._rev, // Usar el _rev del servidor
              _deleted: doc._deleted,
              data: doc.data
            };
            //console.log(`[DB:${this.dbName}] Cliente más reciente (${new Date(localUpdatedAt).toISOString()} > ${new Date(remoteUpdatedAt).toISOString()}), actualizando servidor`);
          } else if (remoteUpdatedAt > localUpdatedAt) {
            // El documento remoto es más reciente - actualizar local
            //console.log(`[DB:${this.dbName}] Servidor más reciente (${new Date(remoteUpdatedAt).toISOString()} > ${new Date(localUpdatedAt).toISOString()}), actualizando cliente`);
            remoteDoc.syncStatus = 'synced';
            await this._putLocal(remoteDoc, false); // No emitir evento - viene del servidor
            shouldSync = false; // No enviar al servidor
          } else {
            // Timestamps iguales o sin updatedAt - enviar al servidor (por defecto)
            docToSend = {
              _id: doc._id,
              _rev: remoteDoc._rev,
              _deleted: doc._deleted,
              data: doc.data
            };
            //console.log(`[DB:${this.dbName}] Timestamps iguales o sin updatedAt, actualizando servidor`);
          }
        } else if (checkResponse.status === 404) {
          // El documento NO existe en el servidor, NO enviar _rev
          docToSend = {
            _id: doc._id,
            // NO incluir _rev para documentos nuevos
            _deleted: doc._deleted,
            data: doc.data
          };
          //console.log(`[DB:${this.dbName}] Creando documento nuevo ${doc._id} sin _rev`);
        } else {
          // Error al verificar
          throw new Error(`Error verificando documento: HTTP ${checkResponse.status}`);
        }
        
        // Enviar el documento solo si debe sincronizarse
        if (shouldSync) {
          const response = await this._fetchWithTimeout(url, {
            method: 'PUT',
            headers: {
              ...this._getAuthHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(docToSend)
          });
          
          if (response.ok) {
            const result = await response.json();
            // Actualizar con el _rev del servidor
            doc._rev = result.rev;
            doc.syncStatus = 'synced';
            await this._putLocal(doc, false); // No emitir evento - actualización de syncStatus
            //console.log(`[DB:${this.dbName}] ✓ Documento ${doc._id} sincronizado remotamente con _rev ${result.rev}`);
          } else {
            const errorText = await response.text();
            console.error(`[DB:${this.dbName}] Error HTTP ${response.status} al sincronizar ${doc._id}:`, errorText);
          }
        }
      }
    } catch (error) {
      console.log(`[DB:${this.dbName}] Error sincronizando documento ${doc._id}:`, error);
    }
  }

  // ==================== METADATOS Y SEQ ====================

  /**
   * Carga el último seq guardado
   */
  async _loadLastSeq() {
    try {
      if (this.isWeb) {
        const metadata = await this.db.get('metadata', 'lastSeq');
        this.lastSeq = metadata ? String(metadata.value) : '0';
      } else {
        const result = await this.db.getAllAsync(
          'SELECT value FROM metadata WHERE key = ?',
          ['lastSeq']
        );
        this.lastSeq = result.length > 0 ? String(result[0].value) : '0';
      }
      //console.log(`[DB:${this.dbName}] Último seq cargado: ${this.lastSeq}`);
    } catch (error) {
      console.error(`[DB:${this.dbName}] Error cargando lastSeq:`, error);
      this.lastSeq = '0';
    }
  }

  /**
   * Guarda el último seq
   */
  async _saveLastSeq(seq) {
    try {
      this.lastSeq = seq;
      
      if (this.isWeb) {
        await this.db.put('metadata', { key: 'lastSeq', value: seq });
      } else {
        await this.db.runAsync(
          'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
          ['lastSeq', seq.toString()]
        );
      }
      //console.log(`[DB:${this.dbName}] ✓ lastSeq guardado: ${seq}`);
    } catch (error) {
      console.error(`[DB:${this.dbName}] Error guardando lastSeq:`, error);
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Fetch con timeout
   */
  async _fetchWithTimeout(url, options = {}) {
    const timeout = options.timeout || this.fetchTimeout;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Timeout después de ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Obtiene headers de autenticación
   */
  _getAuthHeaders() {
    if (this.username && this.password) {
      const credentials = btoa(`${this.username}:${this.password}`);
      return {
        'Authorization': `Basic ${credentials}`
      };
    }
    return {};
  }

  /**
   * Genera un ID único
   */
  _generateId() {
    return getUId()
    //return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Incrementa el número de revisión
   */
  _incrementRev(rev) {
    if (!rev) return '1-' + this._generateId();
    
    const [num, hash] = rev.split('-');
    const newNum = parseInt(num) + 1;
    return `${newNum}-${this._generateId()}`;
  }

  /**
   * Compara dos revisiones
   * @returns {number} 1 si rev1 > rev2, -1 si rev1 < rev2, 0 si iguales
   */
  _compareRevs(rev1, rev2) {
    const [num1] = rev1.split('-');
    const [num2] = rev2.split('-');
    return parseInt(num1) - parseInt(num2);
  }

  /**
   * Asegura que la DB esté inicializada
   */
  async _ensureInitialized() {
    let attempts = 0;
    while (!this.initialized && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!this.initialized) {
      throw new Error(`[DB:${this.dbName}] Timeout esperando inicialización`);
    }
    
    // Validar que la conexión a la base de datos esté disponible
    if (!this.db) {
      throw new Error(`[DB:${this.dbName}] Base de datos no está disponible`);
    }
  }

  /**
   * Valida que la base de datos esté lista para transacciones
   */
  async _validateDatabaseReady() {
    if (!this.initialized) {
      console.warn(`[DB:${this.dbName}] Base de datos no inicializada, intentando reinicializar...`);
      try {
        await this.initDB();
      } catch (error) {
        throw new Error(`[DB:${this.dbName}] Falló la reinicialización: ${error?.message || String(error)}`);
      }
    }
    
    if (!this.db) {
      console.warn(`[DB:${this.dbName}] Conexión no disponible, intentando reabrir...`);
      try {
        if (this.isWeb) {
          await this._initIndexedDB();
        } else {
          await this._initSQLite();
        }
      } catch (error) {
        throw new Error(`[DB:${this.dbName}] Falló la reconexión: ${error?.message || String(error)}`);
      }
    }
    
    // Para SQLite, verificar que la conexión esté activa
    if (!this.isWeb && this.db) {
      try {
        // Verificar que la conexión SQLite esté activa
        //await this.db.getAllAsync('SELECT 1');
      } catch (error) {
        console.error(`[DB:${this.dbName}] Error en validación SQLite:`, error);
        // Intentar reabrir la base de datos una vez más
        try {
          //console.warn(`[DB:${this.dbName}] Intentando reconectar SQLite...`);
          this.db = await SQLite.openDatabaseAsync(this.dbName);
          //console.log(`[DB:${this.dbName}] ✓ Reconexión SQLite exitosa`);
        } catch (retryError) {
          throw new Error(`[DB:${this.dbName}] Base de datos SQLite no responde: ${error?.message || String(error)}`);
        }
      }
    }
  }

  // ==================== LIMPIEZA ====================

  /**
   * Cierra la conexión y detiene sincronización
   */
  async close() {
    console.log(`[DB:${this.dbName}] Cerrando...`);
    
    this.stopSync();
    
    if (this.isWeb && this.db) {
      this.db.close();
    }
    
    this.initialized = false;
    this.db = null;
    
    console.log(`[DB:${this.dbName}] ✓ Cerrado`);
  }

  /**
   * Elimina completamente la base de datos
   */
  async destroy() {
    console.log(`[DB:${this.dbName}] Destruyendo base de datos...`);
    
    await this.close();
    
    if (this.isWeb) {
      await new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(this.dbName);
        request.onsuccess = resolve;
        request.onerror = reject;
      });
    } else {
      this.db = await SQLite.openDatabaseAsync(this.dbName);
      await this.db.execAsync('DROP TABLE IF EXISTS documents');
      await this.db.execAsync('DROP TABLE IF EXISTS metadata');
      this.db = null;
    }
    
    console.log(`[DB:${this.dbName}] ✓ Base de datos destruida`);
  }
}

export default DB;
