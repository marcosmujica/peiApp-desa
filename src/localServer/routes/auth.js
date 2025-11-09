const express = require('express');
const AuthService = require('../services/AuthService');
const { validate, authSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const authService = new AuthService();

// Limpiar tokens expirados cada hora
setInterval(() => {
  authService.cleanExpiredTokens();
}, 60 * 60 * 1000);

// ==================== AUTENTICACIÓN ====================

/**
 * POST /api/auth/login
 * Autentica un usuario y devuelve tokens JWT
 */
router.post('/login',
  validate(authSchemas.login),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    logger.info(`Intento de login para usuario: ${username}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const authResult = await authService.authenticate(username, password);
    
    // Log exitoso sin mostrar tokens
    logger.info(`Login exitoso para usuario: ${username}`, {
      ip: req.ip,
      userId: authResult.user.id,
      roles: authResult.user.roles
    });

    res.json({
      success: true,
      message: 'Autenticación exitosa',
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      expiresIn: authResult.expiresIn,
      user: authResult.user,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/auth/refresh
 * Renueva un access token usando un refresh token
 */
router.post('/refresh',
  validate(authSchemas.refreshToken),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const authResult = await authService.refreshAccessToken(refreshToken);
    
    logger.info(`Token renovado para usuario: ${authResult.user.username}`, {
      ip: req.ip,
      userId: authResult.user.id
    });

    res.json({
      success: true,
      message: 'Token renovado exitosamente',
      accessToken: authResult.accessToken,
      expiresIn: authResult.expiresIn,
      user: authResult.user,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/auth/logout
 * Revoca un refresh token (logout)
 */
router.post('/logout',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token requerido'
      });
    }

    const revoked = await authService.revokeRefreshToken(refreshToken);
    
    if (revoked) {
      logger.info(`Logout exitoso`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    res.json({
      success: true,
      message: 'Logout exitoso',
      revoked,
      timestamp: new Date().toISOString()
    });
  })
);

// ==================== INFORMACIÓN Y VERIFICACIÓN ====================

/**
 * GET /api/auth/me
 * Obtiene información del usuario autenticado
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      user: req.user,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/auth/verify
 * Verifica si un token es válido
 */
router.post('/verify',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token requerido'
      });
    }

    try {
      const user = await authService.verifyAccessToken(token);
      
      res.json({
        success: true,
        valid: true,
        user,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        valid: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  })
);

// ==================== ADMINISTRACIÓN (solo para admin) ====================

/**
 * GET /api/auth/stats
 * Obtiene estadísticas de tokens activos (solo admin)
 */
router.get('/stats',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: se requieren permisos de administrador'
      });
    }

    const stats = authService.getTokenStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/auth/cleanup
 * Limpia tokens expirados manualmente (solo admin)
 */
router.post('/cleanup',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: se requieren permisos de administrador'
      });
    }

    const cleanedCount = authService.cleanExpiredTokens();
    
    logger.info(`Limpieza manual de tokens ejecutada por ${req.user.username}, tokens eliminados: ${cleanedCount}`);

    res.json({
      success: true,
      message: 'Limpieza de tokens completada',
      cleanedCount,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/auth/users
 * Crea un nuevo usuario (solo admin)
 */
router.post('/users',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: se requieren permisos de administrador'
      });
    }

    const { username, password, roles = ['user'] } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username y password son requeridos'
      });
    }

    const newUser = await authService.addUser(username, password, roles);
    
    logger.info(`Usuario ${username} creado por administrador ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: newUser,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * DELETE /api/auth/users/:username
 * Desactiva un usuario (solo admin)
 */
router.delete('/users/:username',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: se requieren permisos de administrador'
      });
    }

    const { username } = req.params;

    if (username === req.user.username) {
      return res.status(400).json({
        success: false,
        error: 'No puedes desactivar tu propia cuenta'
      });
    }

    await authService.deactivateUser(username);
    
    logger.info(`Usuario ${username} desactivado por administrador ${req.user.username}`);

    res.json({
      success: true,
      message: `Usuario ${username} desactivado exitosamente`,
      timestamp: new Date().toISOString()
    });
  })
);

// ==================== UTILIDADES ====================

/**
 * GET /api/auth/time
 * Obtiene la hora del servidor (útil para sincronización)
 */
router.get('/time', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    unix: Math.floor(Date.now() / 1000)
  });
});

module.exports = router;