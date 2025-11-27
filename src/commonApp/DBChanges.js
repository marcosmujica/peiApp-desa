// DBChanges.js
// Simple cross-environment event emitter singleton for the app.
// Provides: on, off, once, emit, clear, listenerCount
import {emitEvent } from "./DBEvents";
import {DB_EVENT } from "./dataTypes"
import {EVENT_DB_CHANGE } from "./DBEvents"
import { _idUser } from "./profile"
import { db_addDirect } from "./database"

const WS_URL = "wss://wss.peiapp.tech"; // ejemplo
const WS_USERNAME = "admin_X9!fQz7#Lp4Rt8$Mh2";
const WS_PASSWORD = "G@7hX!2$kP9^mQ4&rZ6*Ty1wVb";

class DBChanges {
  constructor() {
    // empty constructor by requirement; initialize internal storage
    this._listeners = new Map(); // event -> Set of handlers
    this.ws = null;
    this._connecting = false;
  }

  init()
  {
    // guard: do not create multiple websocket connections
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    if (this._connecting) return;
    this._connecting = true;
    try {
      // keep the alert only for development; it can be removed later
      console.log (_idUser)
      this.ws = new WebSocket(WS_URL+ "?idUser="+encodeURIComponent(_idUser));
      this.ws.onopen = () => {
        console.log("Conectado al servidor de cambios");
        this._connecting = false;
      };

      this.ws.onmessage = (msg) => {
        try {
          let event = new DB_EVENT ()
          const data = JSON.parse (msg.data)
          event.table = data.db
          event._id = data.change.doc._id
          event._rev = data.change.doc._rev
          event.data = data.change.doc.data
          event.source = "REMOTE"
          db_addDirect (event.table, event._id, event.data)
          emitEvent(EVENT_DB_CHANGE, event)
          //emitEvent(EVENT_REMOTE_CHANGE, { ...data.change.doc, table: data.db });
        } catch (err) {
          console.log('[DBChanges] failed to handle message', err);
        }
        // aquí actualizas tu estado local o sincronizás PouchDB, etc.
      };

      this.ws.onclose = () => {
        this.ws = null;
        this._connecting = false;
        setTimeout(() => this.init(), 5000);
      };

      this.ws.onerror = (err) => {
        console.log('[DBChanges] websocket error', err);
      };
    } catch (e) {
      console.log('[DBChanges] init failed', e);
      this._connecting = false;
    }
  }

  on(event, handler) {
    if (typeof handler !== 'function') throw new TypeError('handler must be a function');
    let set = this._listeners.get(event);
    if (!set) {
      set = new Set();
      this._listeners.set(event, set);
    }
    set.add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (!this._listeners.has(event)) return false;
    if (!handler) {
      this._listeners.delete(event);
      return true;
    }
    const set = this._listeners.get(event);
    const removed = set.delete(handler);
    if (set.size === 0) this._listeners.delete(event);
    return removed;
  }

  once(event, handler) {
    if (typeof handler !== 'function') throw new TypeError('handler must be a function');
    const wrapper = (...args) => {
      try {
        handler(...args);
      } finally {
        this.off(event, wrapper);
      }
    };
    this.on(event, wrapper);
    return () => this.off(event, wrapper);
  }

  emit(event, data) {
    const set = this._listeners.get(event);
    if (!set || set.size === 0) return 0;
    // copy to avoid mutation during iteration
    const handlers = Array.from(set);
    for (const h of handlers) {
      try {
        h(data);
      } catch (err) {
        // do not throw to other listeners; log if available
        if (typeof console !== 'undefined' && console.error) {
          console.log(`[DBChanges] handler error for event '${event}':`, err && err.message ? err.message : err);
        }
      }
    }
    return handlers.length;
  }

  clear(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }

  listenerCount(event) {
    if (!event) {
      let total = 0;
      for (const s of this._listeners.values()) total += s.size;
      return total;
    }
    const s = this._listeners.get(event);
    return s ? s.size : 0;
  }
}

// export only the singleton instance (do not expose the class)
// Note: We do NOT freeze the instance because it needs to modify internal state (_connecting, ws)
// The singleton pattern ensures only one instance exists across the app.
const dbChanges = new DBChanges();

// Named and default export for flexibility. Prefer importing from 'commonApp' barrel.
export { dbChanges };
export default dbChanges;

