const express = require('express');
const DatabaseService = require('../services/DatabaseService');
const { validate, dbSchemas, paramSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();
const dbService = new DatabaseService();

// ==================== HEALTH CHECK DE BASE DE DATOS ====================

/**
 * GET /api/db/health
 * Verifica la conexión con CouchDB
 */
router.get('/health', asyncHandler(async (req, res) => {
  const connectionStatus = await dbService.checkConnection();
  
  if (connectionStatus.connected) {
    res.json({
      status: 'OK',
      couchdb: connectionStatus,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'ERROR',
      error: connectionStatus.error,
      timestamp: new Date().toISOString()
    });
  }
}));

// ==================== GESTIÓN DE BASES DE DATOS ====================

/**
 * PUT /api/db/:dbName
 * Crea una base de datos
 */
router.put('/:dbName', 
  validate(paramSchemas.databaseName, 'params'),
  asyncHandler(async (req, res) => {
    const { dbName } = req.params;
    
    logger.info(`Usuario ${req.user.userId} creando base de datos: ${dbName}`);
    
    const result = await dbService.createDatabase(dbName);
    
    res.status(result.created ? 201 : 200).json({
      success: true,
      database: dbName,
      created: result.created,
      ...(result.exists && { message: 'La base de datos ya existe' })
    });
  })
);

/**
 * GET /api/db/:dbName/info
 * Obtiene información de una base de datos
 */
router.get('/:dbName/info',
  validate(paramSchemas.databaseName, 'params'),
  asyncHandler(async (req, res) => {
    const { dbName } = req.params;
    
    const info = await dbService.getDatabaseInfo(dbName);
    
    res.json({
      success: true,
      database: dbName,
      info
    });
  })
);

// ==================== OPERACIONES DE DOCUMENTOS ====================

/**
 * POST /api/db/:dbName/documents
 * Crea un nuevo documento
 */
router.post('/:dbName/documents',
  validate(paramSchemas.databaseName, 'params'),
  validate(dbSchemas.document, 'body'),
  asyncHandler(async (req, res) => {
    const { dbName } = req.params;
    const { data } = req.body;
    
    // Generar ID único
    const docId = dbService._generateId();
    
    logger.info(`Usuario ${req.user.userId} creando documento ${docId} en ${dbName}`);
    
    const result = await dbService.putDocument(dbName, docId, { data });
    
    res.status(201).json({
      success: true,
      id: result.id,
      rev: result.rev,
      database: dbName
    });
  })
);

/**
 * PUT /api/db/:dbName/documents/:id
 * Crea o actualiza un documento con ID específico
 */
router.put('/:dbName/documents/:id',
  validate(paramSchemas.databaseName, 'params'),
  validate(paramSchemas.documentId, 'params'),
  validate(dbSchemas.document, 'body'),
  asyncHandler(async (req, res) => {
    const { dbName, id } = req.params;
    const { data } = req.body;
    const rev = req.body._rev || req.headers['if-match'];
    
    logger.info(`Usuario ${req.user.userId} actualizando documento ${id} en ${dbName}`);
    
    const result = await dbService.putDocument(dbName, id, { data }, rev);
    
    res.json({
      success: true,
      id: result.id,
      rev: result.rev,
      database: dbName
    });
  })
);

/**
 * GET /api/db/:dbName/documents/:id
 * Obtiene un documento por ID
 */
router.get('/:dbName/documents/:id',
  validate(paramSchemas.databaseName, 'params'),
  validate(paramSchemas.documentId, 'params'),
  asyncHandler(async (req, res) => {
    const { dbName, id } = req.params;
    
    const document = await dbService.getDocument(dbName, id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento no encontrado',
        id,
        database: dbName
      });
    }
    
    res.json({
      success: true,
      document,
      database: dbName
    });
  })
);

/**
 * DELETE /api/db/:dbName/documents/:id
 * Elimina un documento
 */
router.delete('/:dbName/documents/:id',
  validate(paramSchemas.databaseName, 'params'),
  validate(paramSchemas.documentId, 'params'),
  asyncHandler(async (req, res) => {
    const { dbName, id } = req.params;
    const rev = req.body._rev || req.headers['if-match'];
    
    if (!rev) {
      return res.status(400).json({
        success: false,
        error: 'Revisión del documento requerida (_rev en body o If-Match header)'
      });
    }
    
    logger.info(`Usuario ${req.user.userId} eliminando documento ${id} en ${dbName}`);
    
    const result = await dbService.deleteDocument(dbName, id, rev);
    
    res.json({
      success: true,
      id: result.id,
      rev: result.rev,
      database: dbName,
      deleted: true
    });
  })
);

// ==================== CONSULTAS Y LISTADOS ====================

/**
 * GET /api/db/:dbName/documents
 * Obtiene todos los documentos de una base de datos
 */
router.get('/:dbName/documents',
  validate(paramSchemas.databaseName, 'params'),
  validate(dbSchemas.query, 'query'),
  asyncHandler(async (req, res) => {
    const { dbName } = req.params;
    const { limit, skip, sort } = req.query;
    
    const options = {
      limit: parseInt(limit) || 100,
      skip: parseInt(skip) || 0,
      ...(sort && { sort })
    };
    
    const result = await dbService.getAllDocuments(dbName, options);
    
    res.json({
      success: true,
      database: dbName,
      total_rows: result.total_rows,
      offset: result.offset,
      limit: options.limit,
      documents: result.documents
    });
  })
);

/**
 * POST /api/db/:dbName/find
 * Busca documentos usando selector Mango
 */
router.post('/:dbName/find',
  validate(paramSchemas.databaseName, 'params'),
  asyncHandler(async (req, res) => {
    const { dbName } = req.params;
    const { selector = {}, limit = 100, skip = 0, sort, fields } = req.body;
    
    const options = {
      limit: parseInt(limit),
      skip: parseInt(skip),
      ...(sort && { sort }),
      ...(fields && { fields })
    };
    
    const result = await dbService.findDocuments(dbName, selector, options);
    
    res.json({
      success: true,
      database: dbName,
      docs: result.docs,
      bookmark: result.bookmark,
      warning: result.warning
    });
  })
);

/**
 * POST /api/db/:dbName/bulk
 * Operaciones en lote
 */
router.post('/:dbName/bulk',
  validate(paramSchemas.databaseName, 'params'),
  validate(dbSchemas.bulkDocs, 'body'),
  asyncHandler(async (req, res) => {
    const { dbName } = req.params;
    const { documents } = req.body;
    
    logger.info(`Usuario ${req.user.userId} procesando ${documents.length} documentos en lote en ${dbName}`);
    
    const results = await dbService.bulkDocuments(dbName, documents);
    
    res.json({
      success: true,
      database: dbName,
      results
    });
  })
);

// ==================== SINCRONIZACIÓN ====================

/**
 * GET /api/db/:dbName/changes
 * Obtiene cambios desde un sequence number
 */
router.get('/:dbName/changes',
  validate(paramSchemas.databaseName, 'params'),
  asyncHandler(async (req, res) => {
    const { dbName } = req.params;
    const { since = 0, limit = 100, filter, selector } = req.query;
    
    const options = {
      limit: parseInt(limit),
      ...(filter && { filter }),
      ...(selector && { selector: JSON.parse(selector) })
    };
    
    const result = await dbService.getChanges(dbName, parseInt(since), options);
    
    res.json({
      success: true,
      database: dbName,
      results: result.results,
      last_seq: result.last_seq,
      pending: result.pending
    });
  })
);

// ==================== ESTADÍSTICAS Y MÉTRICAS ====================

/**
 * GET /api/db/:dbName/stats
 * Obtiene estadísticas de uso de una base de datos
 */
router.get('/:dbName/stats',
  validate(paramSchemas.databaseName, 'params'),
  asyncHandler(async (req, res) => {
    const { dbName } = req.params;
    
    const info = await dbService.getDatabaseInfo(dbName);
    
    res.json({
      success: true,
      database: dbName,
      stats: {
        doc_count: info.doc_count,
        doc_del_count: info.doc_del_count,
        update_seq: info.update_seq,
        purge_seq: info.purge_seq,
        compact_running: info.compact_running,
        disk_size: info.disk_size,
        data_size: info.data_size,
        instance_start_time: info.instance_start_time,
        disk_format_version: info.disk_format_version
      }
    });
  })
);

module.exports = router;