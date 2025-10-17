import * as SQLite from 'expo-sqlite';

/**
 * Clase híbrida que emula PouchDB usando:
 * - Expo SQLite (modo async) en entornos nativos (Expo / React Native)
 * - IndexedDB en entorno Web
 */
export class PouchDBLiteHybrid {
  constructor(dbName = 'defaultDB', remoteSyncFn = null) {
    this.dbName = dbName;
    this.remoteSyncFn = remoteSyncFn;
    this.listeners = [];
    this.isWeb = typeof window !== 'undefined' && !!window.indexedDB;
    this._initPromise = this._init();
  }

  async _init() {
    if (this.isWeb) {
      // 🧱 Inicializa IndexedDB
      this.db = await this._initIndexedDB();
    } else {
      // 📱 Inicializa Expo SQLite
      this.db = await SQLite.openDatabaseAsync(this.dbName);
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS docs (
          id TEXT PRIMARY KEY NOT NULL,
          rev TEXT,
          data TEXT
        );
      `);
    }
  }

  async _initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('docs')) {
          db.createObjectStore('docs', { keyPath: 'id' });
        }
      };
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  _newRev() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  // ------------------------------------
  // 🔹 PUT
  // ------------------------------------
  async put(doc) {
    await this._initPromise;
    if (!doc._id) throw new Error('Document must have an _id');

    const rev = this._newRev();
    const fullDoc = { ...doc, _rev: rev };

    if (this.isWeb) {
      await this._idbPut(fullDoc);
    } else {
      const jsonData = JSON.stringify(fullDoc);
      await this.db.runAsync(
        `INSERT OR REPLACE INTO docs (id, rev, data) VALUES (?, ?, ?);`,
        [doc._id, rev, jsonData]
      );
    }

    this._emitChange({ id: doc._id, doc: fullDoc, operation: 'put' });

    if (this.remoteSyncFn) {
      try {
        await this.remoteSyncFn(fullDoc);
      } catch (err) {
        console.warn(`⚠️ Error de sincronización remota: ${err.message}`);
      }
    }

    return { ok: true, id: doc._id, rev };
  }

  async _idbPut(doc) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['docs'], 'readwrite');
      tx.objectStore('docs').put(doc);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  // ------------------------------------
  // 🔹 GET
  // ------------------------------------
  async get(id) {
    await this._initPromise;
    if (this.isWeb) {
      return this._idbGet(id);
    }
    const rows = await this.db.getAllAsync(`SELECT data FROM docs WHERE id = ?;`, [id]);
    if (rows.length === 0) throw { status: 404, message: 'not_found' };
    return JSON.parse(rows[0].data);
  }

  async _idbGet(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['docs'], 'readonly');
      const req = tx.objectStore('docs').get(id);
      req.onsuccess = (e) => {
        const result = e.target.result;
        if (!result) return reject({ status: 404, message: 'not_found' });
        resolve(result);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // ------------------------------------
  // 🔹 allDocs
  // ------------------------------------
  async allDocs() {
    await this._initPromise;

    if (this.isWeb) {
      const docs = await this._idbAllDocs();
      return { total_rows: docs.length, rows: docs };
    }

    const rows = await this.db.getAllAsync(`SELECT data FROM docs;`);
    const docs = rows.map(r => JSON.parse(r.data));
    return { total_rows: docs.length, rows: docs };
  }

  async _idbAllDocs() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['docs'], 'readonly');
      const store = tx.objectStore('docs');
      const request = store.getAll();
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // ------------------------------------
  // 🔹 remove
  // ------------------------------------
  async remove(doc) {
    await this._initPromise;
    if (!doc._id) throw new Error('Document must have an _id');

    if (this.isWeb) {
      await this._idbRemove(doc._id);
    } else {
      await this.db.runAsync(`DELETE FROM docs WHERE id = ?;`, [doc._id]);
    }

    this._emitChange({ id: doc._id, deleted: true, operation: 'remove' });
    return { ok: true, id: doc._id };
  }

  async _idbRemove(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['docs'], 'readwrite');
      tx.objectStore('docs').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  // ------------------------------------
  // 🔹 changes (listeners)
  // ------------------------------------
  changes({ live = false, onChange } = {}) {
    if (live && typeof onChange === 'function') {
      this.listeners.push(onChange);
    }
    return {
      cancel: () => {
        this.listeners = this.listeners.filter(l => l !== onChange);
      },
    };
  }

  _emitChange(change) {
    for (const listener of this.listeners) {
      try {
        listener(change);
      } catch (err) {
        console.warn('Listener error:', err.message);
      }
    }
  }

  // ------------------------------------
  // 🔹 destroy
  // ------------------------------------
  async destroy() {
    await this._initPromise;

    if (this.isWeb) {
      indexedDB.deleteDatabase(this.dbName);
    } else {
      await this.db.execAsync(`DROP TABLE IF EXISTS docs;`);
    }

    this._emitChange({ operation: 'destroy' });
    return { ok: true };
  }
}
