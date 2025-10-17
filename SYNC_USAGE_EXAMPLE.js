// Ejemplo de uso de la sincronización mejorada

import { DB } from './commonApp/DB';

// Ejemplo 1: Base de datos LOCAL (sin sincronización)
const dbLocal = new DB({
  name: 'midb_local',
  type: 'LOCAL',
  debug: true
});

await dbLocal.initDB();
const id1 = await dbLocal.add({ nombre: 'Juan', edad: 30 });
// Se guarda solo localmente, sin sincronización
console.log('Guardado local:', id1);

// Ejemplo 2: Base de datos REMOTE (con sincronización inmediata)
const dbRemote = new DB({
  name: 'midb_remote',
  type: 'REMOTE',
  username: 'admin',
  password: 'password',
  syncInterval: 10000, // Sync periódico cada 10 segundos (respaldo)
  debug: true,
  live: true
});

await dbRemote.initDB();

// Este guardado se sincronizará INMEDIATAMENTE con CouchDB
const id2 = await dbRemote.add({ nombre: 'María', edad: 25 });
console.log('Guardado y sincronizado:', id2);
// Al retornar, el registro ya está en CouchDB

// Múltiples guardados rápidos
const ids = [];
for (let i = 0; i < 5; i++) {
  const id = await dbRemote.add({ 
    nombre: `Usuario${i}`, 
    timestamp: Date.now() 
  });
  ids.push(id);
  console.log(`Guardado y sincronizado ${i+1}/5:`, id);
}
// Todos los registros están en CouchDB cuando el loop termina

// Actualización
await dbRemote.update(id2, { nombre: 'María Actualizada', edad: 26 });
console.log('Actualizado y sincronizado:', id2);

// Verificar estado de sincronización
const record = await dbRemote.getWithHeader(id2);
console.log('Estado synced:', record.synced); // Debería ser 1

// Escuchar eventos de sincronización
import { subscribeToEvent, EVENT_NEW_DOC } from './commonApp/DBEvents';

subscribeToEvent(EVENT_NEW_DOC, (event) => {
  console.log('Nuevo documento:', {
    tabla: event.table,
    id: event.id,
    origen: event.source, // 'local' o 'remote'
    sincronizado: event.synced
  });
});

// Ejemplo 3: Manejo de errores
try {
  const id3 = await dbRemote.add({ 
    datos: 'importante',
    timestamp: Date.now() 
  });
  console.log('Guardado exitoso:', id3);
} catch (error) {
  console.error('Error en guardado/sincronización:', error);
  // El error puede ser de guardado local o sincronización remota
}

// Ejemplo 4: Tracing para debug
dbRemote.debug = true; // Activar modo debug
const id4 = await dbRemote.add({ test: 'tracing' });

// Ver trace completo
console.log('Trace completo:', dbRemote.getTrace());

// Ver trace de un documento específico
dbRemote.printTraceFor(id4);

// Ver últimas 20 operaciones
dbRemote.printLast(20);
