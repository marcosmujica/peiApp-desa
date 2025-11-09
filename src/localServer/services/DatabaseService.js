const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Servicio para interactuar con CouchDB remoto
 * Encapsula todas las operaciones de base de datos
 */
class DatabaseService {
  constructor() {
    this.baseUrl = process.env.COUCHDB_URL;
    this.username = process.env.COUCHDB_USERNAME;
    this.password = process.env.COUCHDB_PASSWORD;
    this.timeout = 10000; // 10 segundos

    // Crear instancia de axios con configuración base
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      auth: {
        username: this.username,
        password: this.password
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Interceptor para logging de requests
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`CouchDB Request: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: { ...config.headers, authorization: '[HIDDEN]' }
        });
        return config;
      },
      (error) => {
        logger.error('CouchDB Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para logging de responses
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`CouchDB Response: ${response.status} ${response.config.url}`, {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        logger.error('CouchDB Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(this._handleError(error));
      }
    );
  }

  /**
   * Verifica la conexión con CouchDB
   */
  async checkConnection() {
    try {
      const response = await this.client.get('/');
      return {
        connected: true,
        version: response.data.version,
        server: response.data.couchdb
      };
    } catch (error) {
      logger.error('Error verificando conexión CouchDB:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Crea una base de datos si no existe
   */
  async createDatabase(dbName) {
    try {
      await this.client.put(`/${dbName}`);
      logger.info(`Base de datos '${dbName}' creada exitosamente`);
      return { created: true };
    } catch (error) {
      if (error.response?.status === 412) {
        // La base de datos ya existe
        logger.debug(`Base de datos '${dbName}' ya existe`);
        return { created: false, exists: true };
      }
      throw error;
    }
  }

  /**
   * Obtiene información de una base de datos
   */
  async getDatabaseInfo(dbName) {
    try {
      const response = await this.client.get(`/${dbName}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Base de datos '${dbName}' no encontrada`);
      }
      throw error;
    }
  }

  /**
   * Crea o actualiza un documento
   */
  async putDocument(dbName, docId, document, rev = null) {
    try {
      // Estructura del documento compatible con tu clase DB.js
      const docToSave = {
        _id: docId,
        ...( rev && { _rev: rev }),
        data: document.data || document,
        _deleted: document._deleted || false,
        updatedAt: new Date().toISOString(),
        ...(document.createdAt && { createdAt: document.createdAt })
      };

      // Si no hay createdAt, lo agregamos
      if (!docToSave.createdAt) {
        docToSave.createdAt = docToSave.updatedAt;
      }

      const response = await this.client.put(`/${dbName}/${docId}`, docToSave);
      
      logger.debug(`Documento '${docId}' guardado en '${dbName}'`, {
        id: response.data.id,
        rev: response.data.rev
      });

      return {
        id: response.data.id,
        rev: response.data.rev,
        ok: response.data.ok
      };
    } catch (error) {
      if (error.response?.status === 409) {
        throw new Error(`Conflicto de revisión para documento '${docId}'`);
      }
      throw error;
    }
  }

  /**
   * Obtiene un documento por ID
   */
  async getDocument(dbName, docId) {
    try {
      const response = await this.client.get(`/${dbName}/${docId}`);
      const doc = response.data;

      // Retornar en formato compatible con tu clase DB.js
      return {
        _id: doc._id,
        _rev: doc._rev,
        _deleted: doc._deleted || false,
        data: doc.data || doc,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Elimina un documento
   */
  async deleteDocument(dbName, docId, rev) {
    try {
      const response = await this.client.delete(`/${dbName}/${docId}?rev=${rev}`);
      
      logger.debug(`Documento '${docId}' eliminado de '${dbName}'`, {
        id: response.data.id,
        rev: response.data.rev
      });

      return {
        id: response.data.id,
        rev: response.data.rev,
        ok: response.data.ok
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Documento '${docId}' no encontrado`);
      }
      if (error.response?.status === 409) {
        throw new Error(`Conflicto de revisión para documento '${docId}'`);
      }
      throw error;
    }
  }

  /**
   * Obtiene todos los documentos de una base de datos
   */
  async getAllDocuments(dbName, options = {}) {
    try {
      const params = {
        include_docs: true,
        limit: options.limit || 1000,
        skip: options.skip || 0,
        ...options.params
      };

      const response = await this.client.get(`/${dbName}/_all_docs`, { params });
      
      const documents = response.data.rows
        .filter(row => !row.doc._deleted) // Filtrar documentos eliminados
        .map(row => ({
          _id: row.doc._id,
          _rev: row.doc._rev,
          _deleted: row.doc._deleted || false,
          data: row.doc.data || row.doc,
          createdAt: row.doc.createdAt,
          updatedAt: row.doc.updatedAt
        }));

      return {
        total_rows: response.data.total_rows,
        offset: response.data.offset,
        documents
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Base de datos '${dbName}' no encontrada`);
      }
      throw error;
    }
  }

  /**
   * Busca documentos usando _find (Mango queries)
   */
  async findDocuments(dbName, selector = {}, options = {}) {
    try {
      const query = {
        selector: {
          _deleted: { "$ne": true }, // No incluir documentos eliminados
          ...selector
        },
        limit: options.limit || 100,
        skip: options.skip || 0,
        ...(options.sort && { sort: options.sort }),
        ...(options.fields && { fields: options.fields })
      };

      const response = await this.client.post(`/${dbName}/_find`, query);
      
      const documents = response.data.docs.map(doc => ({
        _id: doc._id,
        _rev: doc._rev,
        _deleted: doc._deleted || false,
        data: doc.data || doc,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }));

      return {
        docs: documents,
        bookmark: response.data.bookmark,
        warning: response.data.warning
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Base de datos '${dbName}' no encontrada`);
      }
      throw error;
    }
  }

  /**
   * Operaciones en lote (bulk)
   */
  async bulkDocuments(dbName, documents) {
    try {
      const docsToSave = documents.map(doc => ({
        _id: doc._id || this._generateId(),
        ...(doc._rev && { _rev: doc._rev }),
        data: doc.data || doc,
        _deleted: doc._deleted || false,
        updatedAt: new Date().toISOString(),
        ...(doc.createdAt && { createdAt: doc.createdAt })
      }));

      // Agregar createdAt si no existe
      docsToSave.forEach(doc => {
        if (!doc.createdAt) {
          doc.createdAt = doc.updatedAt;
        }
      });

      const response = await this.client.post(`/${dbName}/_bulk_docs`, {
        docs: docsToSave
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Base de datos '${dbName}' no encontrada`);
      }
      throw error;
    }
  }

  /**
   * Obtiene cambios desde un sequence number
   */
  async getChanges(dbName, since = 0, options = {}) {
    try {
      const params = {
        since,
        include_docs: true,
        limit: options.limit || 100,
        ...(options.filter && { filter: options.filter }),
        ...(options.selector && { 
          filter: '_selector',
          selector: JSON.stringify(options.selector)
        })
      };

      const response = await this.client.get(`/${dbName}/_changes`, { params });
      
      return {
        results: response.data.results.map(change => ({
          seq: change.seq,
          id: change.id,
          changes: change.changes,
          deleted: change.deleted,
          doc: change.doc ? {
            _id: change.doc._id,
            _rev: change.doc._rev,
            _deleted: change.doc._deleted || false,
            data: change.doc.data || change.doc,
            createdAt: change.doc.createdAt,
            updatedAt: change.doc.updatedAt
          } : null
        })),
        last_seq: response.data.last_seq,
        pending: response.data.pending
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Base de datos '${dbName}' no encontrada`);
      }
      throw error;
    }
  }

  /**
   * Genera un ID único compatible con CouchDB
   */
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Manejo de errores específicos de CouchDB
   */
  _handleError(error) {
    const status = error.response?.status;
    const data = error.response?.data;

    switch (status) {
      case 400:
        return new Error(data?.reason || 'Petición inválida');
      case 401:
        return new Error('Credenciales inválidas para CouchDB');
      case 403:
        return new Error('Acceso denegado a CouchDB');
      case 404:
        return new Error(data?.reason || 'Recurso no encontrado en CouchDB');
      case 409:
        return new Error(data?.reason || 'Conflicto de documento');
      case 412:
        return new Error('La base de datos ya existe');
      case 500:
        return new Error('Error interno del servidor CouchDB');
      case 503:
        return new Error('Servicio CouchDB no disponible');
      default:
        return new Error(error.message || 'Error desconocido en CouchDB');
    }
  }
}

module.exports = DatabaseService;