#!/bin/bash

# ============================================
# SYNTRA - SCRIPT DE CONFIGURACIÓN AUTOMÁTICA
# ============================================

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para verificar comandos
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 no está instalado. Por favor, instálalo primero."
        exit 1
    fi
}

# Banner de bienvenida
echo -e "${BLUE}"
cat << "EOF"
   ____                  _                 
  / ___| _   _ _ __  _ __| |_ _ __ __ _ 
  \___ \| | | | '_ \| '__| __| '__/ _` |
   ___) | |_| | | | | |  | |_| | | (_| |
  |____/ \__, |_| |_|_|   \__|_|  \__,_|
         |___/                          
                                        
  🚀 Configuración Automática de Syntra
  
EOF
echo -e "${NC}"

print_status "Iniciando configuración de Syntra..."

# Verificar prerrequisitos
print_status "Verificando prerrequisitos..."

check_command "node"
check_command "npm"
check_command "docker"
check_command "docker-compose"
check_command "git"

# Verificar versiones
NODE_VERSION=$(node --version | cut -d'v' -f2)
if [ "$(printf '%s\n' "18.0.0" "$NODE_VERSION" | sort -V | head -n1)" != "18.0.0" ]; then
    print_error "Node.js version $NODE_VERSION es menor que 18.0.0. Por favor, actualiza Node.js."
    exit 1
fi

print_success "Prerrequisitos verificados ✓"

# Configurar variables de entorno
print_status "Configurando variables de entorno..."

if [ ! -f .env ]; then
    cp env.example .env
    print_success "Archivo .env creado desde plantilla"
else
    print_warning "Archivo .env ya existe, no se sobrescribirá"
fi

# Instalar dependencias
print_status "Instalando dependencias del proyecto..."

# Root dependencies
npm install

# Backend dependencies
print_status "Instalando dependencias del backend..."
cd backend && npm install && cd ..

# Frontend dependencies  
print_status "Instalando dependencias del frontend..."
cd frontend && npm install && cd ..

# Mobile dependencies
print_status "Instalando dependencias de la app móvil..."
cd mobile && npm install && cd ..

print_success "Dependencias instaladas ✓"

# Configurar Docker
print_status "Configurando servicios Docker..."

# Detener servicios existentes si están corriendo
docker-compose down 2>/dev/null || true

# Construir e iniciar servicios
docker-compose up -d --build

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 30

# Verificar que los servicios estén corriendo
if ! docker-compose ps | grep -q "Up"; then
    print_error "Algunos servicios Docker no están corriendo correctamente"
    docker-compose logs
    exit 1
fi

print_success "Servicios Docker iniciados ✓"

# Configurar base de datos
print_status "Configurando base de datos..."

# Esperar a que PostgreSQL esté listo
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -U syntra_user -d syntra; then
        break
    fi
    attempt=$((attempt + 1))
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "PostgreSQL no está respondiendo después de 60 segundos"
    exit 1
fi

# Ejecutar migraciones y seed
cd backend
npx prisma migrate dev --name init
npx prisma db seed
cd ..

print_success "Base de datos configurada ✓"

# Verificar que todo esté funcionando
print_status "Verificando configuración..."

# Verificar backend
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend está respondiendo ✓"
else
    print_warning "Backend no está respondiendo en el puerto 3001"
fi

# Crear archivos adicionales si no existen
print_status "Creando archivos de configuración adicionales..."

# .gitignore global si no existe
if [ ! -f .gitignore ]; then
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/

# Environment variables
.env
.env.local
.env.production
.env.staging

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Build outputs
dist/
build/
.next/
out/

# Database
*.sqlite
*.db

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Docker
.docker/

# Expo
.expo/
expo-env.d.ts

# Temporary files
tmp/
temp/
EOF
    print_success "Archivo .gitignore creado"
fi

# Crear script de inicio rápido
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Syntra..."
docker-compose up -d
echo "⏳ Esperando servicios..."
sleep 10
npm run dev &
echo "✅ Syntra está corriendo!"
echo "🌐 Frontend: http://localhost:3000"
echo "📱 Mobile: http://localhost:19006"  
echo "🔧 API: http://localhost:3001"
EOF
chmod +x start.sh

print_success "Script de inicio rápido creado (./start.sh)"

# Mostrar resumen final
echo
echo -e "${GREEN}============================================"
echo -e "✅ SYNTRA CONFIGURADO EXITOSAMENTE"
echo -e "============================================${NC}"
echo
echo -e "${BLUE}🌐 URLs disponibles:${NC}"
echo "   Frontend:  http://localhost:3000"
echo "   Mobile:    http://localhost:19006"
echo "   API:       http://localhost:3001"
echo "   Database:  localhost:5432"
echo
echo -e "${BLUE}👤 Usuarios de prueba:${NC}"
echo "   Organizador: admin@syntra.com / admin123"
echo "   Asistente:   user@syntra.com / user123"
echo
echo -e "${BLUE}🚀 Para iniciar el desarrollo:${NC}"
echo "   npm run dev:all"
echo
echo -e "${BLUE}📱 Para la app móvil:${NC}"
echo "   cd mobile && npm run ios     # iOS Simulator"
echo "   cd mobile && npm run android # Android Emulator"
echo "   cd mobile && npm run web     # Web Browser"
echo
echo -e "${BLUE}🐳 Comandos Docker útiles:${NC}"
echo "   npm run docker:up    # Iniciar servicios"
echo "   npm run docker:down  # Detener servicios"
echo "   docker-compose logs  # Ver logs"
echo
echo -e "${BLUE}📚 Documentación:${NC}"
echo "   docs/QUICK_START.md  # Guía de inicio rápido"
echo "   docs/NFC_GUIDE.md    # Guía completa de NFC"
echo
echo -e "${YELLOW}⚠️  Recuerda:${NC}"
echo "   - Configurar variables de entorno en .env"
echo "   - Habilitar NFC en dispositivos físicos"
echo "   - Usar HTTPS en producción"
echo
echo -e "${GREEN}¡Listo para crear experiencias de eventos inolvidables! 🎉${NC}"
