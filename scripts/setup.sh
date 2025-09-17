#!/bin/bash

# ============================================
# SYNTRA - SCRIPT DE CONFIGURACIÓN SERVERLESS
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
        return 1
    fi
    return 0
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
                                        
  🚀 Configuración Serverless de Syntra
  
EOF
echo -e "${NC}"

print_status "Iniciando configuración serverless de Syntra..."

# Verificar prerrequisitos
print_status "Verificando prerrequisitos..."

check_command "node" || exit 1
check_command "npm" || exit 1
check_command "git" || exit 1

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
    print_warning "IMPORTANTE: Configura tu MongoDB Atlas URI en .env"
    echo -e "${BLUE}   1. Crea cuenta en https://mongodb.com/atlas${NC}"
    echo -e "${BLUE}   2. Crea cluster gratuito (M0)${NC}"
    echo -e "${BLUE}   3. Crea usuario de base de datos${NC}"
    echo -e "${BLUE}   4. Configura network access (0.0.0.0/0)${NC}"
    echo -e "${BLUE}   5. Copia connection string a MONGODB_URI en .env${NC}"
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

# Instalar herramientas de desarrollo
print_status "Instalando herramientas de desarrollo..."

# Instalar Vercel CLI si no existe
if ! check_command "vercel"; then
    print_status "Instalando Vercel CLI..."
    npm install -g vercel
    print_success "Vercel CLI instalado ✓"
else
    print_success "Vercel CLI ya está disponible ✓"
fi

# Verificar conexión a MongoDB Atlas (si está configurado)
print_status "Verificando configuración de MongoDB Atlas..."

if grep -q "mongodb+srv://" .env; then
    print_status "Probando conexión a MongoDB Atlas..."
    cd backend
    if npm run db:connect; then
        print_success "Conexión a MongoDB Atlas exitosa ✓"
    else
        print_warning "No se pudo conectar a MongoDB Atlas. Verifica tu MONGODB_URI en .env"
    fi
    cd ..
else
    print_warning "MongoDB Atlas URI no configurado en .env"
    print_status "Configura MONGODB_URI después de crear tu cluster en MongoDB Atlas"
fi

# Crear script de inicio rápido
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Syntra (Modo Serverless)..."
echo "⏳ Iniciando servicios de desarrollo..."
npm run dev &
echo "✅ Syntra está corriendo!"
echo "🌐 Frontend: http://localhost:3000"
echo "📱 Mobile: http://localhost:19006"  
echo "🔧 API: http://localhost:3001"
echo "🍃 Database: MongoDB Atlas (Cloud)"
EOF
chmod +x start.sh

print_success "Script de inicio rápido creado (./start.sh)"

# Mostrar resumen final
echo
echo -e "${GREEN}============================================"
echo -e "✅ SYNTRA CONFIGURADO EXITOSAMENTE"
echo -e "============================================${NC}"
echo
echo -e "${BLUE}🌐 URLs de desarrollo:${NC}"
echo "   Frontend:  http://localhost:3000"
echo "   Mobile:    http://localhost:19006"
echo "   API:       http://localhost:3001"
echo "   Database:  MongoDB Atlas (Cloud)"
echo
echo -e "${BLUE}☁️ Infraestructura:${NC}"
echo "   Database:  MongoDB Atlas (Serverless)"
echo "   Hosting:   Vercel (Edge Functions)"
echo "   Storage:   Vercel Blob (Opcional)"
echo
echo -e "${BLUE}🚀 Para iniciar desarrollo:${NC}"
echo "   npm run dev"
echo
echo -e "${BLUE}☁️ Para deploy a producción:${NC}"
echo "   vercel --prod"
echo
echo -e "${BLUE}📱 Para la app móvil:${NC}"
echo "   cd mobile && npm run ios     # iOS Simulator"
echo "   cd mobile && npm run android # Android Emulator"
echo "   cd mobile && npm run web     # Web Browser"
echo
echo -e "${BLUE}🧪 Para ejecutar tests:${NC}"
echo "   npm run test"
echo "   npm run test:coverage"
echo
echo -e "${BLUE}📚 Documentación:${NC}"
echo "   README.md            # Guía completa"
echo "   docs/QUICK_START.md  # Inicio rápido"
echo "   docs/NFC_GUIDE.md    # Guía de NFC"
echo
echo -e "${YELLOW}⚠️  Próximos pasos:${NC}"
echo "   1. Configurar MongoDB Atlas URI en .env"
echo "   2. Ejecutar: npm run dev"
echo "   3. Abrir http://localhost:3000"
echo "   4. Para producción: vercel --prod"
echo
echo -e "${YELLOW}💡 Beneficios del stack serverless:${NC}"
echo "   ✅ Escalabilidad automática"
echo "   ✅ Costos optimizados (pay-as-you-scale)"
echo "   ✅ Deploy global en segundos"
echo "   ✅ Backup automático"
echo "   ✅ Zero DevOps"
echo
echo -e "${GREEN}¡Listo para crear experiencias de eventos inolvidables! 🎉${NC}"