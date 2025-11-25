import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = 5985;

// Configuración de CouchDB
const COUCH_URL = "http://localhost:5984";
const COUCH_USER = "admin_X9!fQz7#Lp4Rt8$Mh2";
const COUCH_PASS = "G@7hX!2$kP9^mQ4&rZ6*Ty1wVb";
const AUTH_HEADER = "Basic " + Buffer.from(`${COUCH_USER}:${COUCH_PASS}`).toString("base64");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de autenticación para el gateway
const GATEWAY_USER = "app_user";
const GATEWAY_PASS = "app_password_2024";

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  try {
    const [type, credentials] = authHeader.split(' ');
    if (type !== 'Basic') {
      return res.status(401).json({ error: 'Tipo de autenticación no soportado' });
    }

    const decoded = Buffer.from(credentials, 'base64').toString('utf-8');
    const [user, pass] = decoded.split(':');

    if (user !== GATEWAY_USER || pass !== GATEWAY_PASS) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Error en autenticación' });
  }
}

// Aplicar autenticación a todas las rutas
app.use(authenticate);

// Middleware para bloquear DELETE
app.use((req, res, next) => {
  if (req.method === 'DELETE') {
    return res.status(403).json({ error: 'Método DELETE no permitido' });
  }
  next();
});

/**
 * GET /:db/:docId
 * Obtener un documento específico
 */
app.get('/:db/:docId', async (req, res) => {
  try {
    const { db, docId } = req.params;
    const url = `${COUCH_URL}/${db}/${docId}`;
    
    console.log(`📥 GET /${db}/${docId}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error en GET /:db/:docId', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PUT /:db/:docId
 * Crear o actualizar un documento con ID específico
 */
app.put('/:db/:docId', async (req, res) => {
  try {
    const { db, docId } = req.params;
    const url = `${COUCH_URL}/${db}/${docId}`;
    
    console.log(`📤 PUT /${db}/${docId}`, req.body);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error en PUT /:db/:docId', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

 /* POST /:db/_find
 * Buscar documentos usando Mango query
 */
app.post('/:db/_find', async (req, res) => {
  try {
    const { db } = req.params;
	  console.log (db);
    const url = `${COUCH_URL}/${db}/_find`;
    
    console.log(`📤 POST /${db}/_find`, req.body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error en POST /:db/_find', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /:db/_changes
 * Obtener cambios de una base de datos
 */
app.get('/:db/_changes', async (req, res) => {
  try {
    const { db } = req.params;
	  console.log (db);
    const queryString = new URLSearchParams(req.query).toString();
    const url = `${COUCH_URL}/${db}/_changes${queryString ? '?' + queryString : ''}`;
    
    console.log(`📥 GET /${db}/_changes`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error en GET /:db/_changes', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /:db/_changes
 * Obtener cambios de una base de datos con filtros en el body
 */
app.post('/:db/_changes', async (req, res) => {
  try {
    const { db } = req.params;
    console.log(db);
    const queryString = new URLSearchParams(req.query).toString();
    const url = `${COUCH_URL}/${db}/_changes${queryString ? '?' + queryString : ''}`;
    
    console.log(`📤 POST /${db}/_changes`, req.body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error en POST /:db/_changes', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /:db/_index
 * Crear un índice
 */
app.post('/:db/_index', async (req, res) => {
  try {
    const { db } = req.params;
    const url = `${COUCH_URL}/${db}/_index`;
    
    console.log(`📤 POST /${db}/_index`, req.body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error en POST /:db/_index', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 CouchDB Gateway escuchando en http://localhost:${PORT}`);
  console.log(`📊 CouchDB backend: ${COUCH_URL}`);
  console.log(`🔐 Autenticación requerida: ${GATEWAY_USER}:${GATEWAY_PASS}`);
  console.log(`🚫 DELETE bloqueado`);
  console.log(`\n📝 Ejemplo de uso:`);
  console.log(`   curl -u ${GATEWAY_USER}:${GATEWAY_PASS} http://localhost:${PORT}/mydb/doc123`);
});
