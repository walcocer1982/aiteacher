// Servidor principal del backend

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createSession, handleEvent, getSession } from './src/api/controllers/chat.controller';

const app = express();
const PORT = process.env.PORT || 3000;

// Rutas del proyecto (usando process.cwd() como base)
const projectRoot = process.cwd();
const frontendPath = path.join(projectRoot, 'frontend', 'public');

// Middleware
app.use(express.json());
app.use(express.static(frontendPath)); // Para servir archivos estáticos del frontend

// Endpoints según @información
// POST /chat/session → crea sesión
app.post('/chat/session', createSession);

// POST /chat/event → procesa turno del alumno
app.post('/chat/event', handleEvent);

// GET /chat/session/:id → estado
app.get('/chat/session/:id', getSession);

// Ruta para servir la interfaz web
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: frontendPath });
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

// Middleware de manejo de errores
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error del servidor:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📚 Endpoints disponibles:`);
  console.log(`   POST /chat/session - Crear sesión`);
  console.log(`   POST /chat/event - Procesar turno`);
  console.log(`   GET /chat/session/:id - Estado de sesión`);
  console.log(`📁 Frontend path: ${frontendPath}`);
});
