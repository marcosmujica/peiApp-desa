import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import { openDB } from "idb";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "buffer";
import { EVENT_NEW_DOC, emitEvent } from "./DBEvents";


//const _dbURL = "http://192.168.68.53:5984";
const _dbURL = "http://34.39.168.70:5984";
const _username = "admin_X9!fQz7#Lp4Rt8$Mh2";
const _password = "G@7hX!2$kP9^mQ4&rZ6*Ty1wVb";
const _syncInterval = 20000
const _type = "LOCAL"
const _fetchTimeout = 10000
const _fetchTimeoutLongPool = 60000

export class DB {
  constructor({
    name,
    type: typeParam,
    username: usernameParam,
    password: passwordParam,
    syncInterval : syncIntervalParam,
    index = [],
    debug = false,
  }) {
    try{
      this.tableName = name;
      this.couchUrl = _dbURL;
      this.isWeb = Platform.OS == "web";
      // mm - si no vienen los valores los tomo por defecto
      this.username = (typeof usernameParam !== 'undefined') ? usernameParam : _username;
      this.password = (typeof passwordParam !== 'undefined') ? passwordParam : _password;
      this.syncInterval = (typeof syncIntervalParam !== 'undefined') ? syncIntervalParam : _syncInterval;
      this.type = (typeof typeParam !== 'undefined') ? typeParam : _type;
      this.index = index
      this.authHeader = "Basic " + Buffer.from(`${this.username}:${this.password}`).toString("base64");
      this.localDB = null;
      this.syncing = false;
      this.debug = !!debug;
      this._trace = [];
      this._maxTrace = 1000; // cap to avoid unbounded memory
    }
    catch (e)
    {
      console.log ("A iniciailizar DB " + JSON.stringify(e))
    }
  }

  // --- Helper para fetch con timeout ---
  async _fetchWithTimeout(resource, options = {}) {
    const { timeout = _fetchTimeout } = options;
    options = {...options, headers: { Authorization: this.authHeader, "Content-Type": "application/json" }}
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resource, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  }

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
        //await this.syncAllNow();
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
    try {
      const records = await this.getAllToSync();
      for (const r of records.filter((r) => r.synced === 0)) {
        await this.syncRecord(r);
      }
    } catch (err) {
      console.warn("Error en sincronización inicial:", err);
    }
  }

  /** Guardar o actualizar registro local */
  async saveLocal(data, id = "", rev = "") {
    const updatedAt = Date.now();
    try {
      if (id == "" || id==null || id==undefined) {
        id = uuidv4();
      }
    } catch (e) {
      console.log(e);
    }

    // Si el registro está marcado como eliminado, guardar la marca
    const isDeleted = data && data.deleted === true;
    const record = {
      id: id == "" ? (id = uuidv4()) : id,
      _id: id == "" ? (id = uuidv4()) : id,
      data,
      updatedAt,
      synced: 0,
      _rev: rev || (data && data._rev) || "",
    };

    try {
      if (this.isWeb) {
        await this.localDB.put("records", record);
      } else {
        await this.exec(
          `INSERT OR REPLACE INTO records (id, data, updatedAt, synced, _rev, _id) VALUES (?, ?, ?, 0, ?, ?)`,
          [id, JSON.stringify(data), updatedAt, record._rev, record._id]
        );
      }
      this._tracePush('saveLocal:done', { id, _rev: record._rev, _id: record._id });

      this.startSync(); // mm - al final intento sincronizar asincornico
  try { emitEvent(EVENT_NEW_DOC, { table: this.tableName, id, _id: record._id, data: data, preview: this._preview(data), source: 'local', synced: false }); } catch(e) {}
      return id;
    } catch (err) {
      console.error("Error guardando local:", err);
      throw err;
    }


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

  /** Sincroniza un registro con CouchDB */
  async syncRecord(record) {
    this._tracePush('syncRecord:start', { id: record && record.id, preview: this._preview(record && record.data) });
    try {
      // Si el registro está eliminado, eliminar también en remoto si existe
  if (record.data && record.data.deleted === true) {
        // Intentar eliminar en remoto
        try {
          const res = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}`);
          if (res.ok) {
            const remote = await res.json();
            if (remote && remote._rev) {
              await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}?rev=${remote._rev}`,{method: "DELETE"});
            }
          }
        } catch (e) {
          console.warn("Error eliminando remoto (se ignorará localmente):", e);
        }
        await this.markSynced(record.id);
        return;
      }
      const docToSave = {
        _id: record.id,
        data: record.data,
        updatedAt: record.updatedAt,
      };
      const res = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}`);

      // Read response text safely and try to parse JSON when possible.
      let resText = null;
      try { resText = await res.text(); } catch (e) { resText = null; }
      let resBody = null;
      try {
        if (resText && resText.trim().startsWith('{')) resBody = JSON.parse(resText);
      } catch (e) {
        resBody = null;
      }

      this._tracePush('syncRecord:fetchRemoteHead', { status: res.status, bodyPreview: this._preview(resBody) });

      // Handle not-found responses from CouchDB which often come as 404 with a JSON body
      if (res.status === 404 || (resBody && resBody.error === 'not_found')) {
        // Documento no existe en remoto → crear
        const r = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}`,
          { method: "PUT", body: JSON.stringify(docToSave)}
        );
        let createdBody = null;
        try { const text = await r.text(); if (text && text.trim().startsWith('{')) createdBody = JSON.parse(text); } catch (e) { createdBody = null; }
        if (r.ok) {
          try {
            const rev = (createdBody && (createdBody.rev || createdBody._rev)) || null;
            this._tracePush('syncRecord:createdRemote', { id: record.id, rev, bodyPreview: this._preview(createdBody) });
            await this.markSynced(record.id, rev);
          } catch (e) {
            this._tracePush('syncRecord:createParseError', { error: this._preview(e) });
            await this.markSynced(record.id);
          }
        } else {
          this._tracePush('syncRecord:createFailed', { status: r.status, bodyPreview: this._preview(createdBody) });
        }
      } else if (!res.ok) {
        // Other HTTP errors (auth, server error, etc). Trace and retry later.
        this._tracePush('syncRecord:fetchRemoteHead:error', { status: res.status, bodyPreview: this._preview(resBody) });
        return;
      } else {
        const remote = resBody || (await res.json());
        // Resolver conflicto por fecha
        if (!remote._rev || remote.updatedAt < record.updatedAt) {
          // Local más reciente → actualizar remoto
          const r = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}?rev=${remote._rev}`,
            {method: "PUT", body: JSON.stringify({ ...docToSave, _rev: remote._rev }),}
          );
          if (r.ok) {
            try {
              const result = await r.json();
              const rev = result.rev || result._rev || null;
              this._tracePush('syncRecord:updatedRemote', { id: record.id, rev });
              await this.markSynced(record.id, rev);
            } catch (e) {
              this._tracePush('syncRecord:updateParseError', { error: this._preview(e) });
              await this.markSynced(record.id);
            }
          }
        } else if (remote.updatedAt > record.updatedAt) {
          // Remoto más reciente → actualizar local
          // Si el remoto está eliminado, eliminar localmente
          if (remote.data && remote.data.deleted === true) {
            this._tracePush('syncRecord:remoteDeleted', { id: remote._id });
            await this.delete(record.id);
          } else {
            this._tracePush('syncRecord:remoteNewer', { id: remote._id, rev: remote._rev });
            await this.saveLocal(remote.data, remote._id, remote._rev);
            await this.markSynced(remote._id, remote._rev);
          }
        }
      }
    } catch (err) {
      console.warn("Error sincronizando registro, se reintentará:", record.id, err);
      this._tracePush('syncRecord:error', { id: record && record.id, error: this._preview(err) });
    }
    this._tracePush('syncRecord:done', { id: record && record.id });
  }

  /** Sincronización periódica */
  async startSync() {
    if (this.syncing || this.type == "LOCAL") return;
    this.syncing = true;

    // Ejecutar sincronización inmediatamente
    const doSync = async () => {
      const records = await this.getAllToSync();
      for (const r of records.filter((r) => r.synced === 0)) {
        await this.syncRecord(r);
      }
    };

    doSync(); // Primera sincronización inmediata
    setInterval(doSync, this.syncInterval);
  }

  /** Longpoll para cambios remotos */
  async listenChanges() {
    const poll = async () => {
      try {
        // Increase timeout for longpoll requests to avoid AbortError
        const res = await this._fetchWithTimeout(
          `${this.couchUrl}/${this.tableName}/_changes?feed=longpoll&since=now`,{timeout: _fetchTimeoutLongPool});
        const text = await res.text();
        if (text.startsWith("{")) {
          const changes = JSON.parse(text);
          for (const c of changes.results) {
            const docRes = await fetch(
              `${this.couchUrl}/${this.tableName}/${c.id}`,
              {
                headers: {
                  Authorization: this.authHeader,
                  Accept: "application/json",
                },
              }
            );
            const doc = await docRes.json();
            // Si el remoto está eliminado, eliminar localmente
            if (doc.data && doc.data.deleted === true) {
              await this.delete(doc._id);
            } else {
              await this.saveLocal(doc.data, doc._id);
              await this.markSynced(doc._id);
            }

            // mm - emito evento de nuevo doc (remoto)
            // This event comes from the server; mark it as synced/remote so
            // listeners know the document is confirmed on the server.
            emitEvent(EVENT_NEW_DOC, { table: this.tableName, data: doc.data, id: doc._id, doc, source: 'remote', synced: true });
          }
        } else {
          console.error("Respuesta inesperada:", text);
        }
      } catch (err) {
        console.warn("Error longpoll:", err);
      } finally {
        setTimeout(poll, 5000);
      }
    };
    poll();
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
    aux == [] ? {} : aux[0];
  }

  async update(id, newData) {
    const result = await this.saveLocal(newData, id);
    return result;
  }

  async delete(id) {
    try {
      if (this.isWeb) await this.localDB.delete("records", id);
      else
        await this.localDB.execAsync(`DELETE FROM records WHERE id = ?`, [id]);

      // Eliminar remoto
      const res = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${id}`);
      if (res.ok) {
        const doc = await res.json();
        await this._fetchWithTimeout(
          `${this.couchUrl}/${this.tableName}/${id}?rev=${doc._rev}`,{method: "DELETE"})
      }
    } catch (err) {
      console.warn("Error borrando remoto:", err);
    }
  }
}
