/**
 * EJEMPLO_ESTRUCTURA_DATA.js
 * 
 * Ejemplos de uso de DB.js con la nueva estructura donde
 * los datos del usuario se guardan en el campo 'data'
 * y los timestamps se manejan automáticamente
 */

import { DB } from './src/commonApp/DB';

// ==================== EJEMPLO 1: Estructura Básica con Timestamps ====================

async function ejemploEstructuraBasica() {
  console.log('\n=== EJEMPLO 1: Estructura con campo data y timestamps automáticos ===\n');
  
  const db = new DB('usuarios', {
    isRemote: false,
    indices: ['userId', 'email']
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // CREAR: Los datos del usuario van en el objeto que pasas
  // updatedAt y createdAt se agregan AUTOMÁTICAMENTE
  const usuario = await db.put('user_001', {
    name: 'Juan Pérez',
    email: 'juan@example.com',
    role: 'admin',
    phone: '+123456789'
  });
  
  console.log('Documento guardado:', usuario);
  /*
   * Estructura guardada (timestamps agregados automáticamente):
   * {
   *   _id: "user_001",
   *   _rev: "1-abc123",
   *   _deleted: false,
   *   syncStatus: "pending",
   *   data: {
   *     name: "Juan Pérez",
   *     email: "juan@example.com",
   *     role: "admin",
   *     phone: "+123456789",
   *     createdAt: "2025-10-13T10:30:00.000Z",  // ← AUTOMÁTICO
   *     updatedAt: "2025-10-13T10:30:00.000Z"   // ← AUTOMÁTICO
   *   }
   * }
   */
  
  // LEER: El documento completo incluye la estructura
  const retrieved = await db.get('user_001');
  console.log('Documento obtenido:', retrieved);
  console.log('Datos del usuario:', retrieved.data);
  console.log('Timestamps:', {
    createdAt: retrieved.data.createdAt,
    updatedAt: retrieved.data.updatedAt
  });
  
  // ACTUALIZAR: updatedAt se actualiza AUTOMÁTICAMENTE
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await db.put('user_001', {
    ...retrieved.data, // Mantener datos anteriores
    phone: '+987654321' // Actualizar teléfono
    // updatedAt se actualiza automáticamente
  });
  
  const updated = await db.get('user_001');
  console.log('\nTimestamps después de actualizar:');
  console.log('  createdAt:', updated.data.createdAt, '(sin cambios)');
  console.log('  updatedAt:', updated.data.updatedAt, '(actualizado)');
  
  await db.close();
}

// ==================== EJEMPLO 2: Buscar en el campo data ====================

async function ejemploBusquedaEnData() {
  console.log('\n=== EJEMPLO 2: Búsqueda en campo data ===\n');
  
  const db = new DB('productos', {
    isRemote: false,
    indices: ['category', 'price']
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Crear varios productos
  await db.put('prod_001', {
    name: 'Laptop Dell',
    category: 'electronics',
    price: 999.99,
    stock: 10
  });
  
  await db.put('prod_002', {
    name: 'Mouse Logitech',
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
  
  // Buscar por categoría (busca en el campo 'data')
  const electronics = await db.find({ category: 'electronics' });
  
  console.log('Productos electrónicos encontrados:', electronics.length);
  electronics.forEach(prod => {
    console.log(`  - ${prod.data.name}: $${prod.data.price}`);
  });
  
  // Obtener todos
  const allProducts = await db.getAll();
  console.log('\nTodos los productos:', allProducts.length);
  allProducts.forEach(prod => {
    console.log(`  ID: ${prod._id}`);
    console.log(`  Datos:`, prod.data);
  });
  
  await db.close();
}

// ==================== EJEMPLO 3: Sincronización con estructura data ====================

async function ejemploSincronizacionConData() {
  console.log('\n=== EJEMPLO 3: Sincronización con campo data ===\n');
  
  const db = new DB('tickets', {
    isRemote: true,
    couchUrl: 'http://34.39.168.70:5984',
    username: 'admin',
    password: 'password123',
    userId: 'user_123',
    indices: ['userId', 'status']
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Crear ticket (datos del usuario en el objeto)
  const ticket = await db.put(null, {
    userId: 'user_123',
    title: 'Problema con la aplicación',
    description: 'La app se cierra inesperadamente',
    status: 'open',
    priority: 'high',
    createdAt: new Date().toISOString()
  });
  
  console.log('Ticket creado con ID:', ticket._id);
  console.log('Estructura completa:', ticket);
  console.log('Datos del ticket:', ticket.data);
  
  /*
   * Lo que se sincroniza a CouchDB:
   * {
   *   _id: "generated_id",
   *   _rev: "1-abc123",
   *   _deleted: false,
   *   data: {
   *     userId: "user_123",
   *     title: "Problema con la aplicación",
   *     description: "La app se cierra inesperadamente",
   *     status: "open",
   *     priority: "high",
   *     createdAt: "2025-10-13T..."
   *   }
   * }
   * 
   * Nota: syncStatus NO se envía a CouchDB (es solo local)
   */
  
  // Buscar tickets por usuario
  const myTickets = await db.find({ userId: 'user_123' });
  console.log('\nMis tickets:', myTickets.length);
  
  await db.close();
}

// ==================== EJEMPLO 4: Actualización parcial de data ====================

async function ejemploActualizacionParcial() {
  console.log('\n=== EJEMPLO 4: Actualización parcial de datos ===\n');
  
  const db = new DB('usuarios', {
    isRemote: false
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Crear usuario inicial
  await db.put('user_001', {
    name: 'María García',
    email: 'maria@example.com',
    role: 'user',
    profile: {
      avatar: 'avatar1.jpg',
      bio: 'Desarrolladora'
    }
  });
  
  // Obtener documento actual
  const current = await db.get('user_001');
  console.log('Usuario actual:', current.data);
  
  // Actualizar solo algunos campos (mantener el resto)
  await db.put('user_001', {
    ...current.data,
    role: 'admin', // Cambiar rol
    profile: {
      ...current.data.profile,
      bio: 'Desarrolladora Senior' // Actualizar bio
    }
  });
  
  // Verificar cambios
  const updated = await db.get('user_001');
  console.log('\nUsuario actualizado:', updated.data);
  console.log('Rol:', updated.data.role);
  console.log('Bio:', updated.data.profile.bio);
  
  await db.close();
}

// ==================== EJEMPLO 5: Migración de estructura antigua ====================

async function ejemploMigracionEstructura() {
  console.log('\n=== EJEMPLO 5: Migración desde estructura plana ===\n');
  
  const db = new DB('migracion', {
    isRemote: false
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // ANTES: Los datos estaban en el root junto con _id, _rev
  // const docAntiguo = {
  //   _id: "user_001",
  //   _rev: "1-abc",
  //   name: "Juan",
  //   email: "juan@example.com"
  // }
  
  // AHORA: Los datos van en el campo 'data'
  await db.put('user_001', {
    name: 'Juan',
    email: 'juan@example.com'
  });
  
  const doc = await db.get('user_001');
  console.log('Estructura nueva:');
  console.log('  Campos de control:', {
    _id: doc._id,
    _rev: doc._rev,
    _deleted: doc._deleted,
    syncStatus: doc.syncStatus
  });
  console.log('  Datos del usuario:', doc.data);
  
  // Para acceder a los datos del usuario
  console.log('\nAcceso a datos:');
  console.log('  Nombre:', doc.data.name);
  console.log('  Email:', doc.data.email);
  
  await db.close();
}

// ==================== EJEMPLO 6: Compatibilidad con código existente ====================

async function ejemploCompatibilidad() {
  console.log('\n=== EJEMPLO 6: Compatibilidad con INTEGRACION_PRACTICA.js ===\n');
  
  // Si usas INTEGRACION_PRACTICA.js, las funciones wrappers
  // manejan automáticamente la estructura
  
  /*
   * En INTEGRACION_PRACTICA.js las funciones devuelven:
   * 
   * db_add() -> { ...doc, id: doc._id }
   * db_get() -> { ...doc, id: doc._id }
   * db_find() -> [{ id: doc._id, data: doc }]
   * 
   * Esto mantiene compatibilidad con el código anterior
   * donde se accedía directamente a los campos
   */
  
  console.log('Ejemplo de uso con wrapper:');
  console.log(`
  import { db_add, db_get, db_find } from './INTEGRACION_PRACTICA';
  
  // Crear documento
  const doc = await db_add('tickets', 'ticket_001', {
    title: 'Test',
    status: 'open'
  });
  
  // Acceso a datos
  console.log(doc._id);        // ID del documento
  console.log(doc.data.title); // Datos del usuario
  console.log(doc.id);         // Alias de _id (compatibilidad)
  
  // Buscar documentos
  const results = await db_find('tickets', { status: 'open' });
  results.forEach(item => {
    console.log(item.id);        // ID del documento
    console.log(item.data.title); // Datos del usuario
  });
  `);
}

// ==================== EJEMPLO 7: Estructura completa real ====================

async function ejemploEstructuraCompleta() {
  console.log('\n=== EJEMPLO 7: Ejemplo de estructura completa ===\n');
  
  const db = new DB('tickets', {
    isRemote: true,
    couchUrl: 'http://34.39.168.70:5984',
    username: 'admin',
    password: 'password',
    userId: 'user_123'
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Crear ticket completo
  const ticket = await db.put('ticket_001', {
    // Información del ticket
    userId: 'user_123',
    title: 'Error al cargar imágenes',
    description: 'Las imágenes no se cargan en la galería',
    
    // Clasificación
    category: 'bug',
    priority: 'high',
    status: 'open',
    
    // Asignación
    assignedTo: null,
    assignedAt: null,
    
    // Fechas
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: null,
    
    // Metadata
    tags: ['images', 'gallery', 'mobile'],
    attachments: [],
    
    // Información adicional
    deviceInfo: {
      os: 'Android',
      version: '13',
      model: 'Samsung Galaxy S21'
    }
  });
  
  console.log('Ticket completo creado:');
  console.log(JSON.stringify(ticket, null, 2));
  
  console.log('\nEstructura en CouchDB:');
  console.log(`{
  "_id": "${ticket._id}",
  "_rev": "${ticket._rev}",
  "_deleted": false,
  "data": {
    "userId": "user_123",
    "title": "Error al cargar imágenes",
    "description": "Las imágenes no se cargan en la galería",
    "category": "bug",
    "priority": "high",
    "status": "open",
    "createdAt": "${ticket.data.createdAt}",
    "updatedAt": "${ticket.data.updatedAt}",
    ...
  }
}`);
  
  await db.close();
}

// ==================== EJEMPLO 8: Resolución de Conflictos ====================

async function ejemploResolucionConflictos() {
  console.log('\n=== EJEMPLO 8: Resolución de conflictos por updatedAt ===\n');
  
  const db = new DB('tasks', {
    isRemote: true,
    couchUrl: 'http://34.39.168.70:5984',
    username: 'admin',
    password: 'password123',
    userId: 'user_123'
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Crear tarea inicial
  console.log('1. Creando tarea inicial...');
  const task = await db.put('task_conflict_demo', {
    userId: 'user_123',
    title: 'Revisar código',
    status: 'pending',
    assignee: null
  });
  
  console.log('   Tarea creada en:', task.data.createdAt);
  console.log('   Última actualización:', task.data.updatedAt);
  
  // Simular pausa
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // ESCENARIO 1: Cliente actualiza (será más reciente)
  console.log('\n2. Cliente actualiza status a "in_progress"...');
  await db.put('task_conflict_demo', {
    ...task.data,
    status: 'in_progress'
  });
  
  const afterUpdate = await db.get('task_conflict_demo');
  console.log('   Status local:', afterUpdate.data.status);
  console.log('   updatedAt local:', afterUpdate.data.updatedAt);
  
  // Esperar sincronización
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n3. Sincronización completada');
  console.log('   ✓ Cliente tenía versión más reciente');
  console.log('   ✓ Servidor actualizado con datos del cliente');
  
  // ESCENARIO 2: Simular conflicto (requiere manipulación manual en CouchDB)
  console.log('\n--- Para simular un conflicto donde el servidor gana: ---');
  console.log('1. Edita manualmente el documento en CouchDB');
  console.log('2. Usa un updatedAt más reciente que el del cliente');
  console.log('3. Espera el próximo ciclo de sincronización');
  console.log('4. El cliente recibirá la versión del servidor (más reciente)');
  
  await db.close();
}

// ==================== EJECUTAR EJEMPLOS ====================

// Descomentar el que quieras probar:

// ejemploEstructuraBasica();
// ejemploBusquedaEnData();
// ejemploSincronizacionConData();
// ejemploActualizacionParcial();
// ejemploMigracionEstructura();
// ejemploCompatibilidad();
// ejemploEstructuraCompleta();
// ejemploResolucionConflictos();

export {
  ejemploEstructuraBasica,
  ejemploBusquedaEnData,
  ejemploSincronizacionConData,
  ejemploActualizacionParcial,
  ejemploMigracionEstructura,
  ejemploCompatibilidad,
  ejemploEstructuraCompleta,
  ejemploResolucionConflictos
};
