import express from "express";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
// 
// Definir __filename y __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Allow CORS from any origin (adjust in production as needed)
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configuración de Multer para almacenamiento en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    // Allow up to 10MB files (PDFs can be larger than small images)
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && (file.mimetype.startsWith("image/") || file.mimetype.includes("/pdf"))) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes y pdf"), false);
    }
  },
});

// Crear directorio uploads si no existe
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Función para procesar y guardar imágenes
async function processAndSaveImage(buffer, filename, prefix, width) {
  // Ensure filename has an extension for images (default to .jpg)
  const ext = path.extname(filename) || '.jpg';
  const baseName = path.basename(filename, ext);
  const outName = baseName + ext; // keep provided extension if present
  const filepath = path.join(uploadsDir, prefix + "__" + outName);

  let pipeline = sharp(buffer);
  // Resize only when width is provided
  if (width && Number.isFinite(width)) {
    pipeline = pipeline.resize({ width: Number(width), withoutEnlargement: true });
  }

  // Convert/encode to JPEG for consistent web delivery
  await pipeline.jpeg({ quality: 80 }).toFile(filepath);

  return outName;
}

// Generic file saver (for PDFs or other binary files)
async function saveFile(buffer, filename, prefix) {
  const filepath = path.join(uploadsDir, prefix + "__" + filename);
  await fs.promises.writeFile(filepath, buffer);
  return filename;
}

// Ruta para subir imágenes
// Use upload.any() so we can handle varying client FormData shapes and fall back to the first file received
app.post("/upload", upload.any(), async (req, res) => {
  try {
    // Debug: log content-type and headers to help diagnose client issues
    try { console.log('Incoming upload content-type:', req.headers['content-type']); } catch(e){}
    try { console.log('Incoming upload headers:', Object.assign({}, req.headers)); } catch(e){}

    // Multer with upload.any() will populate req.files (array). Try to find file under fieldname 'file' or take the first.
    let incomingFile = null;
    if (req.file) incomingFile = req.file;
    else if (req.files && req.files.length > 0) {
      incomingFile = req.files.find(f => f.fieldname === 'file') || req.files[0];
    }

    // If no multipart file was sent, check for a base64 fallback in the body (fileBase64 + fileName + fileType)
    if (!incomingFile) {
      if (req.body && req.body.fileBase64) {
        try {
          const { idUser: bodyIdUser, fileName: bodyFileName, fileType: bodyFileType } = req.body;
          const b64 = req.body.fileBase64;
          const fileName = bodyFileName || `${bodyIdUser || 'unknown'}_${uuidv4()}`;
          const fileType = bodyFileType || 'application/octet-stream';
          const buffer = Buffer.from(b64, 'base64');
          incomingFile = { buffer, originalname: fileName, mimetype: fileType, size: buffer.length };
          console.log('Received file via base64 payload, name:', fileName, 'from idUser:', bodyIdUser);
        } catch (e) {
          console.error('Error decoding base64 file payload', e);
        }
      }
    }

    if (!incomingFile) {
      console.log("No se proporciono archivo (req.file y req.files vacíos)");
      return res.status(400).json({ error: "No se proporcionó ningún archivo" });
    }

    // Log incomingFile metadata for debugging
    try {
      console.log('IncomingFile keys:', Object.keys(incomingFile || {}));
      console.log('incomingFile.originalname:', incomingFile.originalname, 'mimetype:', incomingFile.mimetype, 'size:', incomingFile.size, 'path:', incomingFile.path ? incomingFile.path : null);
    } catch (e) { console.error('Error logging incomingFile metadata', e); }

    // If multer did not populate buffer (some clients/providers may yield a path or stream), try to read it
    if (!incomingFile.buffer) {
      try {
        if (incomingFile.path) {
          // disk storage: read file from path
          const buf = await fs.promises.readFile(incomingFile.path);
          incomingFile.buffer = buf;
          console.log('Read incomingFile.buffer from path, length:', buf.length);
        } else if (incomingFile.stream && typeof incomingFile.stream[Symbol.asyncIterator] === 'function') {
          // accumulate stream
          const chunks = [];
          for await (const chunk of incomingFile.stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          incomingFile.buffer = Buffer.concat(chunks);
          console.log('Collected incomingFile.buffer from stream, length:', incomingFile.buffer.length);
        } else {
          console.log('incomingFile has no buffer, path or readable stream');
        }
      } catch (e) {
        console.error('Error attempting to build incomingFile.buffer from path/stream:', e);
      }
    }

    const { idUser } = req.body;
    if (!idUser) {
      console.log("idUser es requerido");
      return res.status(400).json({ error: "idUser es requerido" });
    }

    const { isAvatar } = req.body;
    if (typeof isAvatar === 'undefined') {
      console.log("isAvatar no encontrado");
      return res.status(400).json({ error: "isAvatar no encontrado" });
    }

    const mime = incomingFile.mimetype || '';
    let filename = '';
    // Handle PDFs: save raw buffer as file
    if (mime.includes('/pdf')) {
      filename = `${idUser}_${uuidv4()}.pdf`;
      await saveFile(incomingFile.buffer, filename, 'normal');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.json({ status: true, filename, message: 'PDF guardado correctamente' });
    }

    // Handle images
    if (mime.startsWith('image/')) {
      if (isAvatar == 'true' || isAvatar === '1') {
        filename = `${idUser}.jpg`;
        await processAndSaveImage(incomingFile.buffer, filename, 'avatar', 50);
      } else {
        filename = `${idUser}_${uuidv4()}.jpg`;
        await processAndSaveImage(incomingFile.buffer, filename, 'small', 200);
      }
      await processAndSaveImage(incomingFile.buffer, filename, 'normal', 1080);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.json({ status: true, filename, message: 'Imágenes procesadas exitosamente' });
    }

    return res.status(400).json({ error: 'Tipo de archivo no soportado' });
  } catch (error) {
    console.error('Error procesando upload:', error);
    try {
      console.error('Request body:', {
        body: req.body,
        file: req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : null,
      });
    } catch (logErr) {
      console.error('Error while logging request details:', logErr);
    }
    res.status(500).json({ error: 'Error al procesar el archivo', details: String(error) });
  }
});

// Ruta para listar todas las imágenes de un usuario
app.get("/uploads/user/:idUser", (req, res) => {
  const { idUser } = req.params;

  try {
    const files = fs.readdirSync(uploadsDir);
    const userFiles = files.filter(
      (file) => file.includes(`_${idUser}.`) || file.includes(`_${idUser}.jpg`)
    );

    const fileUrls = userFiles.map((file) => ({
      filename: file,
      url: `/uploads/${file}`,
    }));

    res.json({ files: fileUrls });
  } catch (error) {
    res.status(404).json({ error: "No se encontraron archivos" });
  }
});

// Ruta para descargar una imagen específica
app.get("/uploads/:filename", (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(uploadsDir, filename);

  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ error: "Archivo no encontrado" });
  }
});

// Manejo de errores
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "El archivo es demasiado grande" });
    }
  }
  res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
  console.log(`Servidor de imágenes corriendo en http://localhost:${PORT}`);
});
