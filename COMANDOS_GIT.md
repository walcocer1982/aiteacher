# 🚀 Comandos Git para subir el proyecto

## 📋 **Ejecutar estos comandos en orden:**

### **1. Inicializar Git**
```bash
git init
```

### **2. Agregar todos los archivos**
```bash
git add .
```

### **3. Hacer commit inicial**
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

### **4. Configurar repositorio remoto**
```bash
git remote add origin https://github.com/walcocer1982/aiteacher.git
```

### **5. Verificar configuración**
```bash
git remote -v
```

### **6. Subir código**
```bash
git branch -M main
git push -u origin main
```

## 🔧 **Si hay problemas de autenticación:**

### **Opción 1: Token de acceso personal**
1. Ir a GitHub → Settings → Developer settings → Personal access tokens
2. Generar nuevo token con permisos de repositorio
3. Usar el token como contraseña al hacer push

### **Opción 2: SSH (recomendado)**
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

**¡El proyecto estará disponible en https://github.com/walcocer1982/aiteacher!** 🚀
