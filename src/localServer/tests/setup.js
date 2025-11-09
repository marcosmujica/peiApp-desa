// Configuración de setup para tests
require('dotenv').config({ path: '.env.test' });

// Mock console.log en tests para evitar spam
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
}

// Variables globales para tests
global.TEST_TIMEOUT = 5000;