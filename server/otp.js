// server.js
// Controlador OTP con Express, Redis (opcional), Twilio (opcional), bcrypt y JWT.
// Recomendado para producción: usar Redis (o similar) para almacenar OTPs con TTL.
// Si no tienes Redis, el ejemplo cae a un store en memoria (no recomendado para prod).

//import dotenv from 'dotenv';
//dotenv.config();
import express from 'express';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import cors from "cors";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import twilio from 'twilio';

const app = express();

// Primero configurar parsers de body ANTES de rate limiters
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//# Twilio (opcional)
const TWILIO_ACCOUNT_SID="your_sid"
const TWILIO_AUTH_TOKEN="your_auth_token"
const TWILIO_FROM_NUMBER="+1xxxxxxx"

// Config
const OTP_TTL_SECONDS = '180'; // 3 minutos
const OTP_DIGITS = '4';
const OTP_MAX_ATTEMPTS = '3';
const REDIS_URL =  null;
const JWT_SECRET = 'cambiame_por_una_secreta_muy_fuerte';
const PORT =  3200;

// Inicializar Redis (si existe REDIS_URL), si no usar store en memoria
let redis = null;
if (REDIS_URL) {
  redis = new Redis(REDIS_URL);
  redis.on('error', (err) => console.error('Redis error:', err));
  console.log('✅ Usando Redis en', REDIS_URL);
} else {
  console.log('ℹ️  Usando almacenamiento en memoria (se reinicia al reiniciar el servidor).');
  console.log('ℹ️  Para múltiples instancias o persistencia, configurar REDIS_URL.');
}

// Twilio (opcional)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Rate limiters
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 120 // peticiones por IP por minuto
});
app.use(globalLimiter);

const perPhoneLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  keyGenerator: (req, res) => {
    // identificar por phone si existe
    if (req.body && req.body.phone) {
      return `phone:${req.body.phone}`;
    }
    // Si no hay phone, usar undefined para que use el comportamiento por defecto
    return undefined;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({ error: 'Límite de solicitudes alcanzado para este número. Intente más tarde.' });
  }
});

// Simple in-memory store fallback (dev only)
const memoryStore = new Map();

// Helpers
function generateOtp(digits = OTP_DIGITS) {
  // genera OTP numerico criptográfico
  const max = 10 ** digits;
  const min = Math.floor(max / 10);
  const num = Math.floor(Math.random() * (max - min)) + min;
  return String(num).padStart(digits, '0');
}

async function storeOtp(requestId, payload) {
  const key = `otp:${requestId}`;
  const value = JSON.stringify(payload);
  if (redis) {
    await redis.set(key, value, 'EX', OTP_TTL_SECONDS);
  } else {
    memoryStore.set(key, { value, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000 });
  }
}

async function getOtp(requestId) {
  const key = `otp:${requestId}`;
  if (redis) {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } else {
    const rec = memoryStore.get(key);
    if (!rec) return null;
    if (Date.now() > rec.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return JSON.parse(rec.value);
  }
}

async function delOtp(requestId) {
  const key = `otp:${requestId}`;
  if (redis) {
    await redis.del(key);
  } else {
    memoryStore.delete(key);
  }
}

// Limpiar memoria periódicamente (solo si usamos memoryStore)
if (!redis) {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memoryStore.entries()) {
      if (v.expiresAt < now) memoryStore.delete(k);
    }
  }, 60 * 1000);
}

// Envío de SMS (si twilio configurado) o fallback log
async function sendSms(to, body) {
  if (twilioClient && process.env.TWILIO_FROM_NUMBER) {
    return twilioClient.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER,
      to
    });
  } else {
    console.log(`[SMS SIMULADO] -> ${to}: ${body}`);
    return Promise.resolve({ sid: 'simulated' });
  }
}

// -------------------
// Rutas
// -------------------

/**
 * POST /api/otp/request
 * body: { phone: string, intent?: 'login'|'signup'|... }
 * Respuesta: { requestId }
 */
app.post('/otp', perPhoneLimiter, async (req, res) => {
  try {
    const { phone, intent = 'login' } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone es requerido' });

    // Generar requestId y OTP
    const requestId = uuidv4();
    const otpPlain = generateOtp();
    // Hashear OTP con bcrypt
    const saltRounds = 10;
    const otpHash = await bcrypt.hash(otpPlain, saltRounds);

    // Guardar en store: otpHash, phone, createdAt, attempts, intent
    const payload = {
      otpHash,
      phone,
      intent,
      attempts: 0,
      createdAt: Date.now()
    };
    await storeOtp(requestId, payload);

    // Formato del SMS: si usás WebOTP o SMS Retriever necesitás incluir dominio/hash.
    // Mensaje ejemplo para WebOTP: "<#> Tu código ExampleApp: 123456\n@example.com #ABCDEFG"
    // Aquí incluimos un mensaje simple. Para WebOTP, adaptá con el dominio y app-hash.
    const smsBody = `Tu código de peiApp es: ${otpPlain}. No lo compartas. Válido ${OTP_TTL_SECONDS/60} min.`;

    // Enviar SMS (o log)
    await sendSms(phone, smsBody);

    // Responder solo con requestId
    return res.json({ requestId });
  } catch (err) {
    console.error('Error en /api/otp/request', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * POST /validate
 * body: { requestId: string, code: string }
 * Respuesta: { token } (JWT u otro session token)
 */
app.post('/validate', async (req, res) => {
  try {
    console.log('📥 POST /validate recibido');
    console.log('Body:', req.body);
    
    const { requestId, code } = req.body;
    
    console.log('requestId:', requestId);
    console.log('code:', code);
    
    if (!requestId || !code) {
      console.log('❌ Faltan parámetros requeridos');
      return res.status(400).json({ error: 'requestId y code son requeridos' });
    }

    const rec = await getOtp(requestId);
    console.log('🔍 Registro encontrado:', rec ? 'Sí' : 'No');
    
    if (!rec) {
      // No existe o expiró
      console.log('❌ Código no encontrado o expirado');
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Verificar límite de intentos
    console.log('🔢 Intentos actuales:', rec.attempts);
    if (rec.attempts >= OTP_MAX_ATTEMPTS) {
      // opcional: eliminar registro y bloquear por X tiempo (implementar clave de bloqueo en redis)
      await delOtp(requestId);
      console.log('❌ Límite de intentos alcanzado');
      return res.status(429).json({ error: 'Límite de intentos alcanzado' });
    }

    // Comparar hash
    console.log('🔐 Comparando código:', code);
    console.log('🔐 Hash almacenado:', rec.otpHash);
    const ok = await bcrypt.compare(String(code), rec.otpHash);
    console.log('🔐 Resultado comparación:', ok);
    
    if (!ok) {
      // incrementar contador de intentos
      rec.attempts = (rec.attempts || 0) + 1;
      // volver a guardar (sin extender TTL)
      await storeOtp(requestId, rec);
      console.log('❌ Código incorrecto, intentos:', rec.attempts);
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Si OK -> invalidar OTP y emitir token de sesión (ejemplo JWT corto)
    console.log('✅ Código validado correctamente');
    await delOtp(requestId);

    const tokenPayload = {
      sub: rec.phone,
      intent: rec.intent,
      iat: Math.floor(Date.now() / 1000)
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

    // Responder con token
    return res.json({ token });
  } catch (err) {
    console.error('Error en /api/otp/validate', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * POST /api/otp/resend
 * body: { requestId, phone }
 * Reenvía el código (genera nuevo OTP o reenvía el mismo según política)
 */
app.post('/api/otp/resend', perPhoneLimiter, async (req, res) => {
  try {
    const { requestId, phone } = req.body;
    if (!requestId || !phone) return res.status(400).json({ error: 'requestId y phone son requeridos' });

    const rec = await getOtp(requestId);
    if (!rec) return res.status(400).json({ error: 'Solicitud no encontrada o expirada' });

    // Política: generamos un nuevo OTP y reemplazamos hash
    const newOtp = generateOtp();
    rec.otpHash = await bcrypt.hash(newOtp, 10);
    rec.attempts = 0;
    await storeOtp(requestId, rec); // reescribe con nuevo TTL

    const smsBody = `Tu nuevo código de peiApp es: ${newOtp}. Válido ${OTP_TTL_SECONDS/60} min.`;
    await sendSms(phone, smsBody);

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/otp/resend', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Start
app.listen(PORT, () => {
  console.log(`OTP server listening on port ${PORT}`);
});
