import express from 'express';

const app = express();
const PORT = 5000;

// Configuración de CouchDB
const COUCH_URL = "http://34.39.168.70:5984";
const COUCH_USER = "admin_X9!fQz7#Lp4Rt8$Mh2";
const COUCH_PASS = "G@7hX!2$kP9^mQ4&rZ6*Ty1wVb";
const AUTH_HEADER = "Basic " + Buffer.from(`${COUCH_USER}:${COUCH_PASS}`).toString("base64");
const PROFILE_DB = "profile";

/**
 * Obtiene el token de notificación de un usuario desde CouchDB
 * @param {string} idUser - ID del usuario
 * @returns {Promise<string|null>} El token de notificación o null si no se encuentra
 */
async function getNotificationToken(idUser) {
  try {
    const url = `${COUCH_URL}/${PROFILE_DB}/${idUser}`;
    console.log (url)
    console.log(`🔍 Buscando token para usuario: ${idUser}`);
    
    const response = await fetch(url, {
      headers: {
        Authorization: AUTH_HEADER,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Usuario no encontrado: ${idUser}`);
      return null;
    }
    const profile = await response.json();
    const token = profile.data.notificationToken;
    
    if (!token) {
      console.warn(`⚠️ Usuario ${idUser} no tiene notificationToken`);
      return null;
    }

    console.log(`✅ Token encontrado para ${idUser}`);
    return token;
  } catch (error) {
    console.error(`❌ Error obteniendo token para ${idUser}:`, error);
    return null;
  }
}

/**
 * Envía una notificación push usando Expo Push Notifications
 * @param {string} token - El Expo Push Token del dispositivo
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo del mensaje
 * @param {object} data - Datos adicionales (opcional)
 * @returns {Promise<object>} Respuesta de Expo
 */
async function sendPushNotification(token, title, body, data = {}) {
  const message = {
    to: token,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('✅ Notificación enviada:', result);
    return result;
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    throw error;
  }
}

/**
 * GET /api/notification/send
 * Endpoint para enviar notificaciones push
 * 
 * Query params:
 * - to: idUser del destinatario (se busca su token en CouchDB)
 * - title: Título de la notificación
 * - body: Mensaje de la notificación
 * - data: JSON string con datos adicionales (opcional)
 */
app.get('/send', async (req, res) => {
  try {
    const { to, title, body, data } = req.query;

    // Validar que se proporcionen los campos requeridos
    if (!to || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren los parámetros'
      });
    }

    // Obtener el token de notificación del usuario desde CouchDB
    const token = await getNotificationToken(to);
    
    if (!token) {
      return res.status(404).json({
        success: false,
        error: `No se encontró token de notificación para el usuario: ${to}`
      });
    }

    // Parsear data si viene como string JSON
    let parsedData = {};
    if (data) {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        parsedData = { data };
      }
    }

    // Enviar la notificación
    const result = await sendPushNotification(token, title, body, parsedData);

    res.json({
      success: true,
      to: to,
      result: result
    });

  } catch (error) {
    console.error('Error en /send:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de notificaciones escuchando en http://localhost:${PORT}`);
  console.log(`📱 Endpoints disponibles:`);
  console.log(`   - GET http://localhost:${PORT}/api/notification/test?token=xxx`);
  console.log(`   - GET http://localhost:${PORT}/api/notification/send?token=xxx&title=xxx&body=xxx`);
  console.log(`   - GET http://localhost:${PORT}/api/notification/send-multiple?tokens=[...]&title=xxx&body=xxx`);
});
