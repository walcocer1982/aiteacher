@echo off
echo 🚀 Configurando Git para subir a GitHub...

echo.
echo 📋 Paso 1: Inicializando Git...
git init

echo.
echo 📋 Paso 2: Agregando archivos...
git add .

echo.
echo 📋 Paso 3: Haciendo commit inicial...
git commit -m "feat: Sistema Docente IA con arquitectura multiagente

- ✅ Backend Express.js con TypeScript
- ✅ Frontend con HTML/CSS/JS y Tailwind CSS  
- ✅ Multiagentes: Planner, Tutor, Verifier, Socratic, HelpDesk
- ✅ Integración OpenAI API
- ✅ Sistema lecciones y sesiones
- ✅ Interfaz web completa
- ✅ Esquemas JSON corregidos
- ✅ Documentación completa"

echo.
echo 📋 Paso 4: Configurando repositorio remoto...
git remote add origin https://github.com/walcocer1982/aiteacher.git

echo.
echo 📋 Paso 5: Verificando configuración...
git remote -v

echo.
echo 📋 Paso 6: Subiendo código...
git branch -M main
git push -u origin main

echo.
echo ✅ ¡Proyecto subido exitosamente a GitHub!
echo 🌐 Repositorio: https://github.com/walcocer1982/aiteacher
echo.
pause
