import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import { openDB } from "idb";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "buffer";
import { EVENT_NEW_DOC, emitEvent } from "./DBEvents";
import { DBSync } from "./DBSync";


//const _dbURL = "http://192.168.68.53:5984";
const _dbURL = "http://34.39.168.70:5984";
const _username = "admin_X9!fQz7#Lp4Rt8$Mh2";
const _password = "G@7hX!2$kP9^mQ4&rZ6*Ty1wVb";
const _syncInterval = 10000
const _type = "LOCAL"
const _fetchTimeout = 30000 // Aumentado de 10s a 30s para conexiones lentas
const _fetchTimeoutLongPool = 60000 // Aumentado de 30s a 60s para longpoll

export class DB {
  constructor({
    name,
    type: typeParam,
    username: usernameParam,
    password: passwordParam,
    syncInterval : syncIntervalParam,
    fetchTimeout: fetchTimeoutParam,
    index = [],
    debug = false,
    live = false
  }) {
    try{
      this.tableName = name;
      this.couchUrl = _dbURL;
      this.isWeb = Platform.OS == "web";
      // mm - si no vienen los valores los tomo por defecto
      this.username = (typeof usernameParam !== 'undefined') ? usernameParam : _username;
      this.password = (typeof passwordParam !== 'undefined') ? passwordParam : _password;
      this.syncInterval = (typeof syncIntervalParam !== 'undefined') ? syncIntervalParam : _syncInterval;
      this.fetchTimeout = (typeof fetchTimeoutParam !== 'undefined') ? fetchTimeoutParam : _fetchTimeout;
      this.type = (typeof typeParam !== 'undefined') ? typeParam : _type;
      this.index = index
      this.authHeader = "Basic " + Buffer.from(`${this.username}:${this.password}`).toString("base64");
      this.localDB = null;
      this.syncing = false;
      this.live = live 
      this.debug = !!debug;
      this._trace = [];
      this._maxTrace = 1000; // cap to avoid unbounded memory
      
      // Inicializar DBSync si es tipo REMOTE
      this.dbSync = null;
      if (this.type === "REMOTE") {
        this.dbSync = new DBSync({
          tableName: name,
          couchUrl: this.couchUrl,
          username: this.username,
          password: this.password,
          fetchTimeout: this.fetchTimeout,
          syncInterval: this.syncInterval,
          debug: this.debug,
          
          // Callbacks para que DBSync interactúe con DB
          onMarkSynced: async (id, rev) => {
            await this.markSynced(id, rev);
          },
          
          onSaveLocal: async (data, id, rev, updatedAt = null) => {
            await this._saveLocalInternal(data, id, rev, updatedAt, 1);
          },
          
          onDelete: async (id) => {
            await this.delete(id);
          }
        });
      }
    }
    catch (e)
    {
      console.log ("A iniciailizar DB " + JSON.stringify(e))
    }
  }
  // _fetchWithTimeout ahora está en DBSync
  // --- Tracing helpers ---
  _preview(obj, max = 200) {
    try {
      const s = typeof obj === 'string' ? obj : JSON.stringify(obj);
      return s.length > max ? s.slice(0, max) + '…' : s;
    } catch (e) {
      try { return String(obj).slice(0, max); } catch (_) { return '‹unserializable›' }
    }
  }

  _tracePush(event, payload = {}) {
    const entry = { ts: Date.now(), event, payload };
    this._trace.push(entry);
    if (this._trace.length > this._maxTrace) this._trace.shift();
    if (this.debug) {
      try {
        console.log(`[DB:${this.tableName}] ${event}`, payload);
      } catch (e) {
        // ignore logging errors
      }
    }
  }

  getTrace() {
    return this._trace.slice();
  }

  clearTrace() {
    this._trace = [];
  }

  // Trace helper: get entries related to a specific id (id or _id)
  getTraceFor(id) {
    if (!id) return [];
    return this._trace.filter(e => {
      const p = e.payload || {};
      return p.id === id || p._id === id || (p.preview && p.preview.indexOf(id) !== -1) || (p.paramsPreview && p.paramsPreview.indexOf(id) !== -1);
    });
  }

  // Print trace entries for an id (nicely formatted)
  printTraceFor(id) {
    const entries = this.getTraceFor(id);
    console.log(`Trace for ${id} (${entries.length} entries):`);
    for (const e of entries) {
      console.log(new Date(e.ts).toISOString(), e.event, e.payload);
    }
  }

  getTraceByEvent(eventName) {
    return this._trace.filter(e => e.event === eventName);
  }

  printLast(n = 50) {
    const tail = this._trace.slice(-n);
    console.log(`Last ${tail.length} trace entries:`);
    for (const e of tail) console.log(new Date(e.ts).toISOString(), e.event, e.payload);
  }

  /** Inicializa DB y arranca sync */
  async initDB() {
    console.log("Inicializando base de datos " + this.tableName + "...");
    try {
      if (this.isWeb) {
        this.localDB = await openDB(this.tableName, 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains("records")) {
              db.createObjectStore("records", { keyPath: "id" });
            }
          },
        });
      } else {
        this.localDB = await SQLite.openDatabaseAsync(this.tableName);

        await this.localDB.execAsync("PRAGMA journal_mode = WAL");
        await this.localDB.execAsync("PRAGMA foreign_keys = ON");
        //await this.localDB.execAsync('DROP TABLE IF EXISTS records')
        // Add _rev and _id columns to keep CouchDB revision and _id locally
        await this.localDB.execAsync(
          "CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY,data TEXT,updatedAt INTEGER,synced INTEGER DEFAULT 0,_rev TEXT,_id TEXT)"
        );
        // Eliminar todos los índices existentes en la tabla 'records'
        try {
          const indexes = await this.localDB.getAllAsync(
            `PRAGMA index_list('records')`
          );
          for (const idx of indexes) {
            if (idx && idx.name && !idx.name.startsWith('sqlite_autoindex')) {
              await this.localDB.execAsync(`DROP INDEX IF EXISTS ${idx.name}`);
            }
          }
        } catch (e) {
          console.log("Error eliminando índices existentes: " + JSON.stringify(e));
        }
        // mm - creo los indices pasados por parametro
        try{
          if (Array.isArray(this.index) && this.index.length > 0) {
            for (let i = 0; i < this.index.length; i++) {
              const aux = this.index[i];
                // Generar un nombre de índice aleatorio
                let name = aux.name
                const columns = aux.fields
                  .map(
                    (field) =>
                      `json_extract(data, '$.${field}')`
                  )
                  .join(", ");
                const sql = `CREATE INDEX IF NOT EXISTS ${name} ON records(${columns})`;
                await this.localDB.execAsync(sql);
            }
          }
        }
        catch (e){console.log ("Erorr en crear index: " + JSON.stringify(e))}
        try {
          await this.localDB.execAsync("ALTER TABLE records ADD COLUMN _rev TEXT");
        } catch (e) {
        }
        try {
          await this.localDB.execAsync("ALTER TABLE records ADD COLUMN _id TEXT");
        } catch (e) {
        }
      }
      console.log(
        "Base de datos " + this.tableName + " inicializada correctamente"
      );
      this._tracePush('initDB:done');
      if (this.type == "REMOTE") {
        this.startSync();
        this.listenChanges();
      
      }
    } catch (err) {
      console.error("Error inicializando DB:", err);
      this._tracePush('initDB:error', { error: this._preview(err) });
    }
  }
  /** Sincronización inmediata manual */
  async syncAllNow() {
    if (!this.dbSync) {
      console.warn(`[${this.tableName}] DBSync no inicializado, no se puede sincronizar`);
      return;
    }
    
    try {
      const records = await this.getAllToSync();
      for (const r of records.filter((r) => r.synced === 0)) {
        await this.dbSync.syncRecord(r);
      }
    } catch (err) {
      console.warn(`[${this.tableName}] Error en sincronización manual:`, err);
    }
  }

  /** Guardar o actualizar registro local (interno, sin sincronización) */
  async _saveLocalInternal(data, id = "", rev = "", updatedAtParam = null, syncedParam = null) {
    const updatedAt = updatedAtParam !== null ? updatedAtParam : Date.now();
    const synced = syncedParam !== null ? syncedParam : 0;
    
    try {
      if (id == "" || id==null || id==undefined) {
        id = uuidv4();
      }
    } catch (e) {
      console.log(e);
    }

    const record = {
      id: id == "" ? (id = uuidv4()) : id,
      _id: id == "" ? (id = uuidv4()) : id,
      data,
      updatedAt,
      synced,
      _rev: rev || (data && data._rev) || "",
    };

    try {
      if (this.isWeb) {
        await this.localDB.put("records", record);
      } else {
        await this.exec(
          `INSERT OR REPLACE INTO records (id, data, updatedAt, synced, _rev, _id) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, JSON.stringify(data), updatedAt, synced, record._rev, record._id]
        );
      }
      this._tracePush('_saveLocalInternal:done', { id, _rev: record._rev, _id: record._id, updatedAt, synced });
      return id;
    } catch (err) {
      console.error("Error guardando local (interno):", err);
      throw err;
    }
  }

  /** Guardar o actualizar registro local */
  async saveLocal(data, id = "", rev = "") {
    const finalId = await this._saveLocalInternal(data, id, rev);
    
    console.log(`[${this.tableName}] ✓ Guardado local: ${finalId}, synced: 0`);
    
    // Sincronizar inmediatamente si es tipo REMOTE usando DBSync
    if (this.type === "REMOTE" && this.dbSync) {
      console.log(`[${this.tableName}] Sincronizando con DBSync...`);
      
      // Obtener el registro completo de la BD para tener updatedAt correcto
      let record;
      if (this.isWeb) {
        record = await this.localDB.get("records", finalId);
      } else {
        const results = await this.exec("SELECT * FROM records WHERE id = ?", [finalId]);
        if (results && results.length > 0) {
          const row = results[0];
          record = {
            id: row.id,
            _id: row._id || row.id,
            data: row.data ? JSON.parse(row.data) : data,
            updatedAt: row.updatedAt,
            synced: row.synced,
            _rev: row._rev || "",
          };
        }
      }
      
      // Si no se pudo obtener el registro, crear uno con los datos actuales
      if (!record) {
        record = {
          id: finalId,
          _id: finalId,
          data,
          updatedAt: Date.now(),
          synced: 0,
          _rev: rev || (data && data._rev) || "",
        };
      }
      
      // Intentar sincronización inmediata con DBSync
      try {
        
        const synced = await this.dbSync.syncRecordImmediate(record);
        if (!synced) {
          console.log(`[${this.tableName}] ⚠️ Sincronización inmediata falló, se reintentará en ciclo periódico`);
        }
      } catch (err) {
        console.warn(`[${this.tableName}] ⚠️ Error en sincronización inmediata (no crítico):`, err.message);
        // No lanzar el error - el guardado local fue exitoso
      }
    }
    
    try { 
      if (this.live) {
        // Verificar sincronización real antes de emitir evento
        const actualSynced = await this.isSynced(finalId);
        emitEvent(EVENT_NEW_DOC, { 
          table: this.tableName, 
          id: finalId, 
          _id: finalId, 
          data: data, 
          new: !rev || rev === "",
          preview: this._preview(data), 
          source: 'local', 
          synced: actualSynced 
        }); 
      }
    } catch(e) {}
    
    return finalId;
  }

  async exec(sql, params = []) {
    try {
      this._tracePush('exec:call', { sql: this._preview(sql, 500), paramsPreview: this._preview(params) });
      const result = await this.localDB.getAllAsync(sql, params);
      this._tracePush('exec:done', { rows: Array.isArray(result) ? result.length : null });
      return result == undefined ? [] : result;
    } catch (err) {
      console.log("error en execAsync", err);
      throw err;
    }
  }
  async run(sql, params = []) {
    try {
      this._tracePush('run:call', { sql: this._preview(sql,500), paramsPreview: this._preview(params) });
      await this.localDB.runAsync(sql, params);
      this._tracePush('run:done');
      return true;
    } catch (err) {
      console.log("error en run", err);
      return false;
      throw err;
    }
  }

  /** Obtener todos los registros locales */
  async getAll(sql = "SELECT * FROM records", params = []) {
    try {
      let records;
      if (this.isWeb) {
        records = await this.localDB.getAll("records");
      } else {
        let result = await this.exec(sql, params);
        if (result == null) result = [];
        records = result.map((row) => ({
          id: row.id,
          _id: row._id || row.id,
          data: row.data ? JSON.parse(row.data) : null,
          updatedAt: row.updatedAt,
          synced: row.synced,
          _rev: row._rev || "",
        }));
      }
      return records.filter((r) => !(r.data && r.data.deleted === true));
    } catch (err) {
      console.error("Error obteniendo registros locales:", err);
      return [];
    }
  }

  /** Obtener todos los registros locales */
  async getAllToSync() {
    try {
      let data;
      if (this.isWeb) {
        data = await this.localDB.getAll("records");
      } else {
        data = await this.getAll("SELECT * FROM records WHERE synced=0");
      }
      // Filtrar registros eliminados y solo los no sincronizados
      return data.filter(
        (r) => r.synced === 0 && !(r.data && r.data.deleted === true)
      );
    } catch (err) {
      console.error("Error obteniendo registros locales a sincronzizar:", err);
      return [];
    }
  }

  /** Marcar registro como sincronizado */
  async markSynced(id, rev = null) {
    this._tracePush('markSynced:start', { id, rev });
    if (this.isWeb) {
      const record = await this.localDB.get("records", id);
      if (record) {
        record.synced = 1;
        if (rev) record._rev = rev;
        await this.localDB.put("records", record);
      }
    } else {
      if (rev) {
        await this.exec(
          `UPDATE records SET synced = 1, _rev = ? WHERE id = ?`,
          [rev, id]
        );
      } else {
        await this.exec(`UPDATE records SET synced = 1 WHERE id = ?`, [id]);
      }
    }
    this._tracePush('markSynced:done', { id, rev });
  }

  // syncRecord, _syncRecordDirect, syncRecordImmediate ahora están en DBSync


  /** Verificar si un registro está sincronizado */
  async isSynced(id) {
    try {
      if (this.isWeb) {
        const record = await this.localDB.get("records", id);
        return record && record.synced === 1;
      } else {
        const result = await this.exec("SELECT synced FROM records WHERE id = ?", [id]);
        return result && result.length > 0 && result[0].synced === 1;
      }
    } catch (err) {
      console.error(`[${this.tableName}] Error verificando sincronización:`, err);
      return false;
    }
  }

  /** Verificar si un registro existe en remoto */
  async existsInRemote(id) {
    if (this.type !== "REMOTE") return false;
    
    try {
      const res = await fetch(`${this.couchUrl}/${this.tableName}/${id}`, {
        headers: { 
          Authorization: this.authHeader, 
          "Content-Type": "application/json" 
        }
      });
      console.log(`[${this.tableName}] Verificación remota de ${id}: status ${res.status}`);
      return res.ok;
    } catch (err) {
      console.error(`[${this.tableName}] Error verificando existencia remota:`, err);
      return false;
    }
  }

  /** Sincronización periódica - delega a DBSync */
  async startSync() {
    console.log(`[${this.tableName}] startSync - type: ${this.type}`);
    
    if (this.type == "LOCAL") return;
    
    if (!this.dbSync) {
      console.warn(`[${this.tableName}] DBSync no inicializado, no se puede iniciar sincronización`);
      return;
    }
    
    // Delegar a DBSync
    this.dbSync.startPeriodicSync(async () => await this.getAllToSync());
  }

  /** Detener sincronización periódica - delega a DBSync */
  stopSync() {
    if (this.dbSync) {
      this.dbSync.stopPeriodicSync();
    }
  }

  /** API simple */
  async add(data, idRecord) {
    const id = await this.saveLocal(data, idRecord);
    return id;
  }

  async get(id) {
    if (this.isWeb) {
      const all = await this.getAll();

      let aux = all.find((r) => r.id === id)
      return (aux == undefined || aux.length == 0  ? false : aux.data)
    }
    let aux = await this.getAll("SELECT * FROM records where id=?", [id]);
    return (aux.length == 0 ? false : aux[0].data)
  }

  async find (params)
  {
    const keys = Object.keys(params || {});
    if (keys.length === 0) {
      return await this.getAll();
    }

    if (this.isWeb) {
      // mm - hago la busqueda de los parametros
      let aux = await this.getAll()
      return (aux.filter(u =>Object.entries(params).every(([k, v]) => u.data[k] === v)));
    }
    const whereClauses = keys.map(key => `json_extract(data, '$.${key}') = ?`).join(' AND ');
    const values = keys.map(key => params[key]);
    const sql = `SELECT * FROM records WHERE ${whereClauses}`;

    return await this.getAll(sql, values);
    //return result.map ((item)=>item.data)
  }

  async getWithHeader(id) {
    if (this.isWeb) {
      const all = await this.getAll();
      return all.find((r) => r.id === id) || null;
    }
    let aux = await this.getAll("SELECT * FROM records where id=?", [id]);
    if (!aux || aux.length === 0) return null;
    return aux[0];
  }

  async update(id, newData, rev) {
    const result = await this.saveLocal(newData, id, rev);
    return result;
  }

  async delete(id) {
    try {
      if (this.isWeb) await this.localDB.delete("records", id);
      else
        await this.localDB.execAsync(`DELETE FROM records WHERE id = ?`, [id]);

      // Eliminar remoto - usando fetch directo con auth headers
      const res = await fetch(`${this.couchUrl}/${this.tableName}/${id}`, {
        headers: { 
          Authorization: this.authHeader, 
          "Content-Type": "application/json" 
        }
      });
      
      if (res.ok) {
        const doc = await res.json();
        await fetch(`${this.couchUrl}/${this.tableName}/${id}?rev=${doc._rev}`, {
          method: "DELETE",
          headers: { 
            Authorization: this.authHeader, 
            "Content-Type": "application/json" 
          }
        });
      }
    } catch (err) {
      console.warn(`[${this.tableName}] Error borrando remoto:`, err);
    }
  }

    /** Longpoll para cambios remotos - delega a DBSync */
  async listenChanges() {
    if (!this.dbSync) {
      console.warn(`[${this.tableName}] DBSync no inicializado, no se puede escuchar cambios`);
      return;
    }
    
    // Callback para manejar cambios remotos
    const onRemoteChange = async (doc) => {
      try {
        console.log(`[${this.tableName}] 📥 Cambio remoto recibido: ${doc._id}`);
        debugger
        // Verificar si el documento existe localmente
        const localDoc = await this.getWithHeader(doc._id);
        
        // Si existe localmente y tiene updatedAt más reciente, ignorar el cambio remoto
        if (localDoc && localDoc.updatedAt >= doc.updatedAt) {
          console.log(`[${this.tableName}] ⏭️ Ignorando cambio remoto - versión local es más reciente o igual`);
          console.log(`[${this.tableName}]    Local: ${localDoc.updatedAt}, Remoto: ${doc.updatedAt}`);
          return;
        }
        
        // Si el remoto está eliminado, eliminar localmente
        if (doc.data && doc.data.deleted === true) {
          await this.delete(doc._id);
        } else {
          // Guardar cambio remoto localmente con su updatedAt y marcar como sincronizado
          await this._saveLocalInternal(doc.data, doc._id, doc._rev, doc.updatedAt, 1);
          console.log(`[${this.tableName}] ✓ Cambio remoto aplicado localmente: ${doc._id}`);
        }

        // Emitir evento de nuevo doc (remoto)
        if (this.live) {
          emitEvent(EVENT_NEW_DOC, { 
            table: this.tableName, 
            data: doc.data, 
            id: doc._id, 
            doc, 
            source: 'remote', 
            synced: true 
          });
        }
      } catch (err) {
        console.error(`[${this.tableName}] Error procesando cambio remoto:`, err);
      }
    };
    
    // Delegar a DBSync
    this.dbSync.listenChanges(onRemoteChange);
  }

  // ===== Métodos de debugging/estadísticas delegados a DBSync =====
  
  /** Obtiene las estadísticas de sincronización */
  getSyncStats() {
    if (!this.dbSync) {
      console.warn(`[${this.tableName}] DBSync no inicializado`);
      return null;
    }
    return this.dbSync.getStats();
  }

  /** Imprime las estadísticas de sincronización en consola */
  printSyncStats() {
    if (!this.dbSync) {
      console.warn(`[${this.tableName}] DBSync no inicializado`);
      return;
    }
    const stats = this.dbSync.getStats();
    console.log(`[${this.tableName}] ===== ESTADÍSTICAS DE SINCRONIZACIÓN =====`);
    console.log(`Total syncs: ${stats.totalSyncs}`);
    console.log(`Successful: ${stats.successfulSyncs}`);
    console.log(`Failed: ${stats.failedSyncs}`);
    console.log(`Network errors: ${stats.networkErrors}`);
    console.log(`Direct PUTs: ${stats.directPuts}`);
    console.log(`Avg sync time: ${stats.avgSyncTime.toFixed(2)}ms`);
    console.log(`========================================`);
  }

  /** Resetea las estadísticas de sincronización */
  resetSyncStats() {
    if (!this.dbSync) {
      console.warn(`[${this.tableName}] DBSync no inicializado`);
      return;
    }
    this.dbSync.resetStats();
  }

  /** Obtiene el trace completo de eventos de sincronización */
  getSyncTrace() {
    if (!this.dbSync) {
      console.warn(`[${this.tableName}] DBSync no inicializado`);
      return [];
    }
    return this.dbSync.getTrace();
  }

  /** Imprime los últimos N eventos del trace */
  printSyncTrace(n = 20) {
    if (!this.dbSync) {
      console.warn(`[${this.tableName}] DBSync no inicializado`);
      return;
    }
    this.dbSync.printLast(n);
  }

  /** Obtiene el trace de eventos para un registro específico */
  getSyncTraceForRecord(recordId) {
    if (!this.dbSync) {
      console.warn(`[${this.tableName}] DBSync no inicializado`);
      return [];
    }
    return this.dbSync.getTraceFor(recordId);
  }

  /** Imprime el trace de eventos para un registro específico */
  printSyncTraceForRecord(recordId) {
    if (!this.dbSync) {
      console.warn(`[${this.tableName}] DBSync no inicializado`);
      return;
    }
    const trace = this.dbSync.getTraceFor(recordId);
    console.log(`[${this.tableName}] ===== TRACE PARA REGISTRO ${recordId} =====`);
    trace.forEach(t => {
      console.log(`[${t.timestamp}] ${t.event}:`, t.data);
    });
    console.log(`========================================`);
  }

}
