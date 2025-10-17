// Script de prueba para verificar sincronización inmediata
// Copiar y pegar en una consola o archivo de prueba

import { DB } from './src/commonApp/DB';

async function testSyncInmediata() {
  console.log('='.repeat(80));
  console.log('PRUEBA DE SINCRONIZACIÓN INMEDIATA');
  console.log('='.repeat(80));

  // Crear instancia de DB tipo REMOTE
  const db = new DB({
    name: 'test_sync_db',
    type: 'REMOTE',
    debug: true, // Activar logging detallado
    live: false
  });

  await db.initDB();
  console.log('\n✓ Base de datos inicializada\n');

  // PRUEBA 1: Crear un nuevo registro
  console.log('PRUEBA 1: Crear nuevo registro');
  console.log('-'.repeat(80));
  
  const testData = {
    nombre: 'Test Usuario',
    timestamp: Date.now(),
    descripcion: 'Prueba de sincronización inmediata'
  };

  console.log('Datos a guardar:', testData);
  console.log('\nGuardando...');
  
  const id = await db.add(testData);
  
  console.log('\n✓ Guardado completado, ID:', id);
  
  // Verificar sincronización local
  const isSyncedLocal = await db.isSynced(id);
  console.log('¿Sincronizado en BD local?:', isSyncedLocal);
  
  // Verificar existencia en remoto
  console.log('\nVerificando en servidor remoto...');
  const existsRemote = await db.existsInRemote(id);
  console.log('¿Existe en BD remota?:', existsRemote);

  if (existsRemote && isSyncedLocal) {
    console.log('\n✅ ¡ÉXITO! El registro se sincronizó inmediatamente');
  } else {
    console.log('\n❌ FALLO: El registro NO se sincronizó');
    console.log('   - Sincronizado local:', isSyncedLocal);
    console.log('   - Existe en remoto:', existsRemote);
  }

  // PRUEBA 2: Actualizar el registro
  console.log('\n\nPRUEBA 2: Actualizar registro existente');
  console.log('-'.repeat(80));
  
  const updatedData = {
    ...testData,
    nombre: 'Test Usuario ACTUALIZADO',
    ultimaActualizacion: Date.now()
  };

  console.log('Datos actualizados:', updatedData);
  console.log('\nActualizando...');
  
  await db.update(id, updatedData);
  
  console.log('\n✓ Actualización completada');
  
  // Verificar sincronización
  const isSyncedAfterUpdate = await db.isSynced(id);
  console.log('¿Sincronizado después de actualizar?:', isSyncedAfterUpdate);

  if (isSyncedAfterUpdate) {
    console.log('\n✅ ¡ÉXITO! La actualización se sincronizó inmediatamente');
  } else {
    console.log('\n❌ FALLO: La actualización NO se sincronizó');
  }

  // PRUEBA 3: Múltiples guardados rápidos
  console.log('\n\nPRUEBA 3: Múltiples guardados rápidos (5 registros)');
  console.log('-'.repeat(80));
  
  const ids = [];
  const startTime = Date.now();
  
  for (let i = 0; i < 5; i++) {
    console.log(`\nGuardando registro ${i + 1}/5...`);
    const id = await db.add({
      numero: i + 1,
      timestamp: Date.now(),
      descripcion: `Registro ${i + 1} de prueba rápida`
    });
    ids.push(id);
    console.log(`  ✓ ID: ${id}`);
  }
  
  const endTime = Date.now();
  console.log(`\nTiempo total: ${endTime - startTime}ms`);
  
  // Verificar todos los registros
  console.log('\nVerificando sincronización de todos los registros...');
  let allSynced = true;
  for (let i = 0; i < ids.length; i++) {
    const synced = await db.isSynced(ids[i]);
    const exists = await db.existsInRemote(ids[i]);
    console.log(`  Registro ${i + 1}: synced=${synced}, exists=${exists}`);
    if (!synced || !exists) allSynced = false;
  }

  if (allSynced) {
    console.log('\n✅ ¡ÉXITO! Todos los registros se sincronizaron inmediatamente');
  } else {
    console.log('\n❌ FALLO: Algunos registros NO se sincronizaron');
  }

  // Mostrar trace de los últimos eventos
  console.log('\n\nTRACE DE EVENTOS (últimos 30):');
  console.log('='.repeat(80));
  db.printLast(30);

  console.log('\n\n' + '='.repeat(80));
  console.log('FIN DE PRUEBAS');
  console.log('='.repeat(80));

  // Detener sync periódico
  db.stopSync();
}

// Ejecutar test
testSyncInmediata().catch(err => {
  console.error('\n\n❌ ERROR EN PRUEBAS:', err);
  console.error('Stack:', err.stack);
});
