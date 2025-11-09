const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware para autenticar tokens JWT
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acceso requerido',
        code: 'NO_TOKEN'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        logger.warn(`Token inválido: ${err.message}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Token expirado',
            code: 'TOKEN_EXPIRED',
            expiredAt: err.expiredAt
          });
        }

        return res.status(403).json({
          error: 'Token inválido',
          code: 'INVALID_TOKEN'
        });
      }

      req.user = user;
      logger.debug(`Usuario autenticado: ${user.userId}`, {
        ip: req.ip,
        path: req.path
      });

      next();
    });
  } catch (error) {
    logger.error('Error en middleware de autenticación:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware opcional para autenticación (no falla si no hay token)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

/**
 * Middleware para verificar roles específicos
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticación requerida'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      logger.warn(`Acceso denegado: roles insuficientes`, {
        userId: req.user.userId,
        userRoles,
        requiredRoles: roles,
        path: req.path
      });

      return res.status(403).json({
        error: 'Permisos insuficientes',
        requiredRoles: roles
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole
};