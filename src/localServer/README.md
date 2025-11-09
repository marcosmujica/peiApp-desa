# PeiApp Database Service

Servicio local en puerto 3001 que actúa como capa de conexión entre la aplicación peiApp y CouchDB remoto, con autenticación JWT para mayor seguridad.

## 🚀 Características

- **Autenticación JWT**: Tokens periódicos con renovación automática
- **Encapsulación de CouchDB**: Capa segura entre la app y la base de datos remota
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Validación de datos**: Esquemas Joi para validar entradas
- **Logging completo**: Winston para trazabilidad de operaciones
- **CORS configurado**: Compatible con React Native
- **Manejo de errores**: Respuestas estructuradas y logging detallado

## 📦 Instalación

```bash
cd src/localServer
npm install
```

## ⚙️ Configuración

Copia el archivo `.env` y configura las variables:

```bash
# Configuración del servidor local
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CouchDB Configuration
COUCHDB_URL=http://localhost:5984
COUCHDB_USERNAME=admin
COUCHDB_PASSWORD=password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## 🏃‍♂️ Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Verificar estado
```bash
curl http://localhost:3001/health
```

## 🔐 Autenticación

### 1. Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "user": {
    "id": "admin",
    "username": "admin",
    "roles": ["admin", "user"]
  }
}
```

### 2. Renovar Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Usar Token en Requests
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 API Endpoints

### Base de Datos

#### Crear/verificar base de datos
```bash
PUT /api/db/{dbName}
Authorization: Bearer {token}
```

#### Obtener información de BD
```bash
GET /api/db/{dbName}/info
Authorization: Bearer {token}
```

#### Verificar conexión CouchDB
```bash
GET /api/db/health
Authorization: Bearer {token}
```

### Documentos

#### Crear documento
```bash
POST /api/db/{dbName}/documents
Authorization: Bearer {token}
Content-Type: application/json

{
  "data": {
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

#### Actualizar documento
```bash
PUT /api/db/{dbName}/documents/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "data": {
    "name": "Juan Pérez Actualizado",
    "email": "juan.nuevo@example.com"
  },
  "_rev": "1-abc123"
}
```

#### Obtener documento
```bash
GET /api/db/{dbName}/documents/{id}
Authorization: Bearer {token}
```

#### Eliminar documento
```bash
DELETE /api/db/{dbName}/documents/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "_rev": "2-def456"
}
```

#### Listar documentos
```bash
GET /api/db/{dbName}/documents?limit=100&skip=0
Authorization: Bearer {token}
```

#### Buscar documentos
```bash
POST /api/db/{dbName}/find
Authorization: Bearer {token}
Content-Type: application/json

{
  "selector": {
    "data.email": {
      "$regex": ".*@example.com"
    }
  },
  "limit": 50
}
```

#### Operaciones en lote
```bash
POST /api/db/{dbName}/bulk
Authorization: Bearer {token}
Content-Type: application/json

{
  "documents": [
    {
      "data": { "name": "Doc 1" }
    },
    {
      "data": { "name": "Doc 2" }
    }
  ]
}
```

#### Obtener cambios (sincronización)
```bash
GET /api/db/{dbName}/changes?since=0&limit=100
Authorization: Bearer {token}
```

## 🔧 Integración con tu DB.js

Para usar este servicio con tu clase `DB.js`, modifica el constructor para apuntar al servicio local:

```javascript
// En lugar de conectar directamente a CouchDB:
// this.couchUrl = 'http://remote-couchdb:5984';

// Usa el servicio local:
this.serviceUrl = 'http://localhost:3001/api/db';
this.authUrl = 'http://localhost:3001/api/auth';

// Almacena el token JWT
this.accessToken = null;
this.refreshToken = null;
```

### Ejemplo de autenticación:
```javascript
async authenticate() {
  const response = await fetch(`${this.authUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  
  const auth = await response.json();
  this.accessToken = auth.accessToken;
  this.refreshToken = auth.refreshToken;
}

async _getAuthHeaders() {
  return {
    'Authorization': `Bearer ${this.accessToken}`,
    'Content-Type': 'application/json'
  };
}
```

## 🛡️ Seguridad

### Tokens JWT
- **Access Token**: Expira en 24h (configurable)
- **Refresh Token**: Expira en 7d (configurable)
- **Auto-renovación**: El refresh token permite obtener nuevos access tokens
- **Revocación**: Los tokens se pueden revocar en logout

### Rate Limiting
- 100 requests por 15 minutos por IP
- Configurable via variables de entorno

### Validación de Datos
- Esquemas Joi para validar todas las entradas
- Sanitización automática de datos

### Usuarios Predefinidos
```
admin / admin123 (roles: admin, user)
user1 / user123 (roles: user)
```

## 📝 Logging

Los logs se guardan en:
- `logs/error.log`: Solo errores
- `logs/combined.log`: Todos los logs
- Consola: En modo desarrollo

Niveles de log: error, warn, info, debug

## 🧪 Testing

```bash
# Instalar dependencias de testing
npm install --save-dev jest supertest

# Ejecutar tests
npm test
```

## 📈 Monitoreo

### Health Check
```bash
GET /health
```

### Estadísticas de autenticación (solo admin)
```bash
GET /api/auth/stats
Authorization: Bearer {admin-token}
```

### Estadísticas de base de datos
```bash
GET /api/db/{dbName}/stats
Authorization: Bearer {token}
```

## 🔄 Sincronización

El servicio es compatible con el sistema de sincronización de tu clase `DB.js`:

1. **Obtener cambios**: `GET /api/db/{dbName}/changes?since={seq}`
2. **Sincronizar documentos**: Usar endpoints PUT/POST/DELETE
3. **Resolución de conflictos**: Basada en `updatedAt` (más reciente gana)

## 🚨 Manejo de Errores

Todas las respuestas siguen el formato:

```json
{
  "success": true/false,
  "data": "...",          // En caso de éxito
  "error": "...",         // En caso de error
  "code": "ERROR_CODE",   // Código específico de error
  "timestamp": "2023-..."
}
```

## 🔧 Troubleshooting

### Error de conexión a CouchDB
1. Verificar que CouchDB esté ejecutándose
2. Revisar configuración en `.env`
3. Comprobar credenciales

### Token expirado
1. Usar refresh token para renovar
2. Si refresh token expirado, hacer login nuevamente

### Rate limiting
1. Esperar 15 minutos
2. Aumentar límites en `.env` si es necesario

## 📄 Licencia

MIT