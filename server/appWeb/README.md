# Gestor de Tickets - Aplicación React

Una aplicación web React responsive para gestionar tickets conectada a CouchDB, diseñada para funcionar tanto en navegadores de escritorio como en dispositivos móviles Android e iOS.

## 🚀 Características Principales

- **Conexión personalizable a CouchDB**: Configura URL, usuario y contraseña
- **Lista de tickets**: Busca tickets por ID único de búsqueda
- **Gestión de estados**: Registrar pagos, cambiar fechas de vencimiento, cancelar y declinar tickets
- **Subida de archivos**: Adjunta comprobantes de pago como imágenes o documentos
- **Sistema de notas**: Registra comentarios en todos los cambios
- **Diseño responsive**: Optimizado para móviles y tablets
- **Almacenamiento persistente**: Toda la información se guarda en CouchDB

## 📱 Funcionalidades

### Gestión de Tickets
1. **Buscar tickets** por ID único de búsqueda
2. **Ver detalles** completos del ticket seleccionado
3. **Actualizar estado** del ticket con las siguientes opciones:
   - 💰 **Registrar Pago**: Monto, método de pago y comprobante
   - 📅 **Cambiar Vencimiento**: Nueva fecha con nota explicativa
   - ❌ **Cancelar Ticket**: Con nota del motivo
   - ⛔ **Declinar Ticket**: Con nota del motivo

### Sistema de Archivos
- Subida de comprobantes de pago
- Formatos soportados: JPG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT
- Tamaño máximo: 10MB por archivo
- Descarga de archivos adjuntos

### Interfaz Responsive
- Diseño adaptativo para todas las pantallas
- Optimizado para touch en dispositivos móviles
- Interfaz intuitiva y fácil de usar

## 🛠️ Instalación

### Requisitos Previos
- Node.js (versión 14 o superior)
- CouchDB instalado y ejecutándose
- npm o yarn

### Pasos de Instalación

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar CouchDB**:
   - Asegúrate de que CouchDB esté ejecutándose (por defecto en http://localhost:5984)
   - Crea un usuario administrador si no tienes uno
   - La aplicación creará automáticamente la base de datos necesaria

3. **Iniciar la aplicación**:
   ```bash
   npm start
   ```

4. **Abrir en el navegador**:
   - La aplicación se abrirá automáticamente en http://localhost:3000
   - También funciona en dispositivos móviles accediendo a la IP de tu máquina

## ⚙️ Configuración

### Primera Configuración
1. Al abrir la aplicación por primera vez, verás el formulario de configuración
2. Ingresa los datos de tu servidor CouchDB:
   - **URL**: http://localhost:5984 (o tu servidor)
   - **Usuario**: tu usuario administrador
   - **Contraseña**: tu contraseña
   - **Base de datos**: tickets (o el nombre que prefieras)

3. Haz clic en "Probar Conexión" para verificar
4. Si la conexión es exitosa, guarda la configuración

### Reconfiguración
- Puedes cambiar la configuración en cualquier momento desde el menú "Configuración"
- O resetear completamente desde "Resetear Config" en el header

## 📊 Estructura de Datos

### Ticket
```javascript
{
  _id: "ticket_searchId_timestamp",
  type: "ticket",
  id: "TICKET-001",
  title: "Título del ticket",
  description: "Descripción detallada",
  status: "pending|paid|cancelled|declined",
  amount: 1500.00,
  dueDate: "2024-12-31",
  searchId: "USER123",
  createdDate: "2024-01-01T00:00:00.000Z",
  updatedDate: "2024-01-01T00:00:00.000Z",
  notes: [...],
  payments: [...],
  attachments: [...]
}
```

### Estados Disponibles
- **pending**: Pendiente (estado inicial)
- **paid**: Pagado
- **cancelled**: Cancelado
- **declined**: Rechazado

## 🔧 Comandos Disponibles

```bash
# Iniciar en modo desarrollo
npm start

# Construir para producción
npm run build

# Ejecutar tests
npm test

# Analizar el bundle
npm run analyze
```

## 📱 Uso en Dispositivos Móviles

### Android/iOS
1. Conecta tu dispositivo a la misma red WiFi que tu computadora
2. Obtén la IP de tu computadora (ej: 192.168.1.100)
3. En el dispositivo móvil, abre el navegador y ve a: http://192.168.1.100:3000
4. La aplicación funcionará como una app nativa

### PWA (Progressive Web App)
- La aplicación se puede "instalar" en dispositivos móviles
- Agrega un ícono en la pantalla de inicio
- Funciona offline para las funciones básicas

## 🗂️ Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── Header.js       # Header con navegación
│   ├── ConfigForm.js   # Formulario de configuración
│   ├── TicketList.js   # Lista de tickets
│   ├── TicketDetail.js # Detalle del ticket
│   ├── StatusUpdateModal.js # Modal para cambiar estado
│   └── FileUpload.js   # Componente de subida de archivos
├── services/           # Servicios
│   └── couchDBService.js # Servicio para CouchDB
├── App.js             # Componente principal
├── index.js           # Punto de entrada
└── index.css          # Estilos globales
```

## 🔐 Seguridad

- Las credenciales se almacenan localmente en el navegador
- La comunicación con CouchDB puede configurarse con HTTPS
- Los archivos se almacenan como base64 en la base de datos
- Validación de tipos y tamaños de archivo

## 🐛 Solución de Problemas

### Error de Conexión
- Verifica que CouchDB esté ejecutándose
- Comprueba las credenciales
- Revisa la configuración de CORS en CouchDB

### Problemas de Responsive
- Actualiza el navegador
- Verifica el viewport en dispositivos móviles
- Limpia la caché del navegador

### Archivos no se suben
- Verifica el tamaño del archivo (máx 10MB)
- Comprueba el formato del archivo
- Revisa la conexión a la base de datos

## 📄 Licencia

Este proyecto está desarrollado para uso interno. Todos los derechos reservados.

## 🤝 Soporte

Para reportar problemas o solicitar nuevas funcionalidades, contacta al equipo de desarrollo.