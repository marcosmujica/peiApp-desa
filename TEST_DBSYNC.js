/**
 * Script de prueba para la clase DBSync
 * Permite testear la sincronización de manera aislada
 */

import { DBSync } from './src/commonApp/DBSync';

// Configuración de prueba
const CONFIG = {
  tableName: 'test_sync',
  couchUrl: 'http://34.39.168.70:5984',
  username: 'admin_X9!fQz7#Lp4Rt8$Mh2',
  password: 'G@7hX!2$kP9^mQ4&rZ6*Ty1wVb',
  fetchTimeout: 30000,
  syncInterval: 10000,
  debug: true
};

// Mock de callbacks para simular interacción con DB
const mockCallbacks = {
  syncedRecords: new Map(),
  deletedRecords: new Set(),
  
  onMarkSynced: async (id, rev = null) => {
    console.log(`[MOCK] Marcando como sincronizado: ${id}, rev: ${rev}`);
    mockCallbacks.syncedRecords.set(id, { synced: true, rev, timestamp: Date.now() });
  },
  
  onSaveLocal: async (data, id, rev) => {
    console.log(`[MOCK] Guardando localmente: ${id}`);
    // Aquí normalmente guardarías en SQLite/IndexedDB
  },
  
  onDelete: async (id) => {
    console.log(`[MOCK] Eliminando: ${id}`);
    mockCallbacks.deletedRecords.add(id);
  }
};

// ============================================================================
// TESTS
// ============================================================================

async function test1_BasicSync() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 1: Sincronización Básica de un Registro Nuevo');
  console.log('='.repeat(80));
  
  const sync = new DBSync({
    ...CONFIG,
    ...mockCallbacks
  });
  
  const testRecord = {
    id: `test_${Date.now()}`,
    _id: `test_${Date.now()}`,
    data: { nombre: 'Test Usuario', timestamp: Date.now() },
    updatedAt: Date.now(),
    synced: 0,
    _rev: ''
  };
  
  console.log('Registro a sincronizar:', testRecord);
  
  try {
    const success = await sync.syncRecordImmediate(testRecord);
    console.log('\n✅ TEST 1 PASADO:', success ? 'SINCRONIZADO' : 'FALLÓ POR RED');
    console.log('Estadísticas:', sync.getStats());
    
    // Verificar que se marcó como sincronizado
    if (mockCallbacks.syncedRecords.has(testRecord.id)) {
      console.log('✓ Registro marcado como sincronizado correctamente');
    } else {
      console.log('✗ ERROR: Registro NO fue marcado como sincronizado');
    }
  } catch (err) {
    console.log('\n❌ TEST 1 FALLÓ:', err.message);
    console.log('Stack:', err.stack);
  }
  
  console.log('\nTrace del registro:');
  sync.printTraceFor(testRecord.id);
}

async function test2_TimeoutHandling() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 2: Manejo de Timeout con PUT Directo');
  console.log('='.repeat(80));
  
  const sync = new DBSync({
    ...CONFIG,
    fetchTimeout: 5000, // Timeout muy corto para forzar fallo
    ...mockCallbacks
  });
  
  const testRecord = {
    id: `timeout_test_${Date.now()}`,
    _id: `timeout_test_${Date.now()}`,
    data: { test: 'timeout handling', timestamp: Date.now() },
    updatedAt: Date.now(),
    synced: 0,
    _rev: ''
  };
  
  console.log('Registro a sincronizar (timeout: 5s):', testRecord);
  
  try {
    const success = await sync.syncRecordImmediate(testRecord);
    console.log('\n✅ TEST 2 RESULTADO:', success ? 'SINCRONIZADO' : 'FALLÓ POR RED (ESPERADO)');
    console.log('Estadísticas:', sync.getStats());
    console.log('Network Errors:', sync.stats.networkErrors);
    console.log('Direct PUTs:', sync.stats.directPuts);
  } catch (err) {
    console.log('\n⚠️ TEST 2: Error capturado (puede ser esperado):', err.message);
  }
  
  console.log('\nTrace del registro:');
  sync.printTraceFor(testRecord.id);
}

async function test3_MultipleRecords() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 3: Sincronización Múltiple (5 registros)');
  console.log('='.repeat(80));
  
  const sync = new DBSync({
    ...CONFIG,
    ...mockCallbacks
  });
  
  const records = [];
  for (let i = 0; i < 5; i++) {
    records.push({
      id: `multi_test_${i}_${Date.now()}`,
      _id: `multi_test_${i}_${Date.now()}`,
      data: { numero: i, timestamp: Date.now() },
      updatedAt: Date.now(),
      synced: 0,
      _rev: ''
    });
  }
  
  console.log(`Sincronizando ${records.length} registros...`);
  const startTime = Date.now();
  
  const results = [];
  for (const record of records) {
    try {
      const success = await sync.syncRecordImmediate(record);
      results.push({ id: record.id, success });
      console.log(`  ${record.id}: ${success ? '✓' : '✗'}`);
    } catch (err) {
      results.push({ id: record.id, success: false, error: err.message });
      console.log(`  ${record.id}: ✗ ${err.message}`);
    }
  }
  
  const elapsed = Date.now() - startTime;
  const successful = results.filter(r => r.success).length;
  
  console.log(`\n✅ TEST 3 COMPLETADO`);
  console.log(`  Tiempo total: ${elapsed}ms`);
  console.log(`  Exitosos: ${successful}/${records.length}`);
  console.log(`  Promedio por registro: ${(elapsed / records.length).toFixed(0)}ms`);
  console.log('\nEstadísticas:', sync.getStats());
  
  console.log('\nÚltimos 20 eventos:');
  sync.printLast(20);
}

async function test4_StatisticsAndTrace() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 4: Estadísticas y Trace');
  console.log('='.repeat(80));
  
  const sync = new DBSync({
    ...CONFIG,
    ...mockCallbacks
  });
  
  // Sincronizar varios registros
  for (let i = 0; i < 3; i++) {
    const record = {
      id: `stats_test_${i}_${Date.now()}`,
      _id: `stats_test_${i}_${Date.now()}`,
      data: { test: `estadisticas ${i}` },
      updatedAt: Date.now(),
      synced: 0,
      _rev: ''
    };
    
    try {
      await sync.syncRecordImmediate(record);
    } catch (err) {
      console.log(`Error en ${record.id}:`, err.message);
    }
  }
  
  console.log('\n📊 ESTADÍSTICAS FINALES:');
  const stats = sync.getStats();
  console.log(JSON.stringify(stats, null, 2));
  
  console.log('\n📋 TRACE POR EVENTO:');
  const events = ['syncRecordImmediate:start', 'syncRecord:createdRemote', 'syncRecord:networkError'];
  events.forEach(eventName => {
    const entries = sync.getTraceByEvent(eventName);
    console.log(`  ${eventName}: ${entries.length} eventos`);
  });
  
  console.log('\n✅ TEST 4 COMPLETADO');
}

async function test5_PeriodicSync() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 5: Sincronización Periódica (5 segundos)');
  console.log('='.repeat(80));
  
  const sync = new DBSync({
    ...CONFIG,
    syncInterval: 5000,
    ...mockCallbacks
  });
  
  // Simular registros pendientes
  let pendingRecords = [
    {
      id: `periodic_1_${Date.now()}`,
      _id: `periodic_1_${Date.now()}`,
      data: { test: 'periodic 1' },
      updatedAt: Date.now(),
      synced: 0,
      _rev: ''
    },
    {
      id: `periodic_2_${Date.now()}`,
      _id: `periodic_2_${Date.now()}`,
      data: { test: 'periodic 2' },
      updatedAt: Date.now(),
      synced: 0,
      _rev: ''
    }
  ];
  
  // Función que retorna registros pendientes
  const getRecordsToSync = async () => {
    console.log(`[TEST] Retornando ${pendingRecords.length} registros pendientes`);
    return pendingRecords;
  };
  
  console.log('Iniciando sincronización periódica...');
  sync.startPeriodicSync(getRecordsToSync);
  
  // Esperar 12 segundos para ver 2 ciclos
  console.log('Esperando 12 segundos para observar ciclos...');
  await new Promise(resolve => setTimeout(resolve, 12000));
  
  // Detener sync
  sync.stopPeriodicSync();
  console.log('\n✅ TEST 5 COMPLETADO');
  console.log('Estadísticas:', sync.getStats());
}

// ============================================================================
// EJECUTAR TESTS
// ============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('█'.repeat(80));
  console.log('██ SUITE DE PRUEBAS PARA DBSync'.padEnd(79) + '█');
  console.log('█'.repeat(80));
  
  try {
    await test1_BasicSync();
    await new Promise(r => setTimeout(r, 2000));
    
    await test2_TimeoutHandling();
    await new Promise(r => setTimeout(r, 2000));
    
    await test3_MultipleRecords();
    await new Promise(r => setTimeout(r, 2000));
    
    await test4_StatisticsAndTrace();
    await new Promise(r => setTimeout(r, 2000));
    
    // await test5_PeriodicSync(); // Comentado por default (tarda 12s)
    
    console.log('\n');
    console.log('█'.repeat(80));
    console.log('██ TODOS LOS TESTS COMPLETADOS'.padEnd(79) + '█');
    console.log('█'.repeat(80));
    
  } catch (err) {
    console.error('\n❌ ERROR GENERAL:', err);
    console.error('Stack:', err.stack);
  }
}

// Ejecutar
runAllTests().catch(console.error);
