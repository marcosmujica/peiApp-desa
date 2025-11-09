# 🚀 Servicio peiApp Database - Instalación Completada

## ✅ Lo que se ha creado:

### Estructura del proyecto:
```
localServer/
├── server.js              # Servidor Express principal
├── package.json           # Dependencias y scripts
├── .env                   # Configuración (¡REVISAR!)
├── .gitignore            # Archivos ignorados por git
├── README.md             # Documentación completa
├── start.sh              # Script inicio Linux/Mac
├── start.bat             # Script inicio Windows
├── jest.config.js        # Configuración tests
├── middleware/           # Middlewares de seguridad
│   ├── auth.js          # Autenticación JWT
│   ├── errorHandler.js  # Manejo de errores
│   └── validation.js    # Validación de datos
├── routes/              # Rutas de la API
│   ├── auth.js         # Endpoints autenticación
│   └── database.js     # Endpoints base de datos
├── services/           # Servicios de negocio
│   ├── AuthService.js  # Servicio JWT
│   └── DatabaseService.js # Servicio CouchDB
├── utils/              # Utilidades
│   └── logger.js       # Sistema de logging
├── tests/              # Tests automatizados
│   ├── setup.js        # Configuración tests
│   └── api.test.js     # Tests de API
├── examples/           # Ejemplos de integración
│   └── DB_with_JWT_Integration.js
└── logs/               # Logs del sistema (se crea automáticamente)
```

## 🔧 Configuración Inicial:

### 1. Editar archivo .env:
```bash
# IMPORTANTE: Cambiar estas configuraciones para producción
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
COUCHDB_URL=http://tu-servidor-couchdb:5984
COUCHDB_USERNAME=tu-usuario-couchdb
COUCHDB_PASSWORD=tu-password-couchdb
```

### 2. Usuarios predefinidos:
- **admin** / **admin123** (roles: admin, user)
- **user1** / **user123** (roles: user)

## 🚀 Inicio rápido:

### Windows:
```bash
start.bat dev
```

### Linux/Mac:
```bash
chmod +x start.sh
./start.sh dev
```

### Manual:
```bash
npm run dev    # Desarrollo con reinicio automático
npm start      # Producción
```

## 🔗 URLs importantes:

- **Health Check**: http://localhost:3001/health
- **API Base**: http://localhost:3001/api
- **Autenticación**: http://localhost:3001/api/auth
- **Base de datos**: http://localhost:3001/api/db

## 🧪 Probar instalación:

### 1. Health check:
```bash
curl http://localhost:3001/health
```

### 2. Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. Crear base de datos:
```bash
curl -X PUT http://localhost:3001/api/db/test \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## 🔄 Integración con tu DB.js:

1. **Revisar**: `examples/DB_with_JWT_Integration.js`
2. **Modificar** tu clase DB.js para usar:
   - `serviceUrl: 'http://localhost:3001/api/db'`
   - `authUrl: 'http://localhost:3001/api/auth'`
   - Autenticación JWT en lugar de Basic Auth

## 📚 Documentación completa:

Ver `README.md` para documentación detallada de todos los endpoints y características.

## 🛡️ Características de seguridad implementadas:

✅ **Autenticación JWT** con renovación automática
✅ **Rate limiting** (100 req/15min por IP)
✅ **Validación de datos** con esquemas Joi
✅ **CORS** configurado para React Native
✅ **Logging completo** con Winston
✅ **Manejo de errores** estructurado
✅ **Encriptación de passwords** con bcrypt
✅ **Headers de seguridad** con Helmet

## 🎯 Próximos pasos:

1. **Configurar** variables de entorno para tu CouchDB
2. **Cambiar** el JWT_SECRET en producción
3. **Probar** los endpoints básicos
4. **Integrar** con tu clase DB.js existente
5. **Ejecutar tests**: `npm test`

## 💡 Tips:

- Los logs se guardan en `logs/`
- Los tokens JWT expiran en 24h (configurable)
- El refresh token expira en 7 días (configurable)
- Rate limiting es configurable en `.env`
- Todos los endpoints requieren autenticación excepto `/health` y `/api/auth/*`

¡El servicio está listo para usar! 🎉