# Gestor de Tickets - Instrucciones para Copilot

## Descripción del Proyecto
Aplicación React en JavaScript para gestión de tickets conectada a CouchDB. Permite buscar tickets por ID único, ver detalles, cambiar estados (pago, cancelación, rechazo), cambiar fechas de vencimiento, agregar notas y subir archivos adjuntos.

## Estructura del Proyecto
- **React 18** con JavaScript (no TypeScript)
- **CouchDB** como base de datos
- **React Router** para navegación
- **Axios** para requests HTTP
- **Diseño responsive** para móviles y escritorio

## Componentes Principales
- `App.js`: Componente principal con routing
- `Header.js`: Navegación y header
- `ConfigForm.js`: Configuración de CouchDB
- `TicketList.js`: Lista de tickets con búsqueda
- `TicketDetail.js`: Detalle y gestión del ticket
- `StatusUpdateModal.js`: Modal para cambiar estados
- `FileUpload.js`: Subida de archivos
- `couchDBService.js`: Servicio para CouchDB

## Funcionalidades Implementadas
✅ Configuración personalizable de CouchDB  
✅ Búsqueda de tickets por ID único  
✅ Lista de tickets con información básica  
✅ Vista detallada del ticket  
✅ Registrar pagos con método y monto  
✅ Cambiar fecha de vencimiento  
✅ Cancelar y declinar tickets  
✅ Sistema de notas para todos los cambios  
✅ Subida de archivos (imágenes, PDFs, documentos)  
✅ Descarga de archivos adjuntos  
✅ Diseño responsive para móviles  
✅ Almacenamiento local de configuración  

## Estados de Tickets
- `pending`: Pendiente (inicial)
- `paid`: Pagado
- `cancelled`: Cancelado
- `declined`: Rechazado

## Tipos de Archivos Soportados
JPG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT (máx 10MB)

## Base de Datos CouchDB
- Documentos tipo "ticket" con estructura completa
- IDs únicos: `ticket_searchId_timestamp`
- Archivos almacenados como base64
- Historial completo de cambios en arrays

## Configuración Inicial
1. Usuario debe configurar URL, usuario y password de CouchDB
2. Sistema prueba conexión automáticamente
3. Crea base de datos si no existe
4. Configuración se guarda en localStorage

## Para Desarrollo
- `npm start`: Servidor de desarrollo
- `npm run build`: Build de producción
- Warnings menores de ESLint en useEffect (no críticos)

## URL de Acceso
- Desarrollo: http://localhost:3000
- Funciona en móviles accediendo por IP local

## Arquitectura de Datos
Los tickets incluyen: id, título, descripción, estado, monto, fecha vencimiento, searchId, notas[], pagos[], archivos[], fechas de creación/actualización.