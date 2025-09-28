const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Compilando frontend TypeScript...');

try {
  // Compilar TypeScript
  execSync('npx tsc -p src/tsconfig.json', { stdio: 'inherit' });
  
  // Verificar que el archivo se generó
  const outputFile = path.join(__dirname, 'public', 'chat-client.js');
  if (fs.existsSync(outputFile)) {
    console.log('✅ Frontend compilado correctamente');
    console.log(`📁 Archivo generado: ${outputFile}`);
  } else {
    console.log('❌ No se generó el archivo JavaScript');
  }
  
} catch (error) {
  console.log('❌ Error compilando frontend:', error.message);
}

// Auto-eliminar este archivo
try {
  fs.unlinkSync(__filename);
  console.log('🗑️ Archivo de compilación eliminado');
} catch (error) {
  // Ignorar errores de eliminación
}
