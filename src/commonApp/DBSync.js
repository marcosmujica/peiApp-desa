import { Buffer } from "buffer";

/**
 * Clase para manejar toda la sincronización entre base de datos local y CouchDB
 * Separada de DB.js para mejor debugging y mantenibilidad
 */
export class DBSync {
  constructor({
    tableName,
    couchUrl,
    username,
    password,
    fetchTimeout = 30000,
    syncInterval = 10000,
    debug = false,
    onMarkSynced = null, // Callback para marcar registro como sincronizado
    onSaveLocal = null,  // Callback para guardar localmente
    onDelete = null      // Callback para eliminar
  }) {
    this.tableName = tableName;
    this.couchUrl = couchUrl;
    this.username = username;
    this.password = password;
    this.fetchTimeout = fetchTimeout;
    this.syncInterval = syncInterval;
    this.debug = !!debug;
    
    // Callbacks para interactuar con DB
    this.onMarkSynced = onMarkSynced;
    this.onSaveLocal = onSaveLocal;
    this.onDelete = onDelete;
    
    // Auth
    this.authHeader = "Basic " + Buffer.from(`${this.username}:${this.password}`).toString("base64");
    
    // Control de sincronización
    this.syncing = false;
    this.syncIntervalId = null;
    
    // Control de listenChanges
    this.listeningPaused = false;
    this.syncInProgress = new Set(); // IDs actualmente sincronizándose
    
    // Trace para debugging
    this._trace = [];
    this._maxTrace = 1000;
    
    // Estadísticas
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      networkErrors: 0,
      directPuts: 0,
      lastSyncTime: null,
      avgSyncTime: 0
    };
  }

  // ============================================================================
  // TRACE Y DEBUG
  // ============================================================================

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
        console.log(`[DBSync:${this.tableName}] ${event}`, payload);
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

  getTraceFor(id) {
    if (!id) return [];
    return this._trace.filter(e => {
      const p = e.payload || {};
      return p.id === id || p._id === id || 
             (p.preview && p.preview.indexOf(id) !== -1) || 
             (p.paramsPreview && p.paramsPreview.indexOf(id) !== -1);
    });
  }

  printTraceFor(id) {
    const entries = this.getTraceFor(id);
    console.log(`[DBSync] Trace for ${id} (${entries.length} entries):`);
    for (const e of entries) {
      console.log(new Date(e.ts).toISOString(), e.event, e.payload);
    }
  }

  getTraceByEvent(eventName) {
    return this._trace.filter(e => e.event === eventName);
  }

  printLast(n = 50) {
    const tail = this._trace.slice(-n);
    console.log(`[DBSync] Last ${tail.length} trace entries:`);
    for (const e of tail) console.log(new Date(e.ts).toISOString(), e.event, e.payload);
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      networkErrors: 0,
      directPuts: 0,
      lastSyncTime: null,
      avgSyncTime: 0
    };
  }

  // ============================================================================
  // FETCH CON TIMEOUT
  // ============================================================================

  async _fetchWithTimeout(resource, options = {}) {
    const { timeout = this.fetchTimeout } = options;
    options = {...options, headers: { Authorization: this.authHeader, "Content-Type": "application/json" }}
    const controller = new AbortController();
    const id = setTimeout(() => {
      console.warn(`[DBSync:${this.tableName}] ⏱️ TIMEOUT alcanzado (${timeout}ms) para: ${resource}`);
      controller.abort();
    }, timeout);
    
    const startTime = Date.now();
    console.log(`[DBSync:${this.tableName}] 📡 Fetch iniciado: ${resource} (timeout: ${timeout}ms)`);
    
    try {
      const response = await fetch(resource, { ...options, signal: controller.signal });
      clearTimeout(id);
      const elapsed = Date.now() - startTime;
      console.log(`[DBSync:${this.tableName}] ✓ Fetch completado en ${elapsed}ms (status: ${response.status})`);
      return response;
    } catch (e) {
      clearTimeout(id);
      const elapsed = Date.now() - startTime;
      console.error(`[DBSync:${this.tableName}] ✗ Fetch falló después de ${elapsed}ms: ${e.name} - ${e.message}`);
      
      // Mejorar el mensaje de error
      if (e.name === 'AbortError') {
        this.stats.networkErrors++;
        const error = new Error(`Request timeout after ${elapsed}ms (limit: ${timeout}ms): ${resource}`);
        error.name = 'AbortError';
        error.originalError = e;
        error.elapsed = elapsed;
        error.resource = resource;
        throw error;
      }
      throw e;
    }
  }

  // ============================================================================
  // SINCRONIZACIÓN DE UN REGISTRO
  // ============================================================================

  /**
   * Sincroniza un registro con CouchDB
   * @param {Object} record - Registro a sincronizar {id, _id, data, updatedAt, synced, _rev}
   * @returns {Promise<boolean>} - true si se sincronizó exitosamente
   */
  async syncRecord(record) {
    this._tracePush('syncRecord:start', { id: record && record.id, preview: this._preview(record && record.data) });
    console.log(`[DBSync:${this.tableName}] ==========================================`);
    console.log(`[DBSync:${this.tableName}] INICIO SINCRONIZACIÓN: ${record.id}`);
    console.log(`[DBSync:${this.tableName}] URL: ${this.couchUrl}/${this.tableName}/${record.id}`);
    console.log(`[DBSync:${this.tableName}] UpdatedAt: ${record.updatedAt}`);
    console.log(`[DBSync:${this.tableName}] Rev actual: ${record._rev}`);
    console.log(`[DBSync:${this.tableName}] Timeout: ${this.fetchTimeout}ms`);
    console.log(`[DBSync:${this.tableName}] ==========================================`);
    
    const syncStart = Date.now();
    this.stats.totalSyncs++;
    
    try {
      // Si el registro está eliminado, eliminar también en remoto si existe
      if (record.data && record.data.deleted === true) {
        await this._syncDeletedRecord(record);
        this.stats.successfulSyncs++;
        return true;
      }
      
      const docToSave = {
        _id: record.id,
        data: record.data,
        updatedAt: record.updatedAt,
      };
      
      console.log(`[DBSync:${this.tableName}] → Consultando documento remoto (timeout: ${this.fetchTimeout}ms)...`);
      const startTime = Date.now();
      const res = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}`);
      const elapsed = Date.now() - startTime;
      console.log(`[DBSync:${this.tableName}] ← Respuesta recibida en ${elapsed}ms`);

      // Read response text safely and try to parse JSON when possible.
      let resText = null;
      try { 
        resText = await res.text(); 
        console.log(`[DBSync:${this.tableName}] ← Respuesta remota (${res.status}):`, resText.substring(0, 200));
      } catch (e) { 
        console.warn(`[DBSync:${this.tableName}] Error leyendo respuesta:`, e.message);
        resText = null; 
      }
      
      let resBody = null;
      try {
        if (resText && resText.trim().startsWith('{')) resBody = JSON.parse(resText);
      } catch (e) {
        console.warn(`[DBSync:${this.tableName}] Error parseando JSON:`, e.message);
        resBody = null;
      }

      this._tracePush('syncRecord:fetchRemoteHead', { status: res.status, bodyPreview: this._preview(resBody) });

      // Handle not-found responses from CouchDB which often come as 404 with a JSON body
      if (res.status === 404 || (resBody && resBody.error === 'not_found')) {
        await this._createRemoteDocument(record, docToSave);
        this.stats.successfulSyncs++;
        this._updateAvgSyncTime(Date.now() - syncStart);
        return true;
      } else if (!res.ok) {
        // Other HTTP errors (auth, server error, etc).
        console.error(`[DBSync:${this.tableName}] ✗✗✗ ERROR OBTENIENDO DOCUMENTO REMOTO (${res.status}) ✗✗✗`);
        this._tracePush('syncRecord:fetchRemoteHead:error', { status: res.status, bodyPreview: this._preview(resBody) });
        throw new Error(`HTTP ${res.status}: ${JSON.stringify(resBody)}`);
      } else {
        const remote = resBody || (await res.json());
        await this._resolveConflict(record, remote, docToSave);
        this.stats.successfulSyncs++;
        this._updateAvgSyncTime(Date.now() - syncStart);
        return true;
      }
    } catch (err) {
      this.stats.failedSyncs++;
      
      // Verificar si es un error de red/timeout
      const isNetworkError = err.name === 'AbortError' || 
                            err.name === 'TypeError' || 
                            err.message.includes('fetch') ||
                            err.message.includes('timeout') ||
                            err.message.includes('aborted');
      
      if (isNetworkError) {
        console.warn(`[DBSync:${this.tableName}] ⚠️ Error de red/timeout: ${err.name} - ${err.message}`);
        this._tracePush('syncRecord:networkError', { id: record && record.id, error: err.name });
        
        // Intentar un PUT directo como último recurso
        console.log(`[DBSync:${this.tableName}] → Intentando sincronización directa (PUT sin GET previo)...`);
        try {
          await this._syncRecordDirect(record);
          console.log(`[DBSync:${this.tableName}] ✓ Sincronización directa exitosa`);
          this.stats.successfulSyncs++;
          this.stats.directPuts++;
          return true;
        } catch (directErr) {
          console.warn(`[DBSync:${this.tableName}] ⚠️ Sincronización directa también falló:`, directErr.message);
          // Seguir con el throw del error original
        }
      } else {
        console.error(`[DBSync:${this.tableName}] ✗✗✗ ERROR SINCRONIZANDO REGISTRO ✗✗✗:`, record.id, err);
        console.error(`[DBSync:${this.tableName}] Stack:`, err.stack);
        this._tracePush('syncRecord:error', { id: record && record.id, error: this._preview(err) });
      }
      throw err;
    } finally {
      console.log(`[DBSync:${this.tableName}] ========================================== FIN SYNC`);
      this._tracePush('syncRecord:done', { id: record && record.id });
      this.stats.lastSyncTime = Date.now();
    }
  }

  /**
   * Sincroniza un registro eliminado
   */
  async _syncDeletedRecord(record) {
    try {
      const res = await this._fetchWithTimeout(`${this.couchUrl}/${this.tableName}/${record.id}`);
      if (res.ok) {
        const remote = await res.json();
        if (remote && remote._rev) {
          await this._fetchWithTimeout(
            `${this.couchUrl}/${this.tableName}/${record.id}?rev=${remote._rev}`,
            {method: "DELETE"}
          );
        }
      }
    } catch (e) {
      console.warn(`[DBSync:${this.tableName}] Error eliminando remoto (se ignorará):`, e.message);
    }
    
    if (this.onMarkSynced) {
      await this.onMarkSynced(record.id);
    }
    console.log(`[DBSync:${this.tableName}] ✓ Registro eliminado marcado como sincronizado`);
  }

  /**
   * Crea un nuevo documento en CouchDB
   */
  async _createRemoteDocument(record, docToSave) {
    console.log(`[DBSync:${this.tableName}] → Documento NO existe en remoto, CREANDO...`);
    const r = await this._fetchWithTimeout(
      `${this.couchUrl}/${this.tableName}/${record.id}`,
      { method: "PUT", body: JSON.stringify(docToSave)}
    );
    
    let createdBody = null;
    try { 
      const text = await r.text(); 
      if (text && text.trim().startsWith('{')) createdBody = JSON.parse(text); 
    } catch (e) { 
      console.warn(`[DBSync:${this.tableName}] Error parseando respuesta de creación:`, e.message);
      createdBody = null; 
    }
    
    if (r.ok) {
      try {
        const rev = (createdBody && (createdBody.rev || createdBody._rev)) || null;
        console.log(`[DBSync:${this.tableName}] ✓✓✓ DOCUMENTO CREADO EN REMOTO CON REV: ${rev} ✓✓✓`);
        this._tracePush('syncRecord:createdRemote', { id: record.id, rev, bodyPreview: this._preview(createdBody) });
        
        if (this.onMarkSynced) {
          await this.onMarkSynced(record.id, rev);
        }
        console.log(`[DBSync:${this.tableName}] ✓ Marcado como sincronizado en BD local`);
      } catch (e) {
        console.warn(`[DBSync:${this.tableName}] Error marcando como sincronizado:`, e.message);
        this._tracePush('syncRecord:createParseError', { error: this._preview(e) });
        if (this.onMarkSynced) {
          await this.onMarkSynced(record.id);
        }
      }
    } else {
      console.error(`[DBSync:${this.tableName}] ✗✗✗ ERROR CREANDO DOCUMENTO (${r.status}) ✗✗✗:`, createdBody);
      this._tracePush('syncRecord:createFailed', { status: r.status, bodyPreview: this._preview(createdBody) });
      throw new Error(`Failed to create document: HTTP ${r.status}`);
    }
  }

  /**
   * Resuelve conflictos entre local y remoto
   */
  async _resolveConflict(record, remote, docToSave) {
    console.log(`[DBSync:${this.tableName}] → Documento existe en remoto, comparando fechas...`);
    console.log(`[DBSync:${this.tableName}]    Local updatedAt: ${record.updatedAt}`);
    console.log(`[DBSync:${this.tableName}]    Remote updatedAt: ${remote.updatedAt || 'N/A'}`);
    console.log(`[DBSync:${this.tableName}]    Remote _rev: ${remote._rev || 'N/A'}`);
    
    if (!remote._rev || remote.updatedAt < record.updatedAt) {
      // Local más reciente → actualizar remoto
      console.log(`[DBSync:${this.tableName}] → Local MÁS RECIENTE, ACTUALIZANDO REMOTO...`);
      const r = await this._fetchWithTimeout(
        `${this.couchUrl}/${this.tableName}/${record.id}?rev=${remote._rev}`,
        {method: "PUT", body: JSON.stringify({ ...docToSave, _rev: remote._rev })}
      );
      
      if (r.ok) {
        try {
          const result = await r.json();
          const rev = result.rev || result._rev || null;
          console.log(`[DBSync:${this.tableName}] ✓✓✓ DOCUMENTO ACTUALIZADO EN REMOTO CON REV: ${rev} ✓✓✓`);
          this._tracePush('syncRecord:updatedRemote', { id: record.id, rev });
          
          if (this.onMarkSynced) {
            await this.onMarkSynced(record.id, rev);
          }
          console.log(`[DBSync:${this.tableName}] ✓ Marcado como sincronizado en BD local`);
        } catch (e) {
          console.warn(`[DBSync:${this.tableName}] Error parseando respuesta de actualización:`, e.message);
          this._tracePush('syncRecord:updateParseError', { error: this._preview(e) });
          if (this.onMarkSynced) {
            await this.onMarkSynced(record.id);
          }
        }
      } else {
        console.error(`[DBSync:${this.tableName}] ✗✗✗ ERROR ACTUALIZANDO DOCUMENTO (${r.status}) ✗✗✗`);
        const errorBody = await r.text();
        console.error(`[DBSync:${this.tableName}] Error body:`, errorBody);
        throw new Error(`HTTP ${r.status}: ${errorBody}`);
      }
    } else if (remote.updatedAt > record.updatedAt) {
      // Remoto más reciente → actualizar local
      console.log(`[DBSync:${this.tableName}] → Remoto MÁS RECIENTE, actualizando local...`);
      if (remote.data && remote.data.deleted === true) {
        this._tracePush('syncRecord:remoteDeleted', { id: remote._id });
        if (this.onDelete) {
          await this.onDelete(record.id);
        }
      } else {
        this._tracePush('syncRecord:remoteNewer', { id: remote._id, rev: remote._rev });
        if (this.onSaveLocal) {
          await this.onSaveLocal(remote.data, remote._id, remote._rev, remote.updatedAt);
        }
      }
    } else {
      console.log(`[DBSync:${this.tableName}] ✓ Fechas IGUALES, marcando como sincronizado`);
      if (this.onMarkSynced) {
        await this.onMarkSynced(record.id, remote._rev);
      }
    }
  }

  /**
   * Sincronización directa sin consulta previa (para cuando falla el GET)
   */
  async _syncRecordDirect(record) {
    const docToSave = {
      _id: record.id,
      data: record.data,
      updatedAt: record.updatedAt,
    };
    
    if (record._rev) {
      docToSave._rev = record._rev;
    }
    
    console.log(`[DBSync:${this.tableName}] → PUT directo a ${this.couchUrl}/${this.tableName}/${record.id}`);
    
    const shortTimeout = Math.min(this.fetchTimeout / 2, 15000);
    const res = await this._fetchWithTimeout(
      `${this.couchUrl}/${this.tableName}/${record.id}`,
      { method: "PUT", body: JSON.stringify(docToSave), timeout: shortTimeout }
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[DBSync:${this.tableName}] PUT directo falló (${res.status}):`, errorText);
      
      if (res.status === 409) {
        console.log(`[DBSync:${this.tableName}] Conflicto 409 - se necesita _rev actualizado`);
        throw new Error('Conflict - needs updated _rev (will retry in periodic sync)');
      }
      
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const result = await res.json();
    const rev = result.rev || result._rev || null;
    console.log(`[DBSync:${this.tableName}] ✓ PUT directo exitoso, rev: ${rev}`);
    
    if (this.onMarkSynced) {
      await this.onMarkSynced(record.id, rev);
    }
    this._tracePush('syncRecordDirect:success', { id: record.id, rev });
  }

  // ============================================================================
  // SINCRONIZACIÓN INMEDIATA
  // ============================================================================

  /**
   * Sincroniza un registro de forma inmediata
   * @param {Object} record - Registro a sincronizar
   * @returns {Promise<boolean>} - true si se sincronizó, false si falló por red
   */
  async syncRecordImmediate(record) {
    this._tracePush('syncRecordImmediate:start', { id: record && record.id });
    console.log(`[DBSync:${this.tableName}] 🔄 SINCRONIZACIÓN INMEDIATA INICIADA: ${record.id}`);
    
    // Marcar que este ID está en proceso de sincronización
    this.syncInProgress.add(record.id);
    
    try {
      await this.syncRecord(record);
      console.log(`[DBSync:${this.tableName}] ✓✓✓ SINCRONIZACIÓN INMEDIATA COMPLETADA: ${record.id} ✓✓✓`);
      this._tracePush('syncRecordImmediate:success', { id: record.id });
      
      return true;
    } catch (err) {
      const isNetworkError = err.name === 'AbortError' || 
                            err.name === 'TypeError' || 
                            err.message.includes('fetch') ||
                            err.message.includes('timeout') ||
                            err.message.includes('aborted');
      
      if (isNetworkError) {
        console.warn(`[DBSync:${this.tableName}] ⚠️ Error de red/timeout (se reintentará)`);
        console.warn(`[DBSync:${this.tableName}] ID: ${record.id}, Error: ${err.name} - ${err.message}`);
        this._tracePush('syncRecordImmediate:networkError', { id: record && record.id, error: err.name });
        return false;
      } else {
        console.error(`[DBSync:${this.tableName}] ✗✗✗ ERROR EN SINCRONIZACIÓN INMEDIATA ✗✗✗:`, err);
        console.error(`[DBSync:${this.tableName}] ID:`, record.id);
        console.error(`[DBSync:${this.tableName}] Stack:`, err.stack);
        this._tracePush('syncRecordImmediate:error', { id: record && record.id, error: this._preview(err) });
        throw err;
      }
    } finally {
      // Remover del Set de sincronización en progreso después de un breve delay
      // para evitar que listenChanges lo procese inmediatamente
      setTimeout(() => {
        this.syncInProgress.delete(record.id);
      }, 3000);
    }
  }

  // ============================================================================
  // SINCRONIZACIÓN PERIÓDICA
  // ============================================================================

  /**
   * Inicia la sincronización periódica
   * @param {Function} getRecordsToSync - Función que retorna array de registros a sincronizar
   */
  startPeriodicSync(getRecordsToSync) {
    console.log(`[DBSync:${this.tableName}] Iniciando sincronización periódica (intervalo: ${this.syncInterval}ms)`);
    
    if (this.syncIntervalId) {
      console.log(`[DBSync:${this.tableName}] Sync periódico ya está en ejecución`);
      return;
    }

    const doSync = async () => {
      if (this.syncing) {
        console.log(`[DBSync:${this.tableName}] Sync en progreso, saltando esta iteración`);
        return;
      }
      
      try {
        this.syncing = true;
        console.log(`[DBSync:${this.tableName}] ====== CICLO DE SINCRONIZACIÓN PERIÓDICA ======`);
        
        const records = await getRecordsToSync();
        console.log(`[DBSync:${this.tableName}] Registros pendientes: ${records.length}`);
        
        for (const r of records.filter((r) => r.synced === 0)) {
          try {
            // Marcar en progreso
            this.syncInProgress.add(r.id);
            await this.syncRecord(r);
          } catch (err) {
            console.warn(`[DBSync:${this.tableName}] Error sincronizando ${r.id} (se reintentará):`, err.message);
          } finally {
            // Remover después de 3 segundos
            setTimeout(() => {
              this.syncInProgress.delete(r.id);
            }, 3000);
          }
        }
        
        console.log(`[DBSync:${this.tableName}] ====== FIN CICLO DE SINCRONIZACIÓN ======`);
      } catch (err) {
        console.error(`[DBSync:${this.tableName}] Error en sincronización periódica:`, err);
      } finally {
        this.syncing = false;
      }
    };

    // Primera sincronización inmediata
    doSync();
    
    // Configurar sincronización periódica
    this.syncIntervalId = setInterval(doSync, this.syncInterval);
    console.log(`[DBSync:${this.tableName}] Sincronización periódica configurada`);
  }

  /**
   * Detiene la sincronización periódica
   */
  stopPeriodicSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log(`[DBSync:${this.tableName}] Sincronización periódica detenida`);
    }
  }

  // ============================================================================
  // LONGPOLL PARA CAMBIOS REMOTOS
  // ============================================================================

  /**
   * Escucha cambios remotos usando longpoll
   * @param {Function} onRemoteChange - Callback para manejar cambios remotos
   */
  async listenChanges(onRemoteChange) {
    const poll = async () => {
      try {
        const url = `${this.couchUrl}/${this.tableName}/_changes?feed=longpoll&since=now`;
        console.log(`[DBSync:${this.tableName}] Longpoll: ${url}`);
        
        const res = await this._fetchWithTimeout(url, { timeout: 60000 });
        const text = await res.text();
        console.log(`[DBSync:${this.tableName}] Respuesta longpoll recibida`);
        
        if (text.startsWith("{")) {
          const changes = JSON.parse(text);
          for (const c of changes.results) {
            // Skipear si el ID está actualmente sincronizándose
            if (this.syncInProgress.has(c.id)) {
              console.log(`[DBSync:${this.tableName}] ⏭️ Skipeando ${c.id} - sincronización en progreso`);
              continue;
            }
            
            const urlFetch = `${this.couchUrl}/${this.tableName}/${c.id}`;
            console.log(`[DBSync:${this.tableName}] Obteniendo documento remoto: ${urlFetch}`);
            
            const docRes = await fetch(urlFetch, {
              headers: {
                Authorization: this.authHeader,
                Accept: "application/json",
              },
            });

            const doc = await docRes.json();
            
            if (onRemoteChange) {
              await onRemoteChange(doc);
            }
          }
        } else {
          console.error(`[DBSync:${this.tableName}] Respuesta inesperada:`, text);
        }
      } catch (err) {
        console.warn(`[DBSync:${this.tableName}] Error en longpoll:`, err);
      } finally {
        setTimeout(poll, 5000);
      }
    };
    
    poll();
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  _updateAvgSyncTime(syncTime) {
    if (this.stats.successfulSyncs === 1) {
      this.stats.avgSyncTime = syncTime;
    } else {
      this.stats.avgSyncTime = (this.stats.avgSyncTime * (this.stats.successfulSyncs - 1) + syncTime) / this.stats.successfulSyncs;
    }
  }
}
