const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

/**
 * Servicio para manejo de autenticación JWT
 */
class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    
    // Almacenamiento en memoria para refresh tokens (en producción usar Redis/DB)
    this.refreshTokens = new Map();
    
    // Usuarios permitidos (en producción esto vendría de una base de datos)
    this.users = new Map([
      ['admin', {
        id: 'admin',
        username: 'admin',
        passwordHash: bcrypt.hashSync('admin123', this.bcryptRounds),
        roles: ['admin', 'user'],
        active: true
      }],
      ['user1', {
        id: 'user1',
        username: 'user1',
        passwordHash: bcrypt.hashSync('user123', this.bcryptRounds),
        roles: ['user'],
        active: true
      }]
    ]);

    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET no está configurado en variables de entorno');
    }
  }

  /**
   * Autentica un usuario y genera tokens
   */
  async authenticate(username, password) {
    try {
      const user = this.users.get(username);
      
      if (!user || !user.active) {
        logger.warn(`Intento de login fallido: usuario ${username} no encontrado o inactivo`);
        throw new Error('Credenciales inválidas');
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        logger.warn(`Intento de login fallido: contraseña incorrecta para ${username}`);
        throw new Error('Credenciales inválidas');
      }

      // Generar tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);
      
      // Almacenar refresh token
      this.refreshTokens.set(refreshToken, {
        userId: user.id,
        username: user.username,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this._parseTimeToMs(this.refreshExpiresIn))
      });

      logger.info(`Usuario ${username} autenticado exitosamente`);

      return {
        accessToken,
        refreshToken,
        expiresIn: this.jwtExpiresIn,
        user: {
          id: user.id,
          username: user.username,
          roles: user.roles
        }
      };
    } catch (error) {
      logger.error('Error en autenticación:', error);
      throw error;
    }
  }

  /**
   * Genera un nuevo access token usando un refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const tokenData = this.refreshTokens.get(refreshToken);
      
      if (!tokenData) {
        throw new Error('Refresh token inválido');
      }

      if (new Date() > tokenData.expiresAt) {
        this.refreshTokens.delete(refreshToken);
        throw new Error('Refresh token expirado');
      }

      const user = this.users.get(tokenData.username);
      
      if (!user || !user.active) {
        this.refreshTokens.delete(refreshToken);
        throw new Error('Usuario no válido');
      }

      // Generar nuevo access token
      const accessToken = this.generateAccessToken(user);
      
      logger.info(`Access token renovado para usuario ${user.username}`);

      return {
        accessToken,
        expiresIn: this.jwtExpiresIn,
        user: {
          id: user.id,
          username: user.username,
          roles: user.roles
        }
      };
    } catch (error) {
      logger.error('Error renovando access token:', error);
      throw error;
    }
  }

  /**
   * Revoca un refresh token (logout)
   */
  async revokeRefreshToken(refreshToken) {
    try {
      const tokenData = this.refreshTokens.get(refreshToken);
      
      if (tokenData) {
        this.refreshTokens.delete(refreshToken);
        logger.info(`Refresh token revocado para usuario ${tokenData.username}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error revocando refresh token:', error);
      throw error;
    }
  }

  /**
   * Verifica si un access token es válido
   */
  async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      const user = this.users.get(decoded.username);
      
      if (!user || !user.active) {
        throw new Error('Usuario no válido');
      }

      return {
        userId: decoded.userId,
        username: decoded.username,
        roles: decoded.roles,
        iat: decoded.iat,
        exp: decoded.exp
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      }
      throw error;
    }
  }

  /**
   * Genera un access token JWT
   */
  generateAccessToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      roles: user.roles
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'peiApp-db-service',
      audience: 'peiApp-client'
    });
  }

  /**
   * Genera un refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      tokenType: 'refresh'
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.refreshExpiresIn,
      issuer: 'peiApp-db-service',
      audience: 'peiApp-client'
    });
  }

  /**
   * Limpia refresh tokens expirados
   */
  cleanExpiredTokens() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [token, data] of this.refreshTokens.entries()) {
      if (now > data.expiresAt) {
        this.refreshTokens.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Limpiados ${cleanedCount} refresh tokens expirados`);
    }

    return cleanedCount;
  }

  /**
   * Obtiene estadísticas de tokens activos
   */
  getTokenStats() {
    const now = new Date();
    let activeTokens = 0;
    let expiredTokens = 0;

    for (const [token, data] of this.refreshTokens.entries()) {
      if (now > data.expiresAt) {
        expiredTokens++;
      } else {
        activeTokens++;
      }
    }

    return {
      totalTokens: this.refreshTokens.size,
      activeTokens,
      expiredTokens
    };
  }

  /**
   * Agrega un nuevo usuario (para testing o administración)
   */
  async addUser(username, password, roles = ['user']) {
    try {
      if (this.users.has(username)) {
        throw new Error('El usuario ya existe');
      }

      const passwordHash = await bcrypt.hash(password, this.bcryptRounds);
      
      const newUser = {
        id: username,
        username,
        passwordHash,
        roles,
        active: true,
        createdAt: new Date()
      };

      this.users.set(username, newUser);
      
      logger.info(`Usuario ${username} creado con roles: ${roles.join(', ')}`);
      
      return {
        id: newUser.id,
        username: newUser.username,
        roles: newUser.roles,
        active: newUser.active
      };
    } catch (error) {
      logger.error(`Error creando usuario ${username}:`, error);
      throw error;
    }
  }

  /**
   * Desactiva un usuario
   */
  async deactivateUser(username) {
    try {
      const user = this.users.get(username);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      user.active = false;
      
      // Revocar todos los refresh tokens del usuario
      let revokedCount = 0;
      for (const [token, data] of this.refreshTokens.entries()) {
        if (data.username === username) {
          this.refreshTokens.delete(token);
          revokedCount++;
        }
      }

      logger.info(`Usuario ${username} desactivado, ${revokedCount} tokens revocados`);
      
      return true;
    } catch (error) {
      logger.error(`Error desactivando usuario ${username}:`, error);
      throw error;
    }
  }

  /**
   * Convierte tiempo string a milisegundos
   */
  _parseTimeToMs(timeString) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };

    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Formato de tiempo inválido: ${timeString}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    return value * units[unit];
  }
}

module.exports = AuthService;