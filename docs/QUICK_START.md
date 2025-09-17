# 🚀 Syntra - Guía de Inicio Rápido

¡Bienvenido a Syntra! Esta guía te ayudará a poner en marcha la plataforma completa en menos de 10 minutos.

## 📋 Prerrequisitos

Antes de empezar, asegúrate de tener instalado:

- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **Docker & Docker Compose** - [Descargar aquí](https://www.docker.com/)
- **Git** - [Descargar aquí](https://git-scm.com/)

## 🛠️ Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/syntra.git
cd syntra
```

### 2. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar las variables necesarias (opcional para desarrollo)
nano .env
```

### 3. Instalar dependencias
```bash
# Instalar todas las dependencias del proyecto
npm run install:all
```

### 4. Iniciar servicios con Docker
```bash
# Iniciar base de datos y servicios
npm run docker:up

# Esperar a que los servicios estén listos (30 segundos aprox.)
```

### 5. Configurar base de datos
```bash
# Ejecutar migraciones y seed
npm run db:setup
```

### 6. Iniciar aplicación
```bash
# Iniciar todos los servicios en desarrollo
npm run dev:all
```

## 🌐 Acceder a la aplicación

Una vez iniciado, podrás acceder a:

- **🖥️ Dashboard Web**: http://localhost:3000
- **📱 App Móvil**: http://localhost:19006 (Expo)
- **🔧 API Backend**: http://localhost:3001
- **📊 Base de Datos**: localhost:5432 (PostgreSQL)
- **🗄️ Redis**: localhost:6379

## 👤 Usuarios de Prueba

El sistema incluye usuarios de prueba:

### Organizador
- **Email**: admin@syntra.com
- **Password**: admin123

### Asistente
- **Email**: user@syntra.com  
- **Password**: user123

## 📱 Configuración Móvil

### Para iOS (Simulator)
```bash
cd mobile
npm run ios
```

### Para Android (Emulator)
```bash
cd mobile
npm run android
```

### Para desarrollo web
```bash
cd mobile
npm run web
```

## 🔧 Configuración NFC

### Para testing en dispositivo físico:

1. **Habilitar NFC** en tu dispositivo Android/iOS
2. **Instalar Expo Go** desde la tienda de apps
3. **Escanear QR** mostrado en la terminal
4. **Permitir permisos** de NFC cuando se soliciten

### Tags NFC de prueba:

Puedes usar cualquier tag NFC vacío. La app puede escribir datos de prueba:

```json
{
  "userId": "user-123",
  "eventId": "event-456", 
  "deviceId": "device-789",
  "profile": {
    "name": "Juan Pérez",
    "company": "TechCorp",
    "interests": ["tecnología", "networking"]
  }
}
```

## 🎯 Primeros Pasos

### 1. Crear un evento
1. Accede al dashboard web como organizador
2. Ve a "Eventos" → "Crear Evento"
3. Completa la información básica
4. Activa "NFC" y "Gamificación"

### 2. Configurar productos NFC
1. Ve a "Productos" → "Añadir Producto"
2. Selecciona "Pulsera NFC"
3. Configura precios y personalización

### 3. Probar conexión NFC
1. Abre la app móvil
2. Registrate como asistente
3. Únete al evento
4. Usa "Conectar NFC" para probar

## 🐛 Solución de Problemas

### Error: "Puerto ya en uso"
```bash
# Liberar puertos
npm run docker:down
pkill -f "node.*3001"
pkill -f "node.*3000"
```

### Error: "Base de datos no conecta"
```bash
# Reiniciar servicios Docker
npm run docker:down
npm run docker:up
```

### Error: "NFC no funciona"
- Verifica que el dispositivo soporte NFC
- Habilita NFC en configuración
- Usa un dispositivo físico (no simulador)

### Error: "Dependencias faltantes"
```bash
# Limpiar e instalar de nuevo
rm -rf node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -rf mobile/node_modules
npm run install:all
```

## 📚 Próximos Pasos

Una vez que tengas todo funcionando:

1. **Lee la documentación completa**: `docs/README.md`
2. **Explora la API**: http://localhost:3001/docs
3. **Personaliza el branding**: `frontend/src/styles/`
4. **Configura integraciones**: Stripe, OpenAI, AWS
5. **Despliega en producción**: `docs/DEPLOYMENT.md`

## 🆘 Soporte

Si tienes problemas:

1. **Revisa los logs**: `docker-compose logs`
2. **Consulta la documentación**: `docs/`
3. **Abre un issue**: GitHub Issues
4. **Contacta al equipo**: hello@syntra.com

---

¡Ya estás listo para crear experiencias de eventos inolvidables con Syntra! 🎉

**Siguiente paso recomendado**: Lee `docs/NFC_GUIDE.md` para aprender a programar funcionalidades brutales en tus dispositivos NFC.
