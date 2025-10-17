// DB.js
// Unificado: Local DB (expo-sqlite / IndexedDB) + sincronización con CouchDB (Basic Auth global).
// Mantiene la API: add, get, update, delete, find, getAll, etc.
// Sincroniza INMEDIATAMENTE en background sin bloquear la UI.
// Emite eventos usando emitEvent (import desde DBEvents).

import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import { openDB } from "idb";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "buffer";
import axios from "axios";
import {EVENT_REMOTE_CHANGE, emitEvent } from "./DBEvents";

// Configuración por defecto (puedes sobrescribir en constructor)
const DEFAULT_COUCH_URL = "http://34.39.168.70:5984"; // ejemplo
const DEFAULT_USERNAME = "admin_X9!fQz7#Lp4Rt8$Mh2";
const DEFAULT_PASSWORD = "G@7hX!2$kP9^mQ4&rZ6*Ty1wVb";
const DEFAULT_FETCH_TIMEOUT = 30000; // ms

export class DB {
  /**
   * options:
   *  - name: tabla / db name (required)
   *  - type: "LOCAL" or "REMOTE"
   *  - username, password (basic auth global)
   *  - couchUrl
   *  - fetchTimeout
   *  - index: [{ name, fields: [] }]
   *  - debug: boolean
   *  - live: boolean (emit events)
   *  - emitEvent
   */
  constructor(options = {}) {
    // basics
    this.tableName = options.name || "default";
    this.type = options.type || "LOCAL";
    this.isWeb = Platform && Platform.OS === "web";
    this.index = Array.isArray(options.index) ? options.index : [];
    this.debug = !!options.debug;
    this.live = !!options.live;
    this.emitEvent = !!options.emitEvent

    // couch / auth
    this.couchUrl = options.couchUrl || DEFAULT_COUCH_URL;
    this.username = options.username || DEFAULT_USERNAME;
    this.password = options.password || DEFAULT_PASSWORD;
    this.authHeader = "Basic " + Buffer.from(`${this.username}:${this.password}`).toString("base64");

    // sync params
    this.fetchTimeout = options.fetchTimeout || DEFAULT_FETCH_TIMEOUT;
    this.pollInterval = options.pollInterval || 10000; // Intervalo para verificar cambios (10s por defecto)

    // internal
    this.localDB = null;
    this._trace = [];
    this._maxTrace = 1000;
    this.lastSeq = "now"; // Última secuencia procesada
    this.pollIntervalId = null; // ID del intervalo de polling
    this.isPolling = false; // Flag para evitar ejecuciones concurrentes
  }

  /* ------------------------------
     Tracing & debug helpers
     ------------------------------ */
  _preview(obj, max = 200) {
    try {
      const s = typeof obj === "string" ? obj : JSON.stringify(obj);
      return s.length > max ? s.slice(0, max) + "…" : s;
    } catch (e) {
      try {
        return String(obj).slice(0, max);
      } catch (_) {
        return "‹unserializable›";
      }
    }
  }

  _tracePush(event, payload = {}) {
    const entry = { ts: Date.now(), event, payload };
    this._trace.push(entry);
    if (this._trace.length > this._maxTrace) this._trace.shift();
    if (this.debug) {
      try {
        console.log(`[DB:${this.tableName}] ${event}`, payload);
      } catch (_) {}
    }
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

  getTrace() {
    return this._trace.slice();
  }
  clearTrace() {
    this._trace = [];
  }

  /* ------------------------------
     Initialization
     ------------------------------ */
  async initDB() {
    this._tracePush("initDB:start");
    try {
      if (this.isWeb) {
        // IndexedDB via idb
        this.localDB = await openDB(this.tableName, 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains("records")) {
              db.createObjectStore("records", { keyPath: "id" });
            }
          },
        });
      } else {
        // Expo SQLite
        this.localDB = await SQLite.openDatabaseAsync(this.tableName);
        // ensure required table + columns
        //await this.localDB.execAsync("PRAGMA journal_mode = WAL");
        //await this.localDB.execAsync("PRAGMA foreign_keys = ON");
        await this.localDB.runAsync("CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, data TEXT, updatedAt INTEGER, synced INTEGER DEFAULT 0, _rev TEXT, _id TEXT)");

        // drop non-system indexes and recreate from this.index
        try {
          const indexes = await this.localDB.getAllAsync(`PRAGMA index_list('records')`);
          for (const idx of indexes || []) {
            if (idx && idx.name && !idx.name.startsWith("sqlite_autoindex")) {
              await this.localDB.execAsync(`DROP INDEX IF EXISTS ${idx.name}`);
            }
          }
        } catch (e) {
          // ignore index cleanup errors
        }

        // create indexes provided by options
        try {
          if (Array.isArray(this.index) && this.index.length > 0) {
            for (const idx of this.index) {
              const name = idx.name || `idx_${this.tableName}_${Math.random().toString(36).slice(2, 8)}`;
              const cols = (idx.fields || []).map((f) => `json_extract(data, '$.${f}')`).join(", ");
              const sql = `CREATE INDEX IF NOT EXISTS ${name} ON records(${cols})`;
              await this.localDB.execAsync(sql);
            }
          }
        } catch (e) {
          // ignore
        }
      }

      this._tracePush("initDB:done");
      
      // If remote type, verify connectivity before starting sync
      if (this.type === "REMOTE") {
        console.log(`[DB:${this.tableName}] Verificando conectividad con CouchDB...`);
        const isConnected = await this._checkConnectivity();
        
        if (!isConnected) {
          console.warn(`[DB:${this.tableName}] ⚠️ No se pudo conectar a CouchDB en ${this.couchUrl}`);
          console.warn(`[DB:${this.tableName}] ⚠️ La sincronización manual estará disponible`);
        } else {
          console.log(`[DB:${this.tableName}] ✓ Conectividad con CouchDB verificada`);
          // Iniciar polling de cambios
          this.startChangePolling();
        }
      }
    } catch (err) {
      this._tracePush("initDB:error", { error: this._preview(err) });
      throw err;
    }
  }

  /* ------------------------------
     Check CouchDB connectivity
     ------------------------------ */
  async _checkConnectivity() {
    try {
      console.log(`[DB:${this.tableName}] Verificando conectividad a: ${this.couchUrl}/${this.tableName}`);
      
      const res = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}`, {
        method: "HEAD"
      });
      
      console.log(`[DB:${this.tableName}] Conectividad OK: ${res.ok} (status: ${res.status})`);
      return res.ok;
      
    } catch (err) {
      console.warn(`[DB:${this.tableName}] No se pudo conectar:`, err.message);
      return false;
    }
  }
  
  /* ------------------------------
     Low-level DB helpers
     ------------------------------ */
  async exec(sql, params = []) {
    // For expo-sqlite wrapper expecting getAllAsync
    try {
      this._tracePush("exec:call", { sql: this._preview(sql, 400), paramsPreview: this._preview(params) });
      const res = await this.localDB.getAllAsync(sql, params);
      this._tracePush("exec:done", { rows: Array.isArray(res) ? res.length : null });
      return res || [];
    } catch (err) {
      this._tracePush("exec:error", { error: this._preview(err) });
      throw err;
    }
  }

  async run(sql, params = []) {
    try {
      this._tracePush("run:call", { sql: this._preview(sql, 400), paramsPreview: this._preview(params) });
      await this.localDB.runAsync(sql, params);
      this._tracePush("run:done");
      return true;
    } catch (err) {
      this._tracePush("run:error", { error: this._preview(err) });
      throw err;
    }
  }

  /* ------------------------------
     Local CRUD (internal)
     ------------------------------ */
  // data: object, id optional, rev optional
  async _saveLocalInternal(data, id = "", rev = "", updatedAtParam = null, syncedParam = null) {
    const updatedAt = updatedAtParam !== null ? updatedAtParam : Date.now();
    const synced = syncedParam !== null ? syncedParam : 0;
    
    // Validar y generar id si es necesario
    if (!id || id === "" || id === null || id === undefined) {
      id = uuidv4();
    }

    // Asegurar que id sea un string válido
    id = String(id);

    const record = {
      id,
      _id: id,
      data,
      updatedAt,
      synced,
      _rev: rev || (data && data._rev) || "",
    };

    try {
      if (this.isWeb) {
        // Validar que el registro tenga un id válido antes de guardar en IndexedDB
        if (!record.id || typeof record.id !== 'string') {
          throw new Error(`Invalid id for IndexedDB: ${record.id}`);
        }
        await this.localDB.put("records", record);
      } else {
        await this.exec(`INSERT OR REPLACE INTO records (id, data, updatedAt, synced, _rev, _id) VALUES (?, ?, ?, ?, ?, ?)`, [
          id,
          JSON.stringify(data),
          updatedAt,
          synced,
          record._rev,
          record._id,
        ]);
      }
      this._tracePush("_saveLocalInternal:done", { id, _rev: record._rev, updatedAt, synced });
      return id;
    } catch (err) {
      console.error(`[DB:${this.tableName}] Error en _saveLocalInternal:`, {
        id,
        idType: typeof id,
        error: err.message,
        record: this._preview(record)
      });
      this._tracePush("_saveLocalInternal:error", { error: this._preview(err), id, idType: typeof id });
      throw err;
    }
  }

  // Public save: saves locally and triggers background sync (if REMOTE)
  async saveLocal(data, id = "", rev = "") {
    const finalId = await this._saveLocalInternal(data, id, rev);
    this._tracePush("saveLocal:done", { id: finalId });

    // Emit immediate local event (non-blocking)
    emitEvent(EVENT_REMOTE_CHANGE, {
      table: this.tableName,
      id: finalId,
      _id: finalId,
      data,
      new: !rev,
      preview: this._preview(data),
      source: "local",
      synced: false,
    });

    console.log(`[DB:${this.tableName}] Guardado local exitoso: ${finalId}`);
    
    // If remote, launch background sync (fire-and-forget)
    if (this.type === "REMOTE") {
      console.log(`[DB:${this.tableName}] Iniciando sincronización en background para: ${finalId}`);
      (async () => {
        try {
          const recordHeader = await this.getWithHeader(finalId);
          const record = recordHeader
          ? {
            id: recordHeader.id,
            _id: recordHeader._id || recordHeader.id,
            data: recordHeader.data,
            updatedAt: recordHeader.updatedAt,
            synced: recordHeader.synced,
            _rev: recordHeader._rev || "",
          }
          : {
            id: finalId,
            _id: finalId,
            data,
            updatedAt: Date.now(),
            synced: 0,
            _rev: rev || (data && data._rev) || "",
          };
          
          console.log(`[DB:${this.tableName}] Registro a sincronizar:`, {
            id: record.id,
            synced: record.synced,
            updatedAt: record.updatedAt,
            _rev: record._rev
          });
          
          // sync immediate returns boolean: true if success, false if network issue
          const ok = await this._syncRecordImmediate(record);
          if (ok) {
            console.log(`[DB:${this.tableName}] ✓ Sincronización exitosa: ${finalId}`);
            // markSynced will emit EVENT_DOC_SYNCED
          } else {
            console.log(`[DB:${this.tableName}] ⚠️ Sincronización pospuesta (problema de red): ${finalId}`);
            // scheduled to retry via periodic sync
            try {
              this._safeEmitEvent("EVENT_DOC_SYNC_SCHEDULED", { table: this.tableName, id: finalId });
            } catch (_) {}
          }
        } catch (err) {
          console.error(`[DB:${this.tableName}] ✗ Error en sincronización background:`, err.message);
          this._tracePush("saveLocal:backgroundSyncError", { id: finalId, error: this._preview(err) });
          try {
            this._safeEmitEvent("EVENT_DOC_SYNC_FAILED", { table: this.tableName, id: finalId, error: err && err.message });
          } catch (_) {}
        }
      })();
    }

    return finalId;
  }

  /* ------------------------------
     Public API (CRUD)
     ------------------------------ */
  async add(data, idRecord) {
    return await this.saveLocal(data, idRecord);
  }

  async get(id) {
    if (this.isWeb) {
      const all = await this.getAll();
      const found = all.find((r) => r.id === id);
      return found ? found.data : false;
    }
    const rows = await this.getAll("SELECT * FROM records WHERE id = ?", [id]);
    return rows.length === 0 ? false : rows[0].data;
  }

  async getWithHeader(id) {
    if (this.isWeb) {
      const all = await this.getAll();
      return all.find((r) => r.id === id) || null;
    }
    const rows = await this.getAll("SELECT * FROM records WHERE id = ?", [id]);
    return !rows || rows.length === 0 ? null : rows[0];
  }

  async update(id, newData, rev) {
    return await this.saveLocal(newData, id, rev);
  }

  async delete(id) {
    // Delete locally and attempt remote delete (non-blocking)
    try {
      if (this.isWeb) {
        await this.localDB.delete("records", id);
      } else {
        await this.localDB.execAsync(`DELETE FROM records WHERE id = ?`, [id]);
      }

      // attempt remote delete: GET to obtain _rev, then DELETE with rev (non-blocking)
      (async () => {
        try {
          const res = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${id}`, { method: 'GET', timeout: this.fetchTimeout });

          if (res && res.status >= 200 && res.status < 300) {
            const doc = await res.json();
            if (doc && doc._rev) {
              await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${id}?rev=${doc._rev}`, { method: 'DELETE', timeout: this.fetchTimeout });
            }
            // emit remote delete event
            try {
              emitEvent("EVENT_REMOTE_DELETE", { table: this.tableName, id });
            } catch (_) {}
          }
        } catch (err) {
          // ignore: deletion will be attempted next sync if needed
          this._tracePush("delete:remoteError", { id, error: this._preview(err) });
        }
      })();

      // emit local delete event
      try {
        emitEvent("EVENT_LOCAL_DELETE", { table: this.tableName, id });
      } catch (_) {}
    } catch (err) {
      this._tracePush("delete:error", { id, error: this._preview(err) });
      throw err;
    }
  }

  async find(params = {}) {
    const keys = Object.keys(params || {});
    if (keys.length === 0) return await this.getAll();

    if (this.isWeb) {
      const all = await this.getAll();
      return all.filter((u) => Object.entries(params).every(([k, v]) => u.data[k] === v));
    }

    const whereClauses = keys.map((k) => `json_extract(data, '$.${k}') = ?`).join(" AND ");
    const values = keys.map((k) => params[k]);
    const sql = `SELECT * FROM records WHERE ${whereClauses}`;
    return await this.getAll(sql, values);
  }

  async getAll(sql = "SELECT * FROM records", params = []) {
    if (this.isWeb) {
      const list = await this.localDB.getAll("records");
      const mapped = (list || []).map((r) => ({
        id: r.id,
        _id: r._id || r.id,
        data: r.data || r.data,
        updatedAt: r.updatedAt,
        synced: r.synced,
        _rev: r._rev || "",
      }));
      return mapped.filter((r) => !(r.data && r.data.deleted === true));
    } else {
      const rows = await this.exec(sql, params);
      const mapped = (rows || []).map((row) => ({
        id: row.id,
        _id: row._id || row.id,
        data: row.data ? JSON.parse(row.data) : null,
        updatedAt: row.updatedAt,
        synced: row.synced,
        _rev: row._rev || "",
      }));
      return mapped.filter((r) => !(r.data && r.data.deleted === true));
    }
  }

  async getAllToSync() {
    // returns array of records with synced === 0 and not deleted
    if (this.isWeb) {
      const all = await this.localDB.getAll("records");
      return (all || [])
        .filter((r) => r.synced === 0 && !(r.data && r.data.deleted === true))
        .map((r) => ({
          id: r.id,
          _id: r._id || r.id,
          data: r.data,
          updatedAt: r.updatedAt,
          synced: r.synced,
          _rev: r._rev || "",
        }));
    } else {
      return await this.getAll("SELECT * FROM records WHERE synced = 0");
    }
  }

  /* ------------------------------
     Mark as synced (updates local _rev and synced flag)
     ------------------------------ */
  async markSynced(id, rev = null) {
    this._tracePush("markSynced:start", { id, rev });
    try {
      if (this.isWeb) {
        const record = await this.localDB.get("records", id);
        if (record) {
          record.synced = 1;
          if (rev) record._rev = rev;
          await this.localDB.put("records", record);
        }
      } else {
        if (rev) {
          await this.exec(`UPDATE records SET synced = 1, _rev = ? WHERE id = ?`, [rev, id]);
        } else {
          await this.exec(`UPDATE records SET synced = 1 WHERE id = ?`, [id]);
        }
      }
      this._tracePush("markSynced:done", { id, rev });
      this._safeEmitEvent("EVENT_DOC_SYNCED", { 
        table: this.tableName, 
        id, 
        _rev: rev 
      });
    } catch (err) {
      this._tracePush("markSynced:error", { id, error: this._preview(err) });
      throw err;
    }
  }

  /* ------------------------------
     HTTP fetch simple - SIN TIMEOUT
     ------------------------------ */
  async _fetchWithTimeout(resource, options = {}) {
    console.log(`[DB:${this.tableName}] → Request: ${options.method || "GET"} ${resource}`);

    // determine timeout: option > instance fetchTimeout > default
    const timeout = typeof options.timeout === "number" ? options.timeout : this.fetchTimeout || DEFAULT_FETCH_TIMEOUT;

    try {
      // Configurar axios request
      const axiosConfig = {
        url: resource,
        method: options.method || "GET",
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        timeout,
      };

      // Solo agregar data si existe y no es GET/HEAD
      if (options.body && axiosConfig.method !== "GET" && axiosConfig.method !== "HEAD") {
        axiosConfig.data = options.body;
      }

      // allow passing params
      if (options.params) axiosConfig.params = options.params;

      // log minimal info in debug mode
      if (this.debug) {
        console.log(resource);
        console.log(axiosConfig);
      }

      const response = await axios(axiosConfig);
      if (this.debug) console.log(`[DB:${this.tableName}] ← Respuesta: ${response.status}`);

      // Devolver un objeto similar a fetch Response para compatibilidad
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        json: async () => response.data,
        text: async () => (typeof response.data === 'string' ? response.data : JSON.stringify(response.data)),
      };

    } catch (error) {
      // Normalize timeout and axios errors
      const name = (error && error.code === 'ECONNABORTED') ? 'AbortError' : (error && error.name) || 'Error';
      const message = (error && error.message) || String(error);
      console.error(`[DB:${this.tableName}] ✗ Error: ${message}`);

      // Si es un error de axios con respuesta, devolverlo en formato compatible
      if (error && error.response) {
        return {
          ok: false,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          json: async () => error.response.data,
          text: async () => (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)),
        };
      }

      const normalized = new Error(message);
      normalized.name = name;
      throw normalized;
    }
  }

  /* ------------------------------
     Sync a single record (core logic)
     ------------------------------ */
  async _syncRecord(record) {
    // record: { id, _id, data, updatedAt, synced, _rev }
    this._tracePush("syncRecord:start", { id: record && record.id, preview: this._preview(record && record.data) });
    console.log(`[DB:${this.tableName}] ========================================`);
    console.log(`[DB:${this.tableName}] INICIO SINCRONIZACIÓN: ${record.id}`);
    console.log(`[DB:${this.tableName}] URL Base: ${this.couchUrl}`);
    console.log(`[DB:${this.tableName}] Tabla: ${this.tableName}`);
    console.log(`[DB:${this.tableName}] UpdatedAt: ${record.updatedAt}`);
    console.log(`[DB:${this.tableName}] Rev actual: ${record._rev || "ninguno"}`);
    console.log(`[DB:${this.tableName}] Timeout: ${this.fetchTimeout}ms`);
    console.log(`[DB:${this.tableName}] ========================================`);

    try {
      // handle deleted doc: remote delete
      if (record.data && record.data.deleted === true) {
        // check remote existence and delete remote if present
        try {
          const r = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}`);
          if (r.ok) {
            const remote = await r.json();
            if (remote && remote._rev) {
              await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}?rev=${remote._rev}`, { method: "DELETE" });
            }
          }
        } catch (e) {
          // ignore remote delete failures here; will retry later
        }
        await this.markSynced(record.id);
        return true;
      }

      // Prepare payload
      const docToSave = { _id: record.id, data: record.data, updatedAt: record.updatedAt };
      if (record._rev) docToSave._rev = record._rev;

      // Try GET remote to decide: create vs update vs conflict resolution
      let res;
      try {
        const url = `${this.couchUrl}/${this.tableName}/${record.id}`;
        console.log(`[DB:${this.tableName}] → Consultando documento remoto: ${url}`);
        res = await this._fetchWithTimeout(url);
        console.log(`[DB:${this.tableName}] ← Respuesta recibida: ${res.status}`);
      } catch (err) {
        // network issues: try direct PUT fallback
        console.warn(`[DB:${this.tableName}] ⚠️ Error al consultar remoto: ${err.name} - ${err.message}`);
        this._tracePush("syncRecord:fetchRemoteFailed", { id: record.id, error: this._preview(err) });
        
        // Try direct PUT fallback
        console.log(`[DB:${this.tableName}] → Intentando PUT directo...`);
        try {
          const putRes = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}`, {
            method: "PUT",
            body: JSON.stringify(docToSave)
          });
          
          if (!putRes.ok) {
            const errorText = await putRes.text();
            console.error(`[DB:${this.tableName}] ✗ PUT directo falló: ${putRes.status} - ${errorText}`);
            throw new Error(`Direct PUT failed: ${putRes.status} ${errorText}`);
          }
          
          console.log(`[DB:${this.tableName}] ✓ PUT directo exitoso`);
          
          // if PUT ok we need remote rev; best effort: try to GET once more
          try {
            const r2 = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}`);
            if (r2.ok) {
              const remote = await r2.json();
              await this.markSynced(record.id, remote._rev || remote.rev || null);
              console.log(`[DB:${this.tableName}] ✓ Rev obtenido y marcado como sincronizado`);
            } else {
              await this.markSynced(record.id);
              console.log(`[DB:${this.tableName}] ✓ Marcado como sincronizado (sin rev)`);
            }
            return true;
          } catch (_) {
            // if can't get rev, mark synced without rev (best effort)
            await this.markSynced(record.id);
            console.log(`[DB:${this.tableName}] ✓ Marcado como sincronizado (sin verificación de rev)`);
            return true;
          }
        } catch (putErr) {
          console.error(`[DB:${this.tableName}] ✗✗✗ PUT directo falló ✗✗✗`);
          console.error(`[DB:${this.tableName}] Error:`, putErr.message);
          this._tracePush("syncRecord:directPutFailed", { id: record.id, error: this._preview(putErr) });
          throw putErr;
        }
      }

      // If GET returned 404 => create remote
      if (res.status === 404) {
        const rCreate = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}`, {
          method: "PUT",
          body: JSON.stringify(docToSave),
        });
        const bodyText = await rCreate.text();
        let body = null;
        try {
          body = bodyText && bodyText.trim().startsWith("{") ? JSON.parse(bodyText) : null;
        } catch (_) {}
        if (rCreate.ok) {
          const rev = (body && (body.rev || body._rev)) || null;
          await this.markSynced(record.id, rev);
          return true;
        } else {
          throw new Error(`Create failed ${rCreate.status} ${bodyText}`);
        }
      }

      // Other HTTP errors
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`GET remote returned ${res.status}: ${txt}`);
      }

      // Remote exists: compare updatedAt to decide winner
      const remote = await res.json();
      const remoteUpdatedAt = remote && remote.updatedAt ? remote.updatedAt : 0;
      const remoteRev = remote && (remote._rev || remote.rev) ? remote._rev || remote.rev : null;

      if (!remoteRev || remoteUpdatedAt < record.updatedAt) {
        // local is newer -> update remote (include remote _rev if present)
        const putRes = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}${remoteRev ? `?rev=${remoteRev}` : ""}`, {
          method: "PUT",
          body: JSON.stringify({ ...docToSave, _rev: remoteRev }),
        });
        const putText = await putRes.text();
        let putBody = null;
        try {
          putBody = putText && putText.trim().startsWith("{") ? JSON.parse(putText) : null;
        } catch (_) {}
        if (putRes.ok) {
          const newRev = (putBody && (putBody.rev || putBody._rev)) || null;
          await this.markSynced(record.id, newRev);
          return true;
        } else {
          if (putRes.status === 409) {
            // Conflict: remote has newer rev - will be handled by periodic sync or conflict resolution next cycle
            throw new Error("Conflict 409 on PUT");
          }
          throw new Error(`PUT failed ${putRes.status}: ${putText}`);
        }
      } else if (remoteUpdatedAt > record.updatedAt) {
        // remote is newer -> save remote locally (overwrite local)
        if (remote.data && remote.data.deleted === true) {
          // remote deleted -> delete local
          // call internal delete (this will attempt remote delete too but remote already deleted)
          await this.delete(record.id);
          // mark as synced so local doesn't attempt to sync it again
          try {
            await this.markSynced(record.id, remoteRev);
          } catch (_) {}
          try {
            emitEvent("EVENT_REMOTE_DELETE", { table: this.tableName, id: record.id });
          } catch (_) {}
        } else {
          // save remote content locally and mark as synced
          await this._saveLocalInternal(remote.data, remote._id || record.id, remoteRev || "", remote.updatedAt, 1);
          try {
            emitEvent("EVENT_DOC_REMOTE_UPDATED", { table: this.tableName, id: record.id, data: remote.data });
          } catch (_) {}
        }
        return true;
      } else {
        // equal timestamps -> mark as synced and update rev if available
        await this.markSynced(record.id, remoteRev);
        return true;
      }
    } catch (err) {
      this._tracePush("syncRecord:error", { id: record.id, error: this._preview(err) });
      throw err;
    } finally {
      console.log(`[DB:${this.tableName}] ======================================== FIN SYNC ${record.id}`);
      this._tracePush("syncRecord:done", { id: record && record.id });
    }
  }

  // Immediate sync wrapper: returns true if success, false if network error (so caller can schedule)
  async _syncRecordImmediate(record) {
    this._tracePush("_syncRecordImmediate:start", { id: record && record.id });
    try {
      await this._syncRecord(record);
      this._tracePush("_syncRecordImmediate:success", { id: record && record.id });
      try {
        emitEvent("EVENT_SYNC_START", { table: this.tableName, id: record.id });
      } catch (_) {}
      return true;
    } catch (err) {
      // network/timeouts may be AbortError or TypeError - treat as retryable
      const isNetwork =
        err &&
        (err.name === "AbortError" ||
          err.name === "TypeError" ||
          (err.message && (err.message.toLowerCase().includes("fetch") || err.message.toLowerCase().includes("timeout") || err.message.toLowerCase().includes("aborted"))));
      this._tracePush("_syncRecordImmediate:error", { id: record && record.id, error: this._preview(err) });
      this._safeEmitEvent("EVENT_DOC_SYNC_FAILED", { 
        table: this.tableName, 
        id: record && record.id, 
        error: err && err.message 
      });
      if (isNetwork) return false;
      throw err;
    }
  }

  /* ------------------------------
     Helper para emitir eventos de forma segura
     ------------------------------ */
  _safeEmitEvent(eventName, data) {
    try {
      if (this.emitEvent) {
        emitEvent(eventName, data);
      }
    } catch (err) {
      // Silently ignore event emission errors
      this._tracePush("emitEvent:error", { event: eventName, error: this._preview(err) });
    }
  }

  /* ------------------------------
     Polling de cambios remotos basado en _changes con seq
     ------------------------------ */
  startChangePolling() {
    if (this.pollIntervalId) {
      console.log(`[DB:${this.tableName}] Change polling ya está activo`);
      return;
    }

    console.log(`[DB:${this.tableName}] Iniciando change polling (intervalo: ${this.pollInterval}ms)`);
    
    const poll = async () => {
      if (this.isPolling) {
        console.log(`[DB:${this.tableName}] Polling ya en ejecución, saltando ciclo`);
        return;
      }

      try {
        this.isPolling = true;
        await this._checkRemoteChanges();
      } catch (err) {
        console.error(`[DB:${this.tableName}] Error en change polling:`, err.message);
        this._tracePush("changePolling:error", { error: this._preview(err) });
      } finally {
        this.isPolling = false;
      }
    };

    // Primera ejecución inmediata
    poll();
    
    // Configurar ejecución periódica
    this.pollIntervalId = setInterval(poll, this.pollInterval);
    this._tracePush("startChangePolling:started", { interval: this.pollInterval });
  }

  stopChangePolling() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
      console.log(`[DB:${this.tableName}] Change polling detenido`);
      this._tracePush("stopChangePolling:stopped");
    }
  }

  async _checkRemoteChanges() {
    try {
      const url = `${this.couchUrl}/${this.tableName}/_changes?since=${this.lastSeq}&include_docs=true`;
      
      if (this.debug) {
        console.log(`[DB:${this.tableName}] Consultando cambios desde seq: ${this.lastSeq}`);
      }

      const res = await this._fetchWithTimeout(url);
      
      if (!res.ok) {
        console.warn(`[DB:${this.tableName}] Error consultando _changes: ${res.status}`);
        return;
      }

      const changes = await res.json();
      
      if (!changes.results || changes.results.length === 0) {
        if (this.debug) {
          console.log(`[DB:${this.tableName}] No hay cambios remotos`);
        }
        return;
      }

      console.log(`[DB:${this.tableName}] 📥 ${changes.results.length} cambios remotos detectados`);
      
      // Procesar cada cambio
      for (const change of changes.results) {
        await this._processRemoteChange(change);
      }

      // Actualizar última secuencia procesada
      if (changes.last_seq) {
        this.lastSeq = changes.last_seq;
        if (this.debug) {
          console.log(`[DB:${this.tableName}] Última seq actualizada: ${this.lastSeq}`);
        }
      }

      this._tracePush("checkRemoteChanges:done", { 
        changesCount: changes.results.length, 
        lastSeq: this.lastSeq 
      });

    } catch (err) {
      console.error(`[DB:${this.tableName}] Error verificando cambios remotos:`, err.message);
      this._tracePush("checkRemoteChanges:error", { error: this._preview(err) });
      throw err;
    }
  }

  async _processRemoteChange(change) {
    try {
      const docId = change.id;
      const remoteDoc = change.doc;

      if (!remoteDoc) {
        console.warn(`[DB:${this.tableName}] Cambio sin documento: ${docId}`);
        return;
      }

      if (this.debug) {
        console.log(`[DB:${this.tableName}] Procesando cambio para: ${docId}`);
      }

      // Verificar si existe localmente
      const localRecord = await this.getWithHeader(docId);

      // Si el documento remoto está eliminado
      if (change.deleted || (remoteDoc.data && remoteDoc.data.deleted === true)) {
        if (localRecord) {
          console.log(`[DB:${this.tableName}] 🗑️ Eliminando local: ${docId}`);
          await this._deleteLocalOnly(docId);
          
          if (this.live) {
            emitEvent(EVENT_REMOTE_CHANGE, { 
              table: this.tableName, 
              id: docId, 
              deleted: true 
            });
          }
        }
        return;
      }

      // Si no existe localmente, crear
      if (!localRecord) {
        console.log(`[DB:${this.tableName}] ➕ Creando local desde remoto: ${docId}`);
        await this._saveLocalInternal(
          remoteDoc.data,
          docId,
          remoteDoc._rev || "",
          remoteDoc.updatedAt || Date.now(),
          1 // synced
        );
        
        if (this.live) {
          emitEvent(EVENT_REMOTE_CHANGE, { 
            table: this.tableName, 
            id: docId, 
            data: remoteDoc.data,
            _rev: remoteDoc._rev 
          });
        }
        return;
      }

      // Si existe localmente, comparar updatedAt
      const remoteUpdatedAt = remoteDoc.updatedAt || 0;
      const localUpdatedAt = localRecord.updatedAt || 0;

      if (remoteUpdatedAt > localUpdatedAt) {
        console.log(`[DB:${this.tableName}] 🔄 Actualizando local (remoto más reciente): ${docId}`);
        await this._saveLocalInternal(
          remoteDoc.data,
          docId,
          remoteDoc._rev || "",
          remoteDoc.updatedAt,
          1 // synced
        );
        
        if (this.live) {
          emitEvent(EVENT_REMOTE_CHANGE, { 
            table: this.tableName, 
            id: docId, 
            data: remoteDoc.data,
            _rev: remoteDoc._rev 
          });
        }
      } else if (localUpdatedAt > remoteUpdatedAt && localRecord.synced === 0) {
        // Local más reciente y no sincronizado -> sincronizar
        console.log(`[DB:${this.tableName}] ⬆️ Local más reciente, sincronizando: ${docId}`);
        await this._syncRecord(localRecord);
      } else {
        // Fechas iguales o local ya sincronizado
        if (this.debug) {
          console.log(`[DB:${this.tableName}] ✓ Sin cambios necesarios: ${docId}`);
        }
        // Asegurar que esté marcado como sincronizado
        if (localRecord.synced === 0) {
          await this.markSynced(docId, remoteDoc._rev);
        }
      }

      this._tracePush("processRemoteChange:done", { id: docId });

    } catch (err) {
      console.error(`[DB:${this.tableName}] Error procesando cambio ${change.id}:`, err.message);
      this._tracePush("processRemoteChange:error", { 
        id: change.id, 
        error: this._preview(err) 
      });
    }
  }

  async _deleteLocalOnly(id) {
    try {
      if (this.isWeb) {
        await this.localDB.delete("records", id);
      } else {
        await this.localDB.execAsync(`DELETE FROM records WHERE id = ?`, [id]);
      }
      this._tracePush("deleteLocalOnly:done", { id });
    } catch (err) {
      console.error(`[DB:${this.tableName}] Error eliminando local:`, err);
      throw err;
    }
  }



  /* ------------------------------
     Obtener registro con headers (incluyendo synced, _rev, etc)
     ------------------------------ */
  async getWithHeader(id) {
    try {
      if (this.isWeb) {
        const record = await this.localDB.get("records", id);
        return record || null;
      } else {
        const rows = await this.exec("SELECT * FROM records WHERE id = ?", [id]);
        if (!rows || rows.length === 0) return null;
        
        const row = rows[0];
        return {
          id: row.id,
          _id: row._id || row.id,
          data: row.data ? JSON.parse(row.data) : null,
          updatedAt: row.updatedAt,
          synced: row.synced,
          _rev: row._rev || "",
        };
      }
    } catch (err) {
      console.error(`[DB:${this.tableName}] Error obteniendo con header:`, err);
      return null;
    }
  }

  /* ------------------------------
     Debug / Stats helpers
     ------------------------------ */
  printTrace(n = 50) {
    const tail = this._trace.slice(-n);
    console.log(`[DB:${this.tableName}] Last ${tail.length} trace entries:`);
    for (const e of tail) {
      console.log(new Date(e.ts).toISOString(), e.event, e.payload);
    }
  }

  
}
