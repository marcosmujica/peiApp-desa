/**
 * EJEMPLO DE USO DE LA CLASE DB
 * 
 * Este archivo muestra cómo utilizar la clase DB en diferentes escenarios
 */

import { DB } from './DB';

// ==================== EJEMPLO 1: Base de datos local únicamente ====================
async function ejemploBaseDatosLocal() {
  console.log('\n=== EJEMPLO 1: Base de datos LOCAL ===\n');
  
  // Crear instancia de DB solo local (sin sincronización remota)
  const dbLocal = new DB('mi_base_local', {
    isRemote: false, // No sincroniza con servidor
    indices: ['userId', 'type', 'createdAt'] // Índices para búsquedas rápidas
  });
  
  // Esperar inicialización
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Crear documentos
  const doc1 = await dbLocal.put('user_001', {
    name: 'Juan Pérez',
    email: 'juan@example.com',
    type: 'user'
  });
  console.log('Documento creado:', doc1);
  
  // Obtener documento
  const retrieved = await dbLocal.get('user_001');
  console.log('Documento obtenido:', retrieved);
  
  // Actualizar documento
  const updated = await dbLocal.put('user_001', {
    ...retrieved,
    phone: '+1234567890'
  });
  console.log('Documento actualizado:', updated);
  
  // Obtener todos los documentos
  const allDocs = await dbLocal.getAll();
  console.log('Todos los documentos:', allDocs);
  
  // Buscar con query
  const users = await dbLocal.find({ type: 'user' });
  console.log('Usuarios encontrados:', users);
  
  // Eliminar documento
  await dbLocal.delete('user_001');
  console.log('Documento eliminado');
  
  // Cerrar conexión
  await dbLocal.close();
}

// ==================== EJEMPLO 2: Base de datos con sincronización remota ====================
async function ejemploBaseDatosRemota() {
  console.log('\n=== EJEMPLO 2: Base de datos REMOTA con sincronización ===\n');
  
  // Crear instancia con sincronización remota
  const dbRemote = new DB('tickets', {
    isRemote: true, // Habilita sincronización
    couchUrl: 'http://34.39.168.70:5984', // URL del servidor CouchDB
    username: 'admin', // Usuario CouchDB
    password: 'password123', // Contraseña CouchDB
    userId: 'user_123', // ID del usuario logueado (para filtrado)
    syncInterval: 30000, // Sincronizar cada 30 segundos
    fetchTimeout: 10000, // Timeout de 10 segundos para peticiones
    indices: ['userId', 'status', 'priority', 'createdAt']
  });
  
  // Esperar inicialización y primera sincronización
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Crear ticket (se guardará local y se sincronizará automáticamente)
  const ticket = await dbRemote.put(null, { // null = generar ID automático
    userId: 'user_123',
    title: 'Problema con la aplicación',
    description: 'La app se cierra inesperadamente',
    status: 'open',
    priority: 'high',
    createdAt: new Date().toISOString()
  });
  console.log('Ticket creado y sincronizado:', ticket);
  
  // Obtener todos los tickets
  const allTickets = await dbRemote.getAll();
  console.log('Total de tickets:', allTickets.length);
  
  // Buscar tickets por status
  const openTickets = await dbRemote.find({ status: 'open' });
  console.log('Tickets abiertos:', openTickets);
  
  // Actualizar ticket
  const updatedTicket = await dbRemote.put(ticket._id, {
    ...ticket,
    status: 'in_progress',
    assignedTo: 'admin_001'
  });
  console.log('Ticket actualizado:', updatedTicket);
  
  // La sincronización continúa automáticamente cada 30 segundos
  console.log('Sincronización automática en curso...');
  
  // Para detener la sincronización:
  // dbRemote.stopSync();
  
  // Para cerrar completamente:
  // await dbRemote.close();
}

// ==================== EJEMPLO 3: Múltiples bases de datos ====================
async function ejemploMultiplesBaseDatos() {
  console.log('\n=== EJEMPLO 3: MÚLTIPLES bases de datos ===\n');
  
  // Sistema de tickets con múltiples bases de datos
  const dbTickets = new DB('tickets', {
    isRemote: true,
    couchUrl: 'http://34.39.168.70:5984',
    username: 'admin',
    password: 'password123',
    userId: 'user_123',
    indices: ['userId', 'status']
  });
  
  const dbUsers = new DB('users', {
    isRemote: true,
    couchUrl: 'http://34.39.168.70:5984',
    username: 'admin',
    password: 'password123',
    indices: ['email', 'role']
  });
  
  const dbMessages = new DB('messages', {
    isRemote: true,
    couchUrl: 'http://34.39.168.70:5984',
    username: 'admin',
    password: 'password123',
    userId: 'user_123',
    indices: ['ticketId', 'userId', 'createdAt']
  });
  
  // Esperar inicialización
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Crear ticket
  const ticket = await dbTickets.put(null, {
    userId: 'user_123',
    title: 'Nueva consulta',
    status: 'open'
  });
  
  // Crear mensaje para el ticket
  await dbMessages.put(null, {
    ticketId: ticket._id,
    userId: 'user_123',
    message: 'Necesito ayuda con...',
    createdAt: new Date().toISOString()
  });
  
  // Obtener mensajes del ticket
  const messages = await dbMessages.find({ ticketId: ticket._id });
  console.log('Mensajes del ticket:', messages);
  
  // Obtener usuario
  const user = await dbUsers.get('user_123');
  console.log('Usuario:', user);
  
  console.log('Todas las bases de datos funcionando en paralelo');
}

// ==================== EJEMPLO 4: Manejo de errores ====================
async function ejemploManejoErrores() {
  console.log('\n=== EJEMPLO 4: MANEJO de errores ===\n');
  
  try {
    const db = new DB('test_db', {
      isRemote: true,
      couchUrl: 'http://servidor-invalido:5984', // URL inválida
      username: 'test',
      password: 'test',
      syncInterval: 10000,
      fetchTimeout: 5000
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Esto funcionará localmente aunque el servidor no esté disponible
    const doc = await db.put('doc_001', {
      data: 'Guardado localmente'
    });
    console.log('Documento guardado localmente:', doc);
    
    // La sincronización fallará pero la app seguirá funcionando
    // Los documentos quedarán como "pending" hasta que el servidor esté disponible
    
    const allDocs = await db.getAll();
    console.log('Documentos locales:', allDocs.length);
    
  } catch (error) {
    console.error('Error capturado:', error.message);
  }
}

// ==================== EJEMPLO 5: Operaciones CRUD completas ====================
async function ejemploCRUDCompleto() {
  console.log('\n=== EJEMPLO 5: CRUD COMPLETO ===\n');
  
  const db = new DB('productos', {
    isRemote: false,
    indices: ['category', 'price', 'stock']
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // CREATE - Crear múltiples productos
  console.log('--- CREATE ---');
  await db.put('prod_001', {
    name: 'Laptop',
    category: 'electronics',
    price: 999.99,
    stock: 10
  });
  
  await db.put('prod_002', {
    name: 'Mouse',
    category: 'electronics',
    price: 29.99,
    stock: 50
  });
  
  await db.put('prod_003', {
    name: 'Desk Chair',
    category: 'furniture',
    price: 199.99,
    stock: 5
  });
  
  console.log('✓ 3 productos creados');
  
  // READ - Leer productos
  console.log('\n--- READ ---');
  const laptop = await db.get('prod_001');
  console.log('Laptop:', laptop);
  
  const allProducts = await db.getAll();
  console.log('Total productos:', allProducts.length);
  
  const electronics = await db.find({ category: 'electronics' });
  console.log('Electrónicos:', electronics.length);
  
  // UPDATE - Actualizar producto
  console.log('\n--- UPDATE ---');
  const updatedLaptop = await db.put('prod_001', {
    ...laptop,
    price: 899.99, // Precio reducido
    stock: 8 // Stock actualizado
  });
  console.log('Laptop actualizada:', updatedLaptop);
  
  // DELETE - Eliminar producto
  console.log('\n--- DELETE ---');
  await db.delete('prod_003');
  console.log('✓ Silla eliminada');
  
  const remaining = await db.getAll();
  console.log('Productos restantes:', remaining.length);
  
  await db.close();
}

// ==================== EJEMPLO 6: Configuración avanzada ====================
async function ejemploConfiguracionAvanzada() {
  console.log('\n=== EJEMPLO 6: CONFIGURACIÓN AVANZADA ===\n');
  
  // Base de datos con configuración personalizada
  const db = new DB('logs', {
    // Sincronización remota
    isRemote: true,
    couchUrl: 'http://34.39.168.70:5984',
    username: 'logger',
    password: 'secure_password',
    
    // Filtrado por usuario
    userId: 'app_user_456',
    
    // Índices para búsquedas optimizadas
    indices: [
      'level',      // info, warning, error
      'module',     // auth, api, database
      'timestamp',  // fecha/hora
      'userId'      // usuario que generó el log
    ],
    
    // Sincronización cada 60 segundos (menos frecuente)
    syncInterval: 60000,
    
    // Timeout de 15 segundos (más tiempo para redes lentas)
    fetchTimeout: 15000
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Crear log
  await db.put(null, {
    level: 'error',
    module: 'authentication',
    message: 'Login failed for user',
    userId: 'app_user_456',
    timestamp: new Date().toISOString(),
    details: {
      attempts: 3,
      ip: '192.168.1.100'
    }
  });
  
  console.log('Log creado con configuración avanzada');
  
  // Buscar logs de error
  const errors = await db.find({ level: 'error' });
  console.log('Logs de error:', errors.length);
}

// ==================== EJECUTAR EJEMPLOS ====================

// Descomentar el ejemplo que quieras ejecutar:

// ejemploBaseDatosLocal();
// ejemploBaseDatosRemota();
// ejemploMultiplesBaseDatos();
// ejemploManejoErrores();
// ejemploCRUDCompleto();
// ejemploConfiguracionAvanzada();

export {
  ejemploBaseDatosLocal,
  ejemploBaseDatosRemota,
  ejemploMultiplesBaseDatos,
  ejemploManejoErrores,
  ejemploCRUDCompleto,
  ejemploConfiguracionAvanzada
};
