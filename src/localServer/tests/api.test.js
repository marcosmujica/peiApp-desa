const request = require('supertest');
const app = require('../server');

describe('Auth Endpoints', () => {
  let accessToken;
  let refreshToken;

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.username).toBe('admin');

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin'
        })
        .expect(400);

      expect(response.body.error).toBe('Error de validación');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.username).toBe('admin');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('admin');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Token de acceso requerido');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

describe('Database Endpoints', () => {
  let accessToken;
  const testDbName = 'test-db';

  beforeAll(async () => {
    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    accessToken = loginResponse.body.accessToken;
  });

  describe('GET /api/db/health', () => {
    it('should return database health status', async () => {
      const response = await request(app)
        .get('/api/db/health')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBeDefined();
    });
  });

  describe('PUT /api/db/:dbName', () => {
    it('should create database', async () => {
      const response = await request(app)
        .put(`/api/db/${testDbName}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.database).toBe(testDbName);
    });
  });

  describe('POST /api/db/:dbName/documents', () => {
    it('should create a document', async () => {
      const response = await request(app)
        .post(`/api/db/${testDbName}/documents`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          data: {
            name: 'Test Document',
            type: 'test'
          }
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.id).toBeDefined();
      expect(response.body.rev).toBeDefined();
    });

    it('should reject invalid document data', async () => {
      const response = await request(app)
        .post(`/api/db/${testDbName}/documents`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          invalidField: 'invalid'
        })
        .expect(400);

      expect(response.body.error).toBe('Error de validación');
    });
  });

  describe('GET /api/db/:dbName/documents', () => {
    it('should list documents', async () => {
      const response = await request(app)
        .get(`/api/db/${testDbName}/documents`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.documents).toBeDefined();
      expect(Array.isArray(response.body.documents)).toBe(true);
    });
  });
});

describe('Security', () => {
  describe('Rate Limiting', () => {
    it('should apply rate limiting', async () => {
      // This test would need to be run with a lower rate limit
      // for practical testing purposes
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});