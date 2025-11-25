import express from "express";
import { WebSocketServer } from "ws";

const COUCH_URL = "http://34.39.168.70:5984"; // ajustá usuario/clave
const NOTIFICATION_URL = "http://localhost:5000/send"; // ajustá usuario/clave
const SOURCE="ws"

const DBS = ["ticket_chat", "ticket", "ticket_log_status"]; // bases que querés escuchar

// Extraer credenciales (si están embebidas) y construir COUCH_BASE y Authorization header
let COUCH_BASE = COUCH_URL;
let AUTH_HEADER = null;
try {
  const parsed = new URL(COUCH_URL);
  const user = "admin_X9!fQz7#Lp4Rt8$Mh2"
  const pass = "G@7hX!2$kP9^mQ4&rZ6*Ty1wVb"
  AUTH_HEADER = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  COUCH_BASE = parsed.toString().replace(/\/$/, "");
  console.log(`🔐 Usando autenticación por header (Basic). Host: ${parsed.host}`);
  } catch (e) {
  // si falla el parseo, dejar COUCH_BASE como COUCH_URL
}

const app = express();
const PORT = 4000;

// Servidor WebSocket
const wss = new WebSocketServer({ noServer: true });
const clients = new Set();

// Manejo de conexiones WebSocket
wss.on("connection", (ws, req) => {
  // Extraer idUser de los query params de la URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const idUser = url.searchParams.get('idUser') || 'unknown';
  
  // Guardar idUser como propiedad del websocket
  ws.idUser = idUser;
  
  clients.add(ws);
  console.log(`📲 Cliente conectado (idUser: ${idUser}), total:`, clients.size);

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`❌ Cliente desconectado (idUser: ${ws.idUser}), total:`, clients.size);
  });
});

// Función para escuchar cambios en una base
async function watchDB(dbName) {
  let since = "now";
  console.log(`👀 Escuchando cambios en ${dbName}...`);

  while (true) {
    try {
      const url = `${COUCH_BASE}/${dbName}/_changes?feed=continuous&include_docs=true&heartbeat=5000&since=${since || "now"}`;
      console.log(`→ Conectando a changes: ${url} (since=${since})`);
      const fetchOptions = {};
      if (AUTH_HEADER) {
        fetchOptions.headers = { Authorization: AUTH_HEADER, Accept: 'application/json' };
        console.log(`→ Añadiendo header Authorization (Basic) a la petición`);
      }
      const res = await fetch(url, fetchOptions);
      console.log(`← Conexión establecida para ${dbName}: status=${res.status} ${res.statusText}`);
      if (!res.ok) throw new Error(`Error al conectar con ${dbName}: ${res.statusText}`);

      // Lee el stream de forma continua
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      console.log(`🔁 Iniciando lectura del stream para ${dbName}`);

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log(`✂️ Stream cerrado por servidor para ${dbName}`);
          break;
        }

        const chunkText = decoder.decode(value, { stream: true });
        buffer += chunkText;
        //console.log(`📥 Chunk recibido (${chunkText.length} bytes). Buffer length: ${buffer.length}`);

        const lines = buffer.split("\n");
        buffer = lines.pop(); // guarda lo que no está completo

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const change = JSON.parse(line);
            console.log(`🔔 Cambio recibido en ${dbName}: seq=${change.seq} id=${change.id || (change.doc && change.doc._id)}`);
            since = change.seq; // actualiza secuencia
            const payload = { db: dbName, change };

            if (change.doc.data.idToUser =="") return
            
            /// OJO!!!! tomar en cuenta que si al enviar es vacio no seguir
            // Extraer idUserTo del documento (puede estar en change.doc.data.idUserTo o change.doc.idUserTo)
            let idUserTo = change.doc?.data?.idUserTo || change.doc?.idUserTo;
      	    let idUserToAux = idUserTo.replace(/\+/g, '')

            sendNotificaction (dbName, idUserToAux, change.doc)
            

            // Envía solo a los clientes cuyo idUser coincida con idUserTo
            let sent = 0;
            for (const client of clients) {
              if (client.readyState === 1) {
                // Filtrar: solo enviar si idUserTo coincide con el idUser del cliente
                if (idUserTo && client.idUser !== idUserTo) {
                  continue; // Saltar este cliente
                }
                
                try {
                  console.log(`📤 Enviando a cliente (idUser: ${client.idUser})`);
                  client.send(JSON.stringify(payload));

                  
                  
                  sent++;
                  break // mm - ya encontre al usuario, salgo
                } catch (e) {
                  console.warn(`⚠️ Error enviando a cliente: ${e.message}`);
                }
              }
            }
            console.log(`📤 Enviados a ${sent} clientes (idUserTo: ${idUserTo || 'N/A'})`);
          } catch (err) {
            console.warn("⚠️ Error procesando línea (JSON):", err.message || err);
            console.debug("Linea cruda:", line);
          }
        }
      }
    } catch (err) {
      console.error(`🚨 Error en watcher ${dbName}:`, err.message);
      console.log("⏳ Reintentando en 5s...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function sendNotificaction (dbName, idUserTo, doc)
{
  try{

    let title = ""
    let msg = ""
    if (dbName =="ticket_log_status" )
    {
      title = ""
      msg = doc.data.message
      let url = NOTIFICATION_URL + "?to=" + idUserTo + "&title=" + encodeURIComponent (title) + "&body=" + encodeURIComponent (msg)
      console.log (url)
      const res = await fetch(url);
    }


  }
  catch (e) {console.log ("Error en sendNotification", e)}
}
// Inicia un watcher por cada base
DBS.forEach((db) => watchDB(db));

// Servidor HTTP + WebSocket upgrade
const server = app.listen(PORT, () => console.log(`✅ Server escuchando en http://localhost:${PORT}`));
server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});
