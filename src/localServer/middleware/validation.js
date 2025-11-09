const Joi = require('joi');

/**
 * Middleware para validar datos usando esquemas Joi
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Error de validación',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))
      });
    }

    // Reemplazar los datos originales con los datos validados y limpiados
    req[property] = value;
    next();
  };
};

// ==================== ESQUEMAS COMUNES ====================

const authSchemas = {
  login: Joi.object({
    username: Joi.string().min(3).max(50).required()
      .messages({
        'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
        'string.max': 'El nombre de usuario no puede exceder 50 caracteres',
        'any.required': 'El nombre de usuario es requerido'
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'La contraseña debe tener al menos 6 caracteres',
        'any.required': 'La contraseña es requerida'
      })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
      .messages({
        'any.required': 'El token de renovación es requerido'
      })
  })
};

const dbSchemas = {
  document: Joi.object({
    data: Joi.object().required()
      .messages({
        'any.required': 'Los datos del documento son requeridos'
      })
  }),

  query: Joi.object({
    filter: Joi.object().optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100),
    skip: Joi.number().integer().min(0).default(0),
    sort: Joi.object().optional()
  }),

  bulkDocs: Joi.object({
    documents: Joi.array().items(
      Joi.object({
        _id: Joi.string().optional(),
        data: Joi.object().required()
      })
    ).min(1).max(100).required()
      .messages({
        'array.min': 'Debe incluir al menos un documento',
        'array.max': 'No se pueden procesar más de 100 documentos a la vez'
      })
  })
};

const paramSchemas = {
  documentId: Joi.object({
    id: Joi.string().required()
      .messages({
        'any.required': 'ID del documento es requerido'
      })
  }),

  databaseName: Joi.object({
    dbName: Joi.string().pattern(/^[a-z][a-z0-9_-]*$/).required()
      .messages({
        'string.pattern.base': 'El nombre de la base de datos debe comenzar con una letra minúscula y contener solo letras, números, guiones y guiones bajos',
        'any.required': 'Nombre de la base de datos es requerido'
      })
  })
};

module.exports = {
  validate,
  authSchemas,
  dbSchemas,
  paramSchemas
};