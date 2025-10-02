import { Platform } from 'react-native';
import { openDatabase, openDatabaseAsync } from "expo-sqlite";
import fetch from 'cross-fetch';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const DB_LOCAL = "LOCAL"
export const DB_REMOTE = "REMOTE"

// Intervalo de sincronización en milisegundos (configurable)
const SYNC_INTERVAL_MS = 5000;       // 5 segundos para sync general
const PUSH_LOCAL_INTERVAL_MS = 1000;  // 1 segundo para pushes inmediatos
const MAX_RETRY_ATTEMPTS = 5;         // Número máximo de intentos
const INITIAL_RETRY_DELAY = 2000;     // Delay inicial entre reintentos
const FETCH_TIMEOUT = 30000;          // 30 segundos de timeout para fetch
const MAX_RETRY_DELAY = 60000;        // Máximo delay entre reintentos
const CONNECTION_TIMEOUT = 5000;      // Timeout para verificar conexión


function getAuthHeader(remoteUser, remotePwd) {
    if (remoteUser && remotePwd) {
      const token = btoa(`${remoteUser}:${remotePwd}`);
      return { 'Authorization': `Basic ${token}`, "Content-Type" : "application/json" };
    }
    return {};
}

function objectToQueryString(obj) {
  if (!obj || typeof obj !== 'object') return '';
  return Object.entries(obj)
    .filter(([_, value]) => value === null || ['string','number','boolean'].includes(typeof value))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export class DB {
    constructor(name, type, urlSync)
    {
      this.type = type
      this.urlSync = urlSync
      this.remoteUser = "admin"
      this.remotePwd = "admin"
      this.sync = {}
      this.name = name
      this.data = [] // mm - bd local en memoria
      this.firstLoad = true // mm - si ya se cargo la primera vez data
      this.isReady = false

      console.log ("- Iniciando BD " + this.name)
      this.db = new LocalDB(this.name)
      
      // Inicializar la base de datos inmediatamente
      this.initPromise = this.firstInit()

      if (this.type == DB_REMOTE)
      {  this.listeners = new Listeners (urlSync, name)}

    }

    getDB ()
    {
      return (this.db)
    }
    // mm - genero un listener 
    changes (options={}, callback)
    {return this.listeners.addListener(options, this.remoteUser, this.remotePwd, callback)}

    removeListener (idListener)
    { this.listeners.removeListener (idListener)}

    removeAllListeners()
    { this.listeners.removeAllListeners()}

    async firstInit() {
      try {
        await this.db.init();
        await this.init();
        this.isReady = true;
        return true;
      } catch (error) {
        console.error(`Error initializing database ${this.name}:`, error);
        throw error;
      }
    }

    async ensureReady() {
      if (!this.isReady) {
        await this.initPromise;
      }
    }
    async init()
    {
      if (this.type==DB_REMOTE)
        {
            console.log ("- Iniciando conexion con " + this.name + " iniciada")
            this.sync = new SyncManager(this.db, this.urlSync, "", "1234", this.remoteUser, this.remotePwd)
            console.log ("- Finalizando conexion con " + this.name + " iniciada")
        }
    }

    async find(data) {
      await this.ensureReady();
      return await this.db.find(data);
    }
    
    async add(id, doc) {
      await this.ensureReady();
      try {
            id = id == "" || id == null || id == undefined ? uuidv4() : id
            
            let aux = await this.db.add (id, doc) 
            if (aux && this.type == DB_REMOTE) {
              // mm - espero unos segundos para que la base de datos local se actualice
              // Iniciar sincronización con un pequeño retraso
              if (!this.sync.isSyncing) {
                setTimeout(async () => {
                  await this.sync.pushLocal();
                }, 500);
              } else {
                this.sync.pendingSyncRequest = true;
              }
            }

            return ({_id: id, ...doc})
        }
        catch (e){console.log ("Error add: " + JSON.stringify(e))}
      }
      async delete(_id) { return await this.db.delete (_id) }
      async get(_id) { return await this.db.get (_id) }
      async update(doc) { 

        let aux = await this.db.update (doc) 

          if (this.type == DB_REMOTE) {
            // mm - espero unos segundos para que la base de datos local se actualice
              setTimeout(async () => {
                await this.sync.pushLocal();
              }, PUSH_LOCAL_INTERVAL_MS);
            }
        return aux }
      async getWithHeader(_id) { return await this.db.getWithHeader (_id) }

      async getAll() {

        // mm - despues de cargar data la primera vez se devuelve solo el array
        //if (!this.firstLoad)
        //{ 
        //  return this.data
        //}

        this.firstLoad = false

        try{
          let aux = await this.db.getAll()
          if (this.db.dbType === 'idb')
            return aux === undefined ? [] : aux.map((item) => {return {...item.data, id : item._id}});
          
          return aux === undefined ? [] : aux.map(item => {return {...JSON.parse(item.data), id : item._id}});
            
        }
        catch (e) {console.log (e)}}
      
}

export class LocalDB {
  constructor(name) {
    this.name = name;
    this.db = undefined;
    this.isInitialized = false;
    this.initPromise = null;

    if (Platform.OS === 'web') {
      this.dbType = 'idb';
    } else {
      this.dbType = 'sqlite';
    }
  }

  async firstInit()
  {
    
    await this.init()
  }

  async init() {
    try {
      if (this.isInitialized && this.db) {
        // Verificar que la conexión sigue activa
        if (this.dbType === 'sqlite') {
          try {
            await this.db.execAsync('SELECT 1');
            return;
          } catch (e) {
            console.log('Conexión perdida, reinicializando...');
            this.isInitialized = false;
            this.db = null;
          }
        } else {
          return;
        }
      }

      console.log("Iniciando BD " + this.dbType + ": " + this.name);
      
      if (this.dbType === 'idb') {
        try {
          this.db = await openDB(this.name, 1, {
            upgrade(db) {
              if (!db.objectStoreNames.contains('docs')) {
                const store = db.createObjectStore('docs', { keyPath: '_id' });
                store.createIndex('dirty', 'dirty');
              }
              if (!db.objectStoreNames.contains('meta')) {
                db.createObjectStore('meta');
              }
            },
          });

          if (!this.db || !this.db.objectStoreNames.contains('docs')) {
            throw new Error('La base de datos IndexedDB no se inicializó correctamente');
          }
        } catch (e) {
          console.error('Error inicializando IndexedDB:', e);
          this.isInitialized = false;
          throw e;
        }
      } else {
        try {
          console.log("Iniciando SQLite DB:", this.name);
          
          // Cerrar conexión anterior si existe
          if (this.db) {
            try {
              await this.db.closeAsync();
            } catch (e) {
              console.warn('Error al cerrar conexión anterior:', e);
            }
            this.db = null;
          }
          
          // Abrir nueva conexión
          this.db = await openDatabaseAsync(this.name);
          console.log (this.db)
          if (!this.db) {
            throw new Error('No se pudo abrir la base de datos SQLite');
          }

          try {
            // Crear tablas una por una para mejor control de errores

            
            await this.db.execAsync(`
              CREATE TABLE IF NOT EXISTS docs (
                _id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                dirty INTEGER DEFAULT 0,
                deleted INTEGER DEFAULT 0,
                updatedAt INTEGER,
                _rev TEXT
              )
            `);
            console.log("Tabla docs creada");

            await this.db.execAsync(`
              CREATE INDEX IF NOT EXISTS idx_docs_dirty 
              ON docs(dirty) 
              WHERE dirty = 1
            `);
            console.log("Índice docs_dirty creado");

            await this.db.execAsync(`
              CREATE TABLE IF NOT EXISTS meta (
                key TEXT PRIMARY KEY,
                value TEXT
              )
            `);
            console.log("Tabla meta creada");

           
          } catch (error) {
            console.error("Error al crear/verificar tablas:", error);
            await this.db.closeAsync();
            this.db = null;
            throw error;
          }
        } catch (error) {
          console.error("Error detallado en inicialización SQLite:", {
            error: error.message,
            stack: error.stack,
            name: this.name
          });
          this.isInitialized = false;
          this.db = null;
          throw error;
        }
      }

      this.isInitialized = true;
      console.log(`Base de datos ${this.name} inicializada correctamente`);
    } catch (e) {
      console.error(`Error fatal en init de ${this.name}:`, e);
      this.isInitialized = false;
      this.db = null;
      throw e;
    }
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  async find(data) {
    await this.ensureInitialized();
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      return [];
    }

    if (this.dbType === 'idb') {
      // IndexedDB: filtrar en memoria
      const allDocs = await this.db.getAll('docs');
      return allDocs
        .filter(doc => {
          if (doc.deleted == 1) return false;
          for (const [key, value] of Object.entries(data)) {
        // Buscar en doc.data (puede ser objeto o string)
        let docData = doc.data;
        if (typeof docData === 'string') {
          try { docData = JSON.parse(docData); } catch {}
        }
        if (docData[key] !== value) return false;
          }
          return true;
        })
        .map(doc => {
          let docData = doc.data;
          if (typeof docData === 'string') {
        try { docData = JSON.parse(docData); } catch {}
          }
          return { ...docData };
        });
    } else {
      // SQLite: construir WHERE dinámico
      const keys = Object.keys(data);
      const where = keys.map(k => `json_extract(data, '$.${k}') = ?`).join(' AND ');
      const values = keys.map(k => data[k]);
      const sql = `SELECT * FROM docs WHERE deleted=0 AND ${where}`;
      console.log (sql)
      const rows = await this.db.getAllAsync(sql, values);
      return rows;
    }
  }

  async getMeta(key){
    if(this.dbType==='idb') return await this.db.get('meta', key);
    const res = await this.db.execAsync('SELECT value FROM meta WHERE key=?',[key]);
    return res && res.length > 0 ? res[0].value : "";
  }

  async setMeta(key,value){
    if(this.dbType==='idb'){ 
      await this.db.put('meta', value, key); 
    } else { 
      await this.db.execAsync('INSERT OR REPLACE INTO meta (key,value) VALUES (?,?)',[key,value]);
    }
  }

  async add(id, doc) { 
    try {
      const docId = id || uuidv4();
      console.log('Agregando documento con ID:', docId);
      
      const docToSave = {
        _id: docId,
        data: doc,
        dirty: 1,  // Aseguramos que se marca como sucio
        deleted: 0,
        updatedAt: Date.now(),
        _rev: ""
      };

      const result = await this.upsert(docToSave);
      if (result) {
        console.log('Documento agregado y marcado como sucio:', docId);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error en add:", e);
      return false;
    }
  }
  async delete(_id) { 
    const doc = await this.get(_id); 
    if (!doc) return; 
    doc.deleted = 1; 
    doc.dirty = 1; 
    doc.updatedAt = Date.now(); 
    await this.upsert(doc); 
  }

  async getWithHeader(_id) { 
    try{

      if (this.dbType === 'idb') 
      { let rows = await this.db.get('docs', _id) 
        console.log (rows)

        return (rows == undefined ? false :  {...rows} )
        
      }
      else
      { 
        console.log ("ENTRO1")
        console.log (this.db)
      let rows = await this.db.execAsync('SELECT * FROM docs WHERE deleted=0 and _id=?', [_id] )}

      console.log (rows)
      if (rows== null ) return false
      
      rows.data = JSON.parse (rows.data)
      return (rows)
    }
    catch (error) {console.log("❌ Error ejecutando get:", error);
      return false
    }
  }

  async get(_id) { 
    try{

      if (this.dbType === 'idb') {
        let rows = await this.db.get('docs', _id);
        return (rows == undefined ? false :  {...rows.data, _id: rows._id, _rev: rows._rev} );
      } else {
        // Preferir helper getFirstAsync si existe (altas probabilidades en runtime)
        if (typeof this.db.getFirstAsync === 'function') {
          const rows = await this.db.getFirstAsync('SELECT * FROM docs WHERE deleted=0 and _id=?', [_id]);
          if (rows == null) return false;
          let aux = JSON.parse(rows.data);
          aux._id = rows._id;
          aux._rev = rows._rev;
          return aux;
        }

        // Fallback usando execAsync (forma más genérica)
        const rowsRes = await this.db.execAsync('SELECT * FROM docs WHERE deleted=0 and _id=?', [_id]);
        // execAsync puede devolver un array de resultados (depende de la implementación)
        const row = Array.isArray(rowsRes) && rowsRes[0] && rowsRes[0].values && rowsRes[0].values[0]
                    ? rowsRes[0].values[0]
                    : rowsRes && rowsRes.length > 0 ? rowsRes[0] : null;

        if (!row) return false;

        // Si el resultado viene como objeto con campos, intentar parsear la columna data
        const dataStr = row.data || row[1] || row.data; // intentar varios índices/propiedades
        const parsed = (typeof dataStr === 'string') ? JSON.parse(dataStr) : dataStr;
        const aux = { ...parsed, _id: row._id || row[0], _rev: row._rev || '' };
        return aux;
      }
    }
    catch (error) {console.log("❌ Error ejecutando get:", error);
      return false
    }
  }

  async update(doc) { 
    doc.dirty = 1; 
    doc.updatedAt = Date.now(); 
    return (await this.upsert(doc)); 
  }

  async getAll() { 
    if (this.dbType==='idb') 
    { this.data = await this.db.getAll('docs')
      return this.data.filter ((item)=> item.deleted==0); 
    }
    this.data = await this.db.getAllAsync('SELECT * FROM docs where deleted=0'); 
    return this.data
  }

  async getDirty() { 
    try {
      // Asegurarse de que la base de datos está inicializada
      if (!this.db) {
        console.error('Error en getDirty: La base de datos no está inicializada');
        return [];
      }

      if (this.dbType === 'idb') {
        try {
          console.log('Buscando documentos sucios en IndexedDB...');
          const aux = await this.db.getAll('docs');
          console.log('Total documentos en IDB:', aux ? aux.length : 0);
          
          if (!aux) return [];
          
          const dirtyDocs = aux.filter(item => {
            // Convertir cualquier valor de dirty a numérico
            const isDirty = Number(item.dirty) === 1;
            if (isDirty) {
              console.log('Documento sucio encontrado:', item._id);
            }
            return isDirty;
          });
          
          console.log('Total documentos sucios encontrados:', dirtyDocs.length);
          return dirtyDocs;
        } catch (idbError) {
          console.error('Error en getDirty (IndexedDB):', idbError);
          return [];
        }
      }
      
      // SQLite
      try {
        console.log('Ejecutando consulta SQLite para obtener documentos dirty');
        const result = await this.db.getAllAsync(`
          SELECT * FROM docs 
          WHERE dirty = 1 AND deleted = 0
        `);
        
        console.log(`Encontrados ${result ? result.length : 0} documentos dirty`);
        
        if (!result) {
          console.log('No se encontraron documentos dirty');
          return [];
        }

        // Convertir los datos JSON almacenados como string
        const processed = result.map(row => {
          try {
            return {
              ...row,
              data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
            };
          } catch (parseError) {
            console.error(`Error al procesar documento ${row._id}:`, parseError);
            return null;
          }
        }).filter(doc => doc !== null);

        return processed;
      } catch (sqliteError) {
        console.error('Error en getDirty (SQLite):', sqliteError);
        return [];
      }
    } catch (error) {
      console.error('Error general en getDirty:', error);
      return [];
    }
  }

  async upsert(doc) { 
    if (!doc || !doc._id) {
      console.error('Error en upsert: documento inválido');
      return false;
    }

    try {
      await this.ensureInitialized();

      // Preparar datos
      const data = doc.data || {};
      const dirty = doc.dirty ? 1 : 0;
      const deleted = doc.deleted ? 1 : 0;
      const updatedAt = doc.updatedAt || Date.now();
      const _rev = doc._rev || '';

      if (this.dbType === 'idb') {
        try {
          const docToSave = {
            _id: doc._id,
            data: data,
            dirty: doc.dirty === true || doc.dirty === 1 ? 1 : 0,
            deleted: deleted,
            updatedAt: updatedAt,
            _rev: _rev
          };
          
          await this.db.put('docs', docToSave);
          return true;
        } catch (idbError) {
          console.error('Error en upsert IDB:', idbError);
          return false;
        }
      } else {
        try {
          // Para SQLite: usar una única operación atómica
          let dataStr = typeof data === 'string' ? data : JSON.stringify(data);

          // Asegurar que nunca enviamos NULL al campo data (NOT NULL constraint)
          if (dataStr === null || dataStr === undefined) {
            console.warn(`upsert: dataStr was null/undefined for _id=${doc._id}, coercing to '{}'`);
            dataStr = '{}';
          }

          // Coerciones explícitas para evitar valores no esperados
          const dirtyNum = Number(dirty) ? 1 : 0;
          const deletedNum = Number(deleted) ? 1 : 0;

          // Usar una transacción simple para garantizar atomicidad
          const query = `
            INSERT OR REPLACE INTO docs 
            (_id, data, dirty, deleted, updatedAt, _rev) 
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          try {
            const params = [doc._id, dataStr, dirtyNum, deletedNum, updatedAt, _rev];
            // Log params before executing to capture exact values sent to native
            try {
              console.log('upsert executing SQL with params:', {
                sql: query.replace(/\s+/g, ' ').trim(),
                paramsPreview: params.map(p => (typeof p === 'string' && p.length > 200) ? p.slice(0,200) + '...' : p),
                paramTypes: params.map(p => typeof p),
              });
            } catch (logErr) {
              console.warn('Could not log upsert params:', logErr);
            }

            // Use runAsync for parameterized single-statement execution (safer binding semantics)
            const result = await this.db.runAsync(query, params);

            if (result === undefined || result === null) {
              throw new Error('No se pudo confirmar la operación de upsert');
            }

            return true;
          } catch (sqliteError) {
            // Loguear información de diagnóstico para entender por qué la columna data quedó NULL
            try {
              console.error('Error en upsert SQLite (param bind):', sqliteError, 'para documento:', doc._id);
              console.error('Upsert params (param bind):', {
                _id: doc._id,
                dataStrPreview: (typeof dataStr === 'string' && dataStr.length > 200) ? dataStr.slice(0,200) + '...': dataStr,
                dirty: dirtyNum,
                deleted: deletedNum,
                updatedAt,
                _rev
              });
            } catch (logErr) {
              console.error('Error logging upsert failure details:', logErr);
            }

            // Intentar fallback: construir INSERT inline escapando comillas para evitar problemas con binding nativo
            try {
              const escapeSqlString = (s) => String(s).replace(/'/g, "''");
              const inlineData = `'${escapeSqlString(dataStr)}'`;
              const inlineRev = _rev ? `'${escapeSqlString(_rev)}'` : "''";
              const inlineSql = `INSERT OR REPLACE INTO docs (_id, data, dirty, deleted, updatedAt, _rev) VALUES ('${escapeSqlString(doc._id)}', ${inlineData}, ${dirtyNum}, ${deletedNum}, ${updatedAt}, ${inlineRev})`;

              console.warn('Attempting fallback inline upsert SQL for _id=' + doc._id);
              console.log('Fallback SQL preview:', inlineSql.replace(/\s+/g,' ').trim().slice(0,400) + (inlineSql.length>400?'...':''));

              const fallbackRes = await this.db.execAsync(inlineSql);
              console.log('Fallback upsert result for', doc._id, fallbackRes);
              return true;
            } catch (fallbackErr) {
              console.error('Fallback inline upsert also failed for _id=' + doc._id, fallbackErr);
              return false;
            }
          }
        } catch (sqliteError) {
          console.error('Error en upsert SQLite:', sqliteError, 'para documento:', doc._id);
          return false;
        }
      }
    } catch (e) {
      console.error('Error general en upsert para documento:', doc._id, e);
      return false;
    }
  }

  async markClean(_id, _rev) {
    try {
      if (this.dbType === 'idb') {
        const doc = await this.db.get('docs', _id);
        if (doc) {
          doc.dirty = 0;  // Cambiado a numérico
          if (_rev) doc._rev = _rev;
          await this.db.put('docs', doc);
          console.log(`Documento ${_id} marcado como limpio en IndexedDB`);
        }
      } else {
        if (_rev) {
          await this.db.runAsync(
            'UPDATE docs SET dirty = 0, _rev = ? WHERE _id = ?',
            [_rev, _id]
          );
        } else {
          await this.db.runAsync(
            'UPDATE docs SET dirty = 0 WHERE _id = ?',
            [_id]
          );
        }
        console.log(`Documento ${_id} marcado como limpio en SQLite`);
      }
      return true;
    } catch (error) {
      console.error(`Error al marcar documento ${_id} como limpio:`, error);
      return false;
    }
  }
}


class SyncManager {
  constructor(localDB, couchUrl, filterBy, userId, remoteUser, remotePwd) {
    this.localDB = localDB;
    this.couchUrl = couchUrl + "/" + localDB.name;
    this.filterBy = filterBy;
    this.userId = userId;
    this.remoteUser = remoteUser;
    this.remotePwd = remotePwd;
    
    // Control de sincronización
    this.syncQueue = [];
    this.isProcessingQueue = false;
    this.lastSeq = null;
    this.syncInProgress = false;
    
    // Configuración de timeouts y reintentos
    this.syncTimeouts = {
      fetch: 30000,      // 30 segundos para operaciones fetch
      retry: 2000,       // Tiempo base entre reintentos
      maxRetry: 30000,   // Máximo tiempo entre reintentos
      queue: 500         // Tiempo entre procesamiento de cola
    };
    
    this.initSync();
  }

  async initSync() {
    try {
      // Recuperar última secuencia sincronizada
      this.lastSeq = await this.localDB.getMeta('last_seq') || '0';
      
      // Iniciar procesamiento de cola
      this.startQueueProcessor();
      
      // Realizar sincronización inicial
      await this.fullSync();
    } catch (error) {
      console.error('Error en inicialización de sync:', error);
    }
  }

  /**
   * Agrega un documento a la cola de sincronización
   * @param {string} docId - ID del documento a sincronizar
   * @param {string} action - Acción a realizar ('push' o 'pull')
   */
  async queueSync(docId, action = 'push') {
    const queueItem = { docId, action, timestamp: Date.now() };
    this.syncQueue.push(queueItem);
    
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Procesa la cola de sincronización
   */
  async processQueue() {
    if (this.isProcessingQueue || this.syncQueue.length === 0) return;

    this.isProcessingQueue = true;
    
    try {
      while (this.syncQueue.length > 0) {
        const batch = this.syncQueue.splice(0, 5); // Procesar hasta 5 documentos a la vez
        const uniqueDocs = new Map(); // Eliminar duplicados usando el último estado
        
        batch.forEach(item => uniqueDocs.set(item.docId, item));
        
        await Promise.all(
          Array.from(uniqueDocs.values()).map(item =>
            this.syncDocument(item.docId, item.action)
          )
        );
        
        await new Promise(resolve => setTimeout(resolve, this.syncTimeouts.queue));
      }
    } catch (error) {
      console.error('Error procesando cola de sync:', error);
    } finally {
      this.isProcessingQueue = false;
      
      // Verificar si hay nuevos items mientras procesábamos
      if (this.syncQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * Sincroniza un documento específico
   * @param {string} docId - ID del documento
   * @param {string} action - Acción a realizar
   */
  async syncDocument(docId, action) {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const localDoc = await this.localDB.getWithHeader(docId);
        if (!localDoc) return; // Documento no existe localmente
        
        if (action === 'push' && Number(localDoc.dirty) === 1) {
          await this.pushToRemote(localDoc);
        } else if (action === 'pull') {
          await this.pullFromRemote(docId);
        }
        
        return;
      } catch (error) {
        retryCount++;
        if (error.status === 409) {
          // Conflicto detectado, resolver
          await this.handleConflict(docId);
          return;
        }
        
        if (retryCount === maxRetries) {
          console.error(`Error sincronizando documento ${docId}:`, error);
          return;
        }
        
        // Esperar antes de reintentar
        await new Promise(resolve => 
          setTimeout(resolve, Math.min(
            this.syncTimeouts.retry * Math.pow(2, retryCount),
            this.syncTimeouts.maxRetry
          ))
        );
      }
    }
  }

  /**
   * Maneja conflictos entre versiones de documentos
   */
  async handleConflict(docId) {
    try {
      const localDoc = await this.localDB.getWithHeader(docId);
      const remoteDoc = await this.fetchRemoteDoc(docId);
      
      if (!localDoc || !remoteDoc) return;
      
      // Si el documento remoto es más reciente, actualizamos local
      if (new Date(remoteDoc._rev) > new Date(localDoc._rev)) {
        await this.localDB.upsert({
          _id: docId,
          data: remoteDoc,
          dirty: 0,
          deleted: remoteDoc._deleted || 0,
          _rev: remoteDoc._rev
        });
      } else {
        // Si el local es más reciente, forzamos push
        await this.pushToRemote(localDoc, true);
      }
    } catch (error) {
      console.error(`Error manejando conflicto para ${docId}:`, error);
    }
  }

  /**
   * Envía un documento al servidor remoto
   */
  async pushToRemote(doc, force = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.syncTimeouts.fetch);
    
    try {
      const headers = getAuthHeader(this.remoteUser, this.remotePwd);
      let docToSend = typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data;
      docToSend._id = doc._id;
      if (doc._rev && !force) docToSend._rev = doc._rev;
      
      const response = await fetch(`${this.couchUrl}/${doc._id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(docToSend),
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      await this.localDB.markClean(doc._id, result.rev);
      
    } catch (error) {
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Obtiene un documento del servidor remoto
   */
  async fetchRemoteDoc(docId) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.syncTimeouts.fetch);
    
    try {
      const headers = getAuthHeader(this.remoteUser, this.remotePwd);
      const response = await fetch(`${this.couchUrl}/${docId}`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Realiza una sincronización completa
   */
  async fullSync() {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    try {
      // Primero enviamos cambios locales
      const dirtyDocs = await this.localDB.getDirty();
      for (const doc of dirtyDocs) {
        await this.queueSync(doc._id, 'push');
      }
      
      // Luego obtenemos cambios remotos
      await this.pullChanges();
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Obtiene cambios del servidor remoto
   */
  async pullChanges() {
    try {
      const params = new URLSearchParams({
        include_docs: 'true',
        since: this.lastSeq,
        filter: this.filterBy,
        userId: this.userId
      });
      
      const headers = getAuthHeader(this.remoteUser, this.remotePwd);
      const response = await fetch(`${this.couchUrl}/_changes?${params}`, { headers });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const changes = await response.json();
      
      for (const change of changes.results) {
        if (!change.doc) continue;
        
        await this.localDB.upsert({
          _id: change.doc._id,
          data: change.doc,
          dirty: 0,
          deleted: change.doc._deleted ? 1 : 0,
          _rev: change.doc._rev
        });
      }
      
      this.lastSeq = changes.last_seq;
      await this.localDB.setMeta('last_seq', this.lastSeq);
    } catch (error) {
      console.error('Error obteniendo cambios remotos:', error);
    }
  }

  /**
   * Inicia el procesador de cola
   */
  startQueueProcessor() {
    setInterval(() => {
      if (!this.isProcessingQueue && this.syncQueue.length > 0) {
        this.processQueue();
      }
    }, this.syncTimeouts.queue);
  }

  async firstInit ()
  {
    try{
      await this.init()
      await this.syncOnce()
      this.startRealTimeSync();
    }
    catch (e) { console.log ("Error firstInit: " + JSON.stringify(e))}
  }

  async init(){
    try{
      const savedSeq = await this.localDB.getMeta('last_seq');
      this.lastSeq = savedSeq || 0;
    }
    catch (e) {console.log (JSON.stringify(e))}
  }

  async syncOnce(){ 
    // Proceso de sincronización periódica en paralelo
    if (!this._syncInterval) {
      this._syncInterval = setInterval(async () => {
      await this.pullRemote();
      await this.pushLocal();
      await this.pullRemote();
      }, SYNC_INTERVAL_MS);
    }}

  async pullRemote(){
    try {
      //console.log ("ultimo: " + this.lastSeq)
      const seqParam = this.lastSeq ? `&since=${this.lastSeq}` : '';
      // Evitar procesar el mismo cambio varias veces
      const headers = getAuthHeader(this.remoteUser, this.remotePwd);
      const url = `${this.couchUrl}/_changes?include_docs=true&filter=${this.filterBy}&userId=${this.userId}${seqParam}`;
      //console.log("pullRemote fetch URL:", url);
      const res = await fetch(url, {headers});
      if (!res.ok) {
        console.log(`Network request failed: ${res.status} ${res.statusText}`);
        return;
      }
      const json = await res.json();
      for (const row of json.results) {
        
        if (!row.doc) continue;
        const doc = {
          _id: row.doc._id,
          data: row.doc,
          dirty: false,
          deleted: !!row.doc._deleted,
          updatedAt: Date.now(),
          _rev: row.doc._rev
        };
        await this.localDB.upsert(doc);
      }

      if(json.last_seq){
        this.lastSeq = json.last_seq;
        await this.localDB.setMeta('last_seq', this.lastSeq);
      }
    } catch (e) {
      console.log('Error in pullRemote:', e);
    }
  }

  async pushLocal(retryCount = 0){
    // Si ya hay una sincronización en curso, programa una inmediata
    if (this.isSyncing) {
      this.pendingSyncRequest = true;
      return;
    }

    // Iniciar sincronización
    this.isSyncing = true;
    this.syncPromise = (async () => {
      try {
        const dirtyDocs = await this.localDB.getDirty() || [];
        console.log(`Documentos sucios encontrados: ${dirtyDocs.length}`);
        
        if (!dirtyDocs || dirtyDocs.length === 0) {
          console.log('No hay documentos para sincronizar');
          return;
        }

        console.log(`Iniciando sincronización de ${dirtyDocs.length} documentos`);
        
        // Procesar documentos uno a la vez para mejor control
        console.log(`Iniciando procesamiento de ${dirtyDocs.length} documentos`);
        
        for (let i = 0; i < dirtyDocs.length; i++) {
          const doc = dirtyDocs[i];
          console.log(`Procesando documento ${i + 1}/${dirtyDocs.length}: ${doc._id}`);
          
          try {
            await this.pushDocument(doc);
            console.log(`Documento ${i + 1}/${dirtyDocs.length} completado`);
          } catch (error) {
            console.error(`Error fatal en documento ${doc._id}:`, error);
            // Continuamos con el siguiente documento
            continue;
          }
        }

        this.lastSyncTime = Date.now();
        const syncDuration = Date.now() - this.lastSyncTime;
        console.log(`Sincronización completada en ${syncDuration}ms`);
        console.log('Sincronización completada exitosamente');
        
      } catch(e) {
        console.error('Error en pushLocal:', e);
        // Reintentar si no hemos excedido el límite
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          console.log(`Reintentando sincronización (intento ${retryCount + 1})`);
          setTimeout(() => this.pushLocal(retryCount + 1), RETRY_DELAY);
        }
      } finally {
        this.isSyncing = false;
        this.syncPromise = null;

        // Si hay una sincronización pendiente, ejecutarla inmediatamente
        if (this.pendingSyncRequest) {
          this.pendingSyncRequest = false;
          this.pushLocal();
        }
      }
    })();

    return this.syncPromise;
  }

  async checkConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);
      
      const res = await fetch(this.couchUrl, {
        method: 'HEAD',
        headers: getAuthHeader(this.remoteUser, this.remotePwd),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return res.ok;
    } catch (error) {
      console.warn('Error checking connection:', error);
      return false;
    }
  }

  async pushDocument(d, retryCount = 0) {
    const startTime = Date.now();
    const retryDelay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);

    try {
      // Verificar conexión antes de intentar el push
      if (!(await this.checkConnection())) {
        throw new Error('No hay conexión con el servidor');
      }

      console.log(`Iniciando push de documento ${d._id} (intento ${retryCount + 1}, timeout: ${FETCH_TIMEOUT}ms)`);
      let headers = getAuthHeader(this.remoteUser, this.remotePwd);
      let docBody = typeof (d.data) === "string" ? JSON.parse(d.data) : d.data;
      docBody._id = d._id;
      if (d._rev && d._rev !== "") docBody._rev = d._rev;
      if (d.deleted) docBody._deleted = true;

      console.log(`Enviando documento ${d._id} al servidor...`);
      
      // Crear un AbortController para el timeout
      const controller = new AbortController();
      let timeoutId = null;
      
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error(`Timeout después de ${FETCH_TIMEOUT}ms`));
        }, FETCH_TIMEOUT);
      });

      try {
        const fetchPromise = fetch(`${this.couchUrl}/${d._id}`, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(docBody),
          signal: controller.signal
        });

        const res = await Promise.race([fetchPromise, timeoutPromise]);
        clearTimeout(timeoutId);

        if (res.ok) {
          const result = await res.json();
          await this.localDB.markClean(d._id, result.rev);
          const duration = Date.now() - startTime;
          console.log(`Documento ${d._id} sincronizado exitosamente en ${duration}ms`);
          return true;
        } else if (res.status === 409) {
          console.log(`Conflicto detectado para ${d._id}, intentando resolver...`);
          await this.pullRemote();
          throw new Error('Conflicto de documento');
        } else {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.warn(`Error en push de documento ${d._id} (${duration}ms): ${error.message}`);

      if (error.name === 'AbortError') {
        console.warn(`Timeout alcanzado para documento ${d._id}`);
      }

      // Si es un error de timeout o conexión, reintentamos
      if ((error.name === 'AbortError' || error.message.includes('Timeout') || error.message.includes('conexión')) 
          && retryCount < MAX_RETRY_ATTEMPTS) {
        console.log(`Reintentando en ${retryDelay}ms (intento ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Verificar conexión antes de reintentar
        if (await this.checkConnection()) {
          return this.pushDocument(d, retryCount + 1);
        } else {
          throw new Error('No se pudo establecer conexión con el servidor');
        }
      } else {
        console.error(`Error fatal en documento ${d._id} después de ${retryCount} intentos:`, error);
        throw error;
      }
    }
  }
   
  async startRealTimeSync() {
    try {
      this._stopRealTime = false;
      let since = this.lastSeq || 0;

      const processChanges = async (row) => {
        if (!row.doc) return;
        const doc = {
          _id: row.doc._id,
          data: row.doc,
          dirty: 0,
          deleted: row.doc._deleted ? 1 : 0,
          updatedAt: Date.now(),
          _rev: row.doc._rev
        };
        await this.localDB.upsert(doc);
        since = row.seq;
        await this.localDB.setMeta('last_seq', since);
      };

      while (!this._stopRealTime) {
        try {
          const url = `${this.couchUrl.replace(/\/\/.*@/, '//')}/_changes?feed=longpoll&since=${since}&include_docs=true&filter=${this.filterBy}&userId=${this.userId}`;
          const headers = getAuthHeader(this.remoteUser, this.remotePwd);
          const res = await fetch(url, { headers });
          
          if (!res.ok) {
            console.warn('Error en respuesta de _changes:', res.status);
            continue;
          }
          
          const json = await res.json();
          for (const row of json.results) {
            console.log("Nuevos cambios =>", JSON.stringify(row));
            await processChanges(row);
          }
        } catch (error) {
          console.log('Error sincronización en tiempo real:', error);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    } catch (error) {
      console.error("Error startRealTimeSync:", error);
    }
  }

  stopRealTimeSync() {
    this._stopRealTime = true;
  }
}

export class Listeners {
  constructor(couchUrl, name) {
    this.couchUrl = couchUrl;
    this.dbName = name
    this.listeners = new Map(); // id -> { controller, fetchPromise }
    this.nextId = 1;
  }

  
  /**
   * Agrega un listener sobre una tabla con un filtro y callback
   * @param {string} filterQuery - Query string con filtros, ej: "filter=usuario/porUsuario&userId=123"
   * @param {function} callback - Función que se llama con cada cambio, mantiene el contexto desde donde se llama
   * @param {number} since - Opcional: secuencia inicial
   * @returns {number} listenerId
   */
  addListener(options, remoteUser, remotePwd, callback, since = 0) {
    const listenerId = this.nextId++;
    const controller = new AbortController();
    this.listeners.set(listenerId, { controller });


    // mm proceso los campos de options y ademas recorro el campo query_params
    let currentSince = since === 0 ? 'now' : since;
    const fetchChanges = async () => {
      while (this.listeners.has(listenerId)) {
        try {
          const url = `${this.couchUrl}/${this.dbName}/_changes?since=${currentSince}&feed=longpoll&${objectToQueryString(options)}&${options.hasOwnProperty("query_params") ? objectToQueryString(options.query_params) : ""}`;
          let headers = getAuthHeader(remoteUser, remotePwd);
          const res = await fetch(url, { headers, signal: controller.signal });
          if (!res.ok) throw new Error('Error fetch changes');
          const data = await res.json();

          for (const row of data.results) {
            if (row.doc) callback.call(this, row.doc, row);
            currentSince = row.seq;
          }
          // Si hay last_seq en la respuesta, actualiza currentSince
          if (data.last_seq) {
            currentSince = data.last_seq;
          }
        } catch (err) {
          if (err.name === 'AbortError') return; // listener cancelado
          console.log('Error en listener:', err);
          await new Promise(r => setTimeout(r, 2000)); // retry delay
        }
      }
    };

    this.listeners.get(listenerId).fetchPromise = fetchChanges();
    return listenerId;
  }

  /**
   * Cancela un listener existente
   * @param {number} listenerId 
   */
  removeListener(listenerId) {
    const listener = this.listeners.get(listenerId);
    if (listener) {
      listener.controller.abort();
      this.listeners.delete(listenerId);
    }
  }

  /**
   * Cancela todos los listeners
   */
  removeAllListeners() {
    for (const id of this.listeners.keys()) {
      this.removeListener(id);
    }
  }
}
