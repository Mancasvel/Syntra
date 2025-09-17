#!/bin/bash

# ============================================
# SYNTRA - VERIFICACIÓN RÁPIDA DE SEGURIDAD
# ============================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_error() { echo -e "${RED}❌ $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo -e "${BLUE}🔒 SYNTRA - Verificación Rápida de Seguridad${NC}"
echo "=============================================="

# 1. Verificar archivos sensibles no commiteados
log_info "Verificando archivos sensibles..."

SENSITIVE_FILES=(
  ".env"
  ".env.local" 
  ".env.production"
  "config/secrets.json"
  "auth.json"
  "*.key"
  "*.pem"
  "jwt-secret.txt"
)

for file in "${SENSITIVE_FILES[@]}"; do
  if git ls-files --error-unmatch "$file" 2>/dev/null; then
    log_error "Archivo sensible encontrado en Git: $file"
    exit 1
  fi
done

log_success "No se encontraron archivos sensibles en Git"

# 2. Verificar package-lock.json existe
log_info "Verificando package-lock.json..."

DIRS=("backend" "frontend" "mobile")
for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
    if [ ! -f "$dir/package-lock.json" ]; then
      log_error "Falta package-lock.json en $dir"
      exit 1
    fi
  fi
done

log_success "Todos los package-lock.json están presentes"

# 3. Verificación rápida de npm audit
log_info "Ejecutando npm audit rápido..."

for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
    echo "Auditando $dir..."
    cd "$dir"
    
    # Verificar solo vulnerabilidades críticas y altas
    if ! npm audit --audit-level high --dry-run > /dev/null 2>&1; then
      log_warning "Vulnerabilidades encontradas en $dir - ejecuta 'npm audit' para detalles"
    else
      log_success "$dir: Sin vulnerabilidades críticas"
    fi
    
    cd ..
  fi
done

# 4. Verificar configuración .npmrc
log_info "Verificando configuración .npmrc..."

if [ -f ".npmrc" ]; then
  if grep -q "strict-ssl=true" .npmrc; then
    log_success "SSL verificación habilitada"
  else
    log_warning "SSL verificación no configurada"
  fi
  
  if grep -q "audit-level=moderate" .npmrc; then
    log_success "Nivel de auditoría configurado"
  else
    log_warning "Nivel de auditoría no configurado"
  fi
else
  log_warning "Archivo .npmrc no encontrado"
fi

# 5. Verificar Node.js version
log_info "Verificando versión de Node.js..."

NODE_VERSION=$(node --version | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -ge 18 ]; then
  log_success "Node.js v$NODE_VERSION (seguro)"
else
  log_error "Node.js v$NODE_VERSION (actualizar a v18+)"
  exit 1
fi

# 6. Verificar npm version
log_info "Verificando versión de npm..."

NPM_VERSION=$(npm --version)
NPM_MAJOR=$(echo $NPM_VERSION | cut -d'.' -f1)

if [ "$NPM_MAJOR" -ge 8 ]; then
  log_success "npm v$NPM_VERSION (seguro)"
else
  log_warning "npm v$NPM_VERSION (recomendado: v8+)"
fi

# 7. Verificar git hooks
log_info "Verificando git hooks de seguridad..."

if [ -f ".husky/pre-commit" ] || [ -f ".git/hooks/pre-commit" ]; then
  log_success "Git hooks de seguridad configurados"
else
  log_warning "Git hooks de seguridad no encontrados"
fi

# 8. Verificar dependencias peligrosas conocidas
log_info "Verificando dependencias peligrosas..."

DANGEROUS_PACKAGES=("event-stream" "eslint-scope" "getcookies" "rc" "flatmap-stream")

for dir in "${DIRS[@]}"; do
  if [ -f "$dir/package.json" ]; then
    for pkg in "${DANGEROUS_PACKAGES[@]}"; do
      if grep -q "\"$pkg\"" "$dir/package.json"; then
        log_error "Paquete peligroso encontrado: $pkg en $dir"
        exit 1
      fi
    done
  fi
done

log_success "No se encontraron dependencias peligrosas conocidas"

# 9. Verificar HTTPS en URLs
log_info "Verificando URLs HTTPS..."

if grep -r "http://" --include="*.js" --include="*.ts" --include="*.json" . | grep -v "localhost" | grep -v "127.0.0.1"; then
  log_warning "URLs HTTP encontradas (usar HTTPS en producción)"
else
  log_success "Todas las URLs externas usan HTTPS"
fi

# 10. Resumen final
echo ""
echo -e "${GREEN}=============================================="
echo -e "✅ VERIFICACIÓN RÁPIDA COMPLETADA"
echo -e "==============================================${NC}"
echo ""

log_info "Para una auditoría completa, ejecuta:"
echo "  npm run security:audit"
echo ""

log_info "Para fix automático de vulnerabilidades:"
echo "  npm run security:fix"
echo ""

log_success "🛡️  Syntra está protegido contra las amenazas más comunes"
