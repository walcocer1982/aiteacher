# 🚀 Pasos Manuales para hacer PR a GitHub

## 📋 **Ejecutar estos comandos uno por uno:**

### **1. Abrir terminal en la carpeta del proyecto**
```bash
cd C:\Users\LEGION\projets\aiteacher
```

### **2. Inicializar Git**
```bash
git init
```

### **3. Agregar todos los archivos**
```bash
git add .
```

### **4. Hacer commit inicial**
```bash
git commit -m "feat: Sistema Docente IA con arquitectura multiagente

- ✅ Backend Express.js con TypeScript
- ✅ Frontend con HTML/CSS/JS y Tailwind CSS  
- ✅ Multiagentes: Planner, Tutor, Verifier, Socratic, HelpDesk
- ✅ Integración OpenAI API
- ✅ Sistema lecciones y sesiones
- ✅ Interfaz web completa
- ✅ Esquemas JSON corregidos
- ✅ Documentación completa"
```

### **5. Configurar repositorio remoto**
```bash
git remote add origin https://github.com/walcocer1982/aiteacher.git
```

### **6. Verificar configuración**
```bash
git remote -v
```

### **7. Subir código**
```bash
git branch -M main
git push -u origin main
```

## 🔧 **Si hay problemas de autenticación:**

### **Opción A: Usar token de acceso personal**
1. Ir a GitHub → Settings → Developer settings → Personal access tokens
2. Generar nuevo token con permisos de repositorio
3. Usar el token como contraseña al hacer push

### **Opción B: Configurar SSH**
```bash
# Generar clave SSH
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"

# Agregar clave a ssh-agent
ssh-add ~/.ssh/id_ed25519

# Copiar clave pública
cat ~/.ssh/id_ed25519.pub

# Agregar la clave a GitHub → Settings → SSH and GPG keys
```

## 🎯 **Resultado esperado:**

Después de ejecutar estos comandos:
- ✅ Código subido a GitHub
- ✅ Repositorio con estructura completa
- ✅ Listo para Pull Requests
- ✅ Documentación incluida

## 📁 **Estructura que se subirá:**

```
aiteacher/
├── backend/                    # Servidor Express + multiagentes
│   ├── src/
│   │   ├── agents/            # 5 agentes especializados
│   │   ├── api/               # Controladores y servicios
│   │   ├── core/             # Modelos y LLM
│   │   └── infrastructure/   # Repositorios
│   ├── server.ts              # Servidor principal
│   └── tsconfig.json          # Configuración TypeScript
├── frontend/                  # Interfaz web
│   ├── public/
│   │   ├── index.html         # Interfaz principal
│   │   └── main.js            # Cliente JavaScript
│   └── src/
│       └── chat-client.ts     # Cliente TypeScript
├── data/                      # Lecciones de ejemplo
│   └── lessons/
├── package.json               # Dependencias
├── tsconfig.json              # Configuración principal
├── README.md                  # Documentación
├── .gitignore                # Archivos excluidos
└── [archivos de documentación]
```

## 🚀 **Scripts automáticos disponibles:**

### **Windows:**
```bash
# Ejecutar el script automático
setup_git.bat
```

### **Linux/Mac:**
```bash
# Hacer ejecutable y ejecutar
chmod +x setup_git.sh
./setup_git.sh
```

## 🎊 **Después del push:**

1. **Verificar en GitHub**: https://github.com/walcocer1982/aiteacher
2. **El repositorio tendrá**:
   - ✅ Código completo del proyecto
   - ✅ Documentación incluida
   - ✅ Estructura organizada
   - ✅ Listo para colaboración

**¡Ejecuta los comandos paso a paso para subir el proyecto!** 🚀
