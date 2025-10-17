/**
 * TEST_DB.js - Pruebas unitarias y de integración para DB.js
 * 
 * Ejecutar: node TEST_DB.js (requiere configurar babel para importar módulos ES6)
 * O importar en tu app React Native y ejecutar las funciones
 */

import { DB } from './src/commonApp/DB';

// ==================== UTILIDADES DE PRUEBA ====================

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async test(name, fn) {
    try {
      console.log(`\n🧪 Ejecutando: ${name}`);
      await fn();
      this.passed++;
      console.log(`✅ PASS: ${name}`);
    } catch (error) {
      this.failed++;
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${error.message}`);
      console.error(error.stack);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(
        `${message}\n  Esperado: ${JSON.stringify(expected)}\n  Recibido: ${JSON.stringify(actual)}`
      );
    }
  }

  assertNotNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(`${message} - Valor es null o undefined`);
    }
  }

  summary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('='.repeat(60));
    console.log(`✅ Pasadas: ${this.passed}`);
    console.log(`❌ Falladas: ${this.failed}`);
    console.log(`📝 Total: ${this.passed + this.failed}`);
    console.log('='.repeat(60));
    
    if (this.failed === 0) {
      console.log('🎉 ¡TODAS LAS PRUEBAS PASARON!');
    } else {
      console.log('⚠️  HAY PRUEBAS FALLIDAS');
    }
  }
}

// ==================== SUITE DE PRUEBAS ====================

async function runAllTests() {
  const runner = new TestRunner();
  
  // ==================== PRUEBAS DE INICIALIZACIÓN ====================
  
  await runner.test('DB se inicializa correctamente (local)', async () => {
    const db = new DB('test_init_local', {
      isRemote: false,
      indices: ['field1', 'field2']
    });
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    runner.assert(db.initialized === true, 'DB debería estar inicializada');
    runner.assertEqual(db.dbName, 'test_init_local', 'Nombre de DB correcto');
    runner.assertEqual(db.isRemote, false, 'isRemote debe ser false');
    
    await db.close();
  });
  
  await runner.test('DB se inicializa con configuración remota', async () => {
    const db = new DB('test_init_remote', {
      isRemote: true,
      couchUrl: 'http://34.39.168.70:5984',
      username: 'test',
      password: 'test',
      userId: 'user_001',
      syncInterval: 60000
    });
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    runner.assert(db.initialized === true, 'DB debería estar inicializada');
    runner.assertEqual(db.isRemote, true, 'isRemote debe ser true');
    runner.assertEqual(db.userId, 'user_001', 'userId correcto');
    
    db.stopSync();
    await db.close();
  });
  
  // ==================== PRUEBAS CRUD ====================
  
  await runner.test('PUT crea un documento correctamente', async () => {
    const db = new DB('test_put', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const doc = await db.put('doc_001', {
      name: 'Test Document',
      type: 'test',
      value: 123
    });
    
    runner.assertNotNull(doc, 'Documento no debe ser null');
    runner.assertEqual(doc._id, 'doc_001', 'ID correcto');
    runner.assertNotNull(doc._rev, '_rev debe existir');
    runner.assertEqual(doc.name, 'Test Document', 'Campo name correcto');
    runner.assertEqual(doc.syncStatus, 'pending', 'syncStatus debe ser pending');
    
    await db.close();
  });
  
  await runner.test('PUT con ID null genera ID automático', async () => {
    const db = new DB('test_auto_id', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const doc = await db.put(null, {
      name: 'Auto ID Document'
    });
    
    runner.assertNotNull(doc._id, 'ID debe ser generado');
    runner.assert(doc._id.length > 0, 'ID debe tener contenido');
    
    await db.close();
  });
  
  await runner.test('GET obtiene documento existente', async () => {
    const db = new DB('test_get', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Crear documento
    await db.put('doc_002', {
      name: 'Get Test',
      value: 456
    });
    
    // Obtener documento
    const doc = await db.get('doc_002');
    
    runner.assertNotNull(doc, 'Documento debe existir');
    runner.assertEqual(doc._id, 'doc_002', 'ID correcto');
    runner.assertEqual(doc.name, 'Get Test', 'Campo name correcto');
    runner.assertEqual(doc.value, 456, 'Campo value correcto');
    
    await db.close();
  });
  
  await runner.test('GET retorna null para documento inexistente', async () => {
    const db = new DB('test_get_null', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const doc = await db.get('doc_inexistente');
    
    runner.assertEqual(doc, null, 'Debe retornar null');
    
    await db.close();
  });
  
  await runner.test('PUT actualiza documento existente', async () => {
    const db = new DB('test_update', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Crear documento
    const doc1 = await db.put('doc_003', {
      name: 'Original',
      value: 100
    });
    
    // Actualizar documento
    const doc2 = await db.put('doc_003', {
      ...doc1,
      name: 'Updated',
      value: 200
    });
    
    runner.assertEqual(doc2._id, 'doc_003', 'ID debe ser el mismo');
    runner.assertEqual(doc2.name, 'Updated', 'Campo actualizado');
    runner.assertEqual(doc2.value, 200, 'Valor actualizado');
    runner.assert(doc2._rev !== doc1._rev, '_rev debe cambiar');
    
    await db.close();
  });
  
  await runner.test('DELETE marca documento como eliminado', async () => {
    const db = new DB('test_delete', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Crear documento
    await db.put('doc_004', {
      name: 'To Delete'
    });
    
    // Eliminar documento
    const deleted = await db.delete('doc_004');
    
    runner.assertEqual(deleted, true, 'delete debe retornar true');
    
    // Verificar que no se obtiene
    const doc = await db.get('doc_004');
    runner.assertEqual(doc, null, 'Documento eliminado no debe obtenerse');
    
    await db.close();
  });
  
  await runner.test('DELETE retorna false para documento inexistente', async () => {
    const db = new DB('test_delete_null', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const deleted = await db.delete('doc_inexistente');
    
    runner.assertEqual(deleted, false, 'Debe retornar false');
    
    await db.close();
  });
  
  // ==================== PRUEBAS DE CONSULTAS ====================
  
  await runner.test('getAll retorna todos los documentos', async () => {
    const db = new DB('test_getall', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Crear varios documentos
    await db.put('doc_1', { name: 'Doc 1', type: 'A' });
    await db.put('doc_2', { name: 'Doc 2', type: 'B' });
    await db.put('doc_3', { name: 'Doc 3', type: 'A' });
    
    const allDocs = await db.getAll();
    
    runner.assertEqual(allDocs.length, 3, 'Debe haber 3 documentos');
    
    await db.close();
  });
  
  await runner.test('getAll con query filtra correctamente', async () => {
    const db = new DB('test_query', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Crear documentos con diferentes tipos
    await db.put('doc_a1', { name: 'Doc A1', type: 'A', value: 10 });
    await db.put('doc_a2', { name: 'Doc A2', type: 'A', value: 20 });
    await db.put('doc_b1', { name: 'Doc B1', type: 'B', value: 30 });
    
    // Filtrar por tipo
    const typeA = await db.getAll({ type: 'A' });
    const typeB = await db.getAll({ type: 'B' });
    
    runner.assertEqual(typeA.length, 2, 'Debe haber 2 documentos tipo A');
    runner.assertEqual(typeB.length, 1, 'Debe haber 1 documento tipo B');
    
    await db.close();
  });
  
  await runner.test('find es alias de getAll', async () => {
    const db = new DB('test_find', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await db.put('doc_1', { name: 'Test', category: 'X' });
    
    const results = await db.find({ category: 'X' });
    
    runner.assertEqual(results.length, 1, 'find debe funcionar igual que getAll');
    
    await db.close();
  });
  
  await runner.test('getAll no incluye documentos eliminados', async () => {
    const db = new DB('test_getall_deleted', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Crear documentos
    await db.put('doc_1', { name: 'Doc 1' });
    await db.put('doc_2', { name: 'Doc 2' });
    await db.put('doc_3', { name: 'Doc 3' });
    
    // Eliminar uno
    await db.delete('doc_2');
    
    const allDocs = await db.getAll();
    
    runner.assertEqual(allDocs.length, 2, 'Solo debe haber 2 documentos');
    
    const ids = allDocs.map(d => d._id);
    runner.assert(!ids.includes('doc_2'), 'Doc eliminado no debe estar');
    
    await db.close();
  });
  
  // ==================== PRUEBAS DE REVISIONES ====================
  
  await runner.test('_rev se incrementa correctamente', async () => {
    const db = new DB('test_rev', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Crear documento
    const doc1 = await db.put('doc_rev', { value: 1 });
    runner.assert(doc1._rev.startsWith('1-'), '_rev debe empezar con 1-');
    
    // Actualizar
    const doc2 = await db.put('doc_rev', { ...doc1, value: 2 });
    runner.assert(doc2._rev.startsWith('2-'), '_rev debe empezar con 2-');
    
    // Actualizar de nuevo
    const doc3 = await db.put('doc_rev', { ...doc2, value: 3 });
    runner.assert(doc3._rev.startsWith('3-'), '_rev debe empezar con 3-');
    
    await db.close();
  });
  
  // ==================== PRUEBAS DE MÉTODOS AUXILIARES ====================
  
  await runner.test('_generateId genera IDs únicos', async () => {
    const db = new DB('test_gen_id', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const id1 = db._generateId();
    const id2 = db._generateId();
    
    runner.assertNotNull(id1, 'ID1 debe existir');
    runner.assertNotNull(id2, 'ID2 debe existir');
    runner.assert(id1 !== id2, 'IDs deben ser diferentes');
    
    await db.close();
  });
  
  await runner.test('_incrementRev incrementa correctamente', async () => {
    const db = new DB('test_inc_rev', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const rev1 = '1-abc123';
    const rev2 = db._incrementRev(rev1);
    
    runner.assert(rev2.startsWith('2-'), 'Debe incrementar a 2');
    
    const rev3 = db._incrementRev(rev2);
    runner.assert(rev3.startsWith('3-'), 'Debe incrementar a 3');
    
    await db.close();
  });
  
  await runner.test('_compareRevs compara revisiones correctamente', async () => {
    const db = new DB('test_cmp_rev', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const rev1 = '1-abc';
    const rev2 = '2-def';
    const rev3 = '3-ghi';
    
    runner.assert(db._compareRevs(rev2, rev1) > 0, 'rev2 debe ser mayor que rev1');
    runner.assert(db._compareRevs(rev1, rev2) < 0, 'rev1 debe ser menor que rev2');
    runner.assert(db._compareRevs(rev3, rev2) > 0, 'rev3 debe ser mayor que rev2');
    
    await db.close();
  });
  
  // ==================== PRUEBAS DE MÚLTIPLES OPERACIONES ====================
  
  await runner.test('Operaciones CRUD secuenciales funcionan correctamente', async () => {
    const db = new DB('test_crud_seq', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // CREATE
    const created = await db.put('user_001', {
      name: 'Juan Pérez',
      email: 'juan@test.com',
      role: 'user'
    });
    runner.assertNotNull(created, 'Documento creado');
    
    // READ
    const read = await db.get('user_001');
    runner.assertEqual(read.name, 'Juan Pérez', 'Documento leído correctamente');
    
    // UPDATE
    const updated = await db.put('user_001', {
      ...read,
      role: 'admin'
    });
    runner.assertEqual(updated.role, 'admin', 'Documento actualizado');
    
    // READ actualizado
    const readUpdated = await db.get('user_001');
    runner.assertEqual(readUpdated.role, 'admin', 'Cambios persistidos');
    
    // DELETE
    await db.delete('user_001');
    const readDeleted = await db.get('user_001');
    runner.assertEqual(readDeleted, null, 'Documento eliminado');
    
    await db.close();
  });
  
  await runner.test('Múltiples documentos en paralelo', async () => {
    const db = new DB('test_parallel', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Crear múltiples documentos en paralelo
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(db.put(`doc_${i}`, {
        index: i,
        name: `Document ${i}`
      }));
    }
    
    const results = await Promise.all(promises);
    runner.assertEqual(results.length, 10, 'Deben crearse 10 documentos');
    
    const allDocs = await db.getAll();
    runner.assertEqual(allDocs.length, 10, 'Deben existir 10 documentos');
    
    await db.close();
  });
  
  // ==================== PRUEBAS DE MÉTODOS ESPECIALES ====================
  
  await runner.test('stopSync detiene la sincronización', async () => {
    const db = new DB('test_stop_sync', {
      isRemote: true,
      couchUrl: 'http://test.com:5984',
      syncInterval: 5000
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    runner.assertNotNull(db.syncTimer, 'Timer debe existir inicialmente');
    
    db.stopSync();
    
    runner.assertEqual(db.syncTimer, null, 'Timer debe ser null después de detener');
    
    await db.close();
  });
  
  await runner.test('close limpia recursos correctamente', async () => {
    const db = new DB('test_close', { isRemote: false });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    runner.assert(db.initialized === true, 'DB debe estar inicializada');
    
    await db.close();
    
    runner.assertEqual(db.initialized, false, 'initialized debe ser false');
    runner.assertEqual(db.db, null, 'db debe ser null');
    
    // No hacer más operaciones después de cerrar
  });
  
  // ==================== RESUMEN ====================
  
  runner.summary();
}

// ==================== EJECUCIÓN ====================

export default runAllTests;

// Para ejecutar directamente (descomentar):
// runAllTests().catch(console.error);
