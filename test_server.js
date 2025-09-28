const http = require('http');

console.log('🧪 Probando servidor...');

// Test básico del servidor
const req = http.get('http://localhost:3000/api', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Respuesta del servidor:', res.statusCode);
    console.log('📄 Datos:', data);
    
    // Limpiar archivo
    setTimeout(() => {
      try {
        require('fs').unlinkSync(__filename);
      } catch (e) {}
    }, 1000);
  });
});

req.on('error', (error) => {
  console.log('❌ Error:', error.message);
  console.log('💡 Asegúrate de que el servidor esté ejecutándose con: npm run dev');
  
  // Limpiar archivo
  setTimeout(() => {
    try {
      require('fs').unlinkSync(__filename);
    } catch (e) {}
  }, 1000);
});

req.setTimeout(5000, () => {
  console.log('⏰ Timeout - El servidor no responde');
  req.destroy();
});
