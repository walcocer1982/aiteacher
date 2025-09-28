// bootstrap Express

import express from 'express';
import { createSession, handleEvent, getSession } from './backend/src/api/controllers/chat.controller';

// Cargar variables de entorno
try {
  require('dotenv').config();
  console.log('✅ dotenv cargado correctamente');
} catch (error) {
  console.log('⚠️  dotenv no disponible, cargando .env manualmente');
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach((line: string) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      });
      console.log('✅ Variables de entorno cargadas manualmente desde .env');
    } else {
      console.log('❌ Archivo .env no encontrado');
    }
  } catch (envError) {
    console.log('❌ Error cargando .env:', envError instanceof Error ? envError.message : 'Error desconocido');
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('frontend/public')); // Para servir archivos estáticos del frontend

// Endpoints según @información
// POST /chat/session → crea sesión
app.post('/chat/session', createSession);

// POST /chat/event → procesa turno del alumno
app.post('/chat/event', handleEvent);

// GET /chat/session/:id → estado
app.get('/chat/session/:id', getSession);

// Ruta para servir la interfaz web
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: './frontend/public' });
});

// Ruta API info
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Docente IA Monolítico (multagente)',
    endpoints: {
      'POST /chat/session': 'Crear sesión',
      'POST /chat/event': 'Procesar turno del alumno', 
      'GET /chat/session/:id': 'Obtener estado de sesión'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📚 Endpoints disponibles:`);
  console.log(`   POST /chat/session - Crear sesión`);
  console.log(`   POST /chat/event - Procesar turno`);
  console.log(`   GET /chat/session/:id - Estado de sesión`);
});
