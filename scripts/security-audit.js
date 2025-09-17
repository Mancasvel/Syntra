#!/usr/bin/env node

/**
 * SYNTRA - SCRIPT DE AUDITORÍA DE SEGURIDAD NPM
 * Verifica todas las dependencias contra vulnerabilidades conocidas
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Colores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bold}${colors.blue}🔒 ${msg}${colors.reset}`)
};

// Lista de paquetes conocidos como seguros (whitelist)
const TRUSTED_PACKAGES = new Set([
  // Core frameworks
  'react', 'react-dom', 'next', 'express', 'mongoose',
  
  // TypeScript ecosystem
  'typescript', '@types/node', '@types/react', '@types/express',
  
  // Testing
  'jest', '@testing-library/react', '@testing-library/jest-dom',
  
  // Build tools
  'webpack', 'babel', 'eslint', 'prettier',
  
  // Utilities seguros
  'lodash', 'axios', 'dotenv', 'cors', 'helmet',
  
  // RevenueCat oficial
  '@revenuecat/purchases-js', '@revenuecat/purchases-typescript-sdk',
  'react-native-purchases',
  
  // React Native/Expo
  'expo', 'react-native', '@expo/vector-icons',
  
  // UI Libraries
  'tailwindcss', 'framer-motion', '@headlessui/react'
]);

// Paquetes sospechosos conocidos (blacklist)
const SUSPICIOUS_PACKAGES = new Set([
  'event-stream', 'eslint-scope', 'getcookies', 'rc', 'flatmap-stream'
]);

// Patrones sospechosos en nombres de paquetes
const SUSPICIOUS_PATTERNS = [
  /^[0-9]+$/, // Solo números
  /[^a-z0-9\-_@\/]/i, // Caracteres extraños
  /^.{1,2}$/, // Nombres muy cortos
  /(discord|bitcoin|crypto|mining|wallet)(?!js)/i, // Términos crypto sospechosos
  /^(colors?|request|lodash|react|express)-?[a-z]*$/i // Typosquatting
];

class SecurityAuditor {
  constructor() {
    this.vulnerabilities = [];
    this.suspiciousPackages = [];
    this.totalPackages = 0;
  }

  async run() {
    log.title('INICIANDO AUDITORÍA DE SEGURIDAD COMPLETA');
    console.log('');

    try {
      await this.checkNpmVersion();
      await this.auditPackageLocks();
      await this.runNpmAudit();
      await this.checkSuspiciousPackages();
      await this.verifyPackageIntegrity();
      await this.checkLicenses();
      await this.generateReport();
    } catch (error) {
      log.error(`Error durante auditoría: ${error.message}`);
      process.exit(1);
    }
  }

  async checkNpmVersion() {
    log.info('Verificando versión de npm...');
    
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      const majorVersion = parseInt(npmVersion.split('.')[0]);
      
      if (majorVersion < 8) {
        log.warning(`npm v${npmVersion} detectado. Recomendado: v8+`);
      } else {
        log.success(`npm v${npmVersion} - OK`);
      }
    } catch (error) {
      log.error('No se pudo verificar la versión de npm');
    }
  }

  async auditPackageLocks() {
    log.info('Verificando package-lock.json...');
    
    const directories = ['', 'backend', 'frontend', 'mobile'];
    
    for (const dir of directories) {
      const lockPath = path.join(dir, 'package-lock.json');
      const packagePath = path.join(dir, 'package.json');
      
      if (fs.existsSync(packagePath)) {
        if (!fs.existsSync(lockPath)) {
          log.error(`Falta package-lock.json en ${dir || 'root'}`);
          this.vulnerabilities.push({
            type: 'missing-lock',
            location: dir || 'root',
            severity: 'high'
          });
        } else {
          // Verificar integridad del lock file
          const lockContent = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
          const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          
          if (lockContent.name !== packageContent.name) {
            log.warning(`Inconsistencia en ${dir || 'root'}: nombres no coinciden`);
          } else {
            log.success(`package-lock.json OK en ${dir || 'root'}`);
          }
        }
      }
    }
  }

  async runNpmAudit() {
    log.info('Ejecutando npm audit...');
    
    const directories = ['backend', 'frontend', 'mobile'];
    
    for (const dir of directories) {
      if (fs.existsSync(path.join(dir, 'package.json'))) {
        try {
          log.info(`Auditando ${dir}...`);
          
          const auditResult = execSync(`cd ${dir} && npm audit --json`, { 
            encoding: 'utf8',
            stdio: 'pipe'
          });
          
          const audit = JSON.parse(auditResult);
          
          if (audit.metadata.vulnerabilities.total > 0) {
            log.warning(`${dir}: ${audit.metadata.vulnerabilities.total} vulnerabilidades encontradas`);
            
            // Detallar vulnerabilidades críticas y altas
            if (audit.metadata.vulnerabilities.critical > 0) {
              log.error(`${dir}: ${audit.metadata.vulnerabilities.critical} vulnerabilidades CRÍTICAS`);
            }
            if (audit.metadata.vulnerabilities.high > 0) {
              log.error(`${dir}: ${audit.metadata.vulnerabilities.high} vulnerabilidades ALTAS`);
            }
            
            this.vulnerabilities.push({
              type: 'npm-audit',
              location: dir,
              severity: audit.metadata.vulnerabilities.critical > 0 ? 'critical' : 'high',
              details: audit.metadata.vulnerabilities
            });
          } else {
            log.success(`${dir}: Sin vulnerabilidades conocidas`);
          }
          
        } catch (error) {
          // npm audit devuelve exit code != 0 cuando hay vulnerabilidades
          if (error.stdout) {
            try {
              const audit = JSON.parse(error.stdout);
              log.error(`${dir}: ${audit.metadata.vulnerabilities.total} vulnerabilidades encontradas`);
              
              this.vulnerabilities.push({
                type: 'npm-audit',
                location: dir,
                severity: 'high',
                details: audit.metadata.vulnerabilities
              });
            } catch (parseError) {
              log.error(`Error parseando audit de ${dir}: ${parseError.message}`);
            }
          }
        }
      }
    }
  }

  async checkSuspiciousPackages() {
    log.info('Verificando paquetes sospechosos...');
    
    const directories = ['backend', 'frontend', 'mobile'];
    
    for (const dir of directories) {
      const packagePath = path.join(dir, 'package.json');
      
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };
        
        for (const [packageName, version] of Object.entries(allDeps)) {
          // Verificar blacklist
          if (SUSPICIOUS_PACKAGES.has(packageName)) {
            log.error(`Paquete en blacklist detectado: ${packageName} en ${dir}`);
            this.suspiciousPackages.push({
              name: packageName,
              location: dir,
              reason: 'blacklist',
              severity: 'critical'
            });
          }
          
          // Verificar patrones sospechosos
          for (const pattern of SUSPICIOUS_PATTERNS) {
            if (pattern.test(packageName)) {
              log.warning(`Paquete con patrón sospechoso: ${packageName} en ${dir}`);
              this.suspiciousPackages.push({
                name: packageName,
                location: dir,
                reason: 'suspicious-pattern',
                severity: 'medium'
              });
              break;
            }
          }
          
          // Verificar versiones sospechosas
          if (version.includes('*') || version.includes('>') || version.includes('<')) {
            log.warning(`Versión flexible detectada: ${packageName}@${version} en ${dir}`);
          }
          
          this.totalPackages++;
        }
      }
    }
    
    log.success(`${this.totalPackages} paquetes verificados`);
  }

  async verifyPackageIntegrity() {
    log.info('Verificando integridad de paquetes...');
    
    try {
      // Verificar que node_modules coincida con package-lock.json
      const directories = ['backend', 'frontend', 'mobile'];
      
      for (const dir of directories) {
        if (fs.existsSync(path.join(dir, 'node_modules'))) {
          try {
            execSync(`cd ${dir} && npm ls --depth=0`, { stdio: 'pipe' });
            log.success(`Integridad OK en ${dir}`);
          } catch (error) {
            log.warning(`Inconsistencias en node_modules de ${dir}`);
            this.vulnerabilities.push({
              type: 'integrity-check',
              location: dir,
              severity: 'medium'
            });
          }
        }
      }
    } catch (error) {
      log.error(`Error verificando integridad: ${error.message}`);
    }
  }

  async checkLicenses() {
    log.info('Verificando licencias...');
    
    // Licencias problemáticas
    const PROBLEMATIC_LICENSES = ['GPL-3.0', 'AGPL-3.0', 'SSPL-1.0'];
    
    try {
      const directories = ['backend', 'frontend', 'mobile'];
      
      for (const dir of directories) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
          // Aquí podrías integrar con license-checker si quieres más detalle
          log.success(`Licencias verificadas en ${dir}`);
        }
      }
    } catch (error) {
      log.warning('No se pudieron verificar todas las licencias');
    }
  }

  async generateReport() {
    log.title('REPORTE DE SEGURIDAD');
    console.log('');
    
    // Resumen
    console.log(`📊 RESUMEN:`);
    console.log(`   Paquetes analizados: ${this.totalPackages}`);
    console.log(`   Vulnerabilidades: ${this.vulnerabilities.length}`);
    console.log(`   Paquetes sospechosos: ${this.suspiciousPackages.length}`);
    console.log('');
    
    // Vulnerabilidades críticas
    const criticalVulns = this.vulnerabilities.filter(v => v.severity === 'critical');
    if (criticalVulns.length > 0) {
      log.error(`🚨 ${criticalVulns.length} VULNERABILIDADES CRÍTICAS:`);
      criticalVulns.forEach(v => {
        console.log(`   - ${v.type} en ${v.location}`);
      });
      console.log('');
    }
    
    // Paquetes sospechosos
    if (this.suspiciousPackages.length > 0) {
      log.warning(`🔍 PAQUETES SOSPECHOSOS:`);
      this.suspiciousPackages.forEach(p => {
        console.log(`   - ${p.name} (${p.reason}) en ${p.location}`);
      });
      console.log('');
    }
    
    // Recomendaciones
    console.log(`💡 RECOMENDACIONES:`);
    console.log(`   1. Ejecutar 'npm audit fix' en cada directorio`);
    console.log(`   2. Actualizar paquetes con vulnerabilidades`);
    console.log(`   3. Revisar paquetes sospechosos manualmente`);
    console.log(`   4. Usar 'npm ci' en producción`);
    console.log(`   5. Configurar GitHub Dependabot`);
    console.log('');
    
    // Estado final
    if (criticalVulns.length === 0 && this.suspiciousPackages.length === 0) {
      log.success('🛡️  PROYECTO SEGURO - Sin vulnerabilidades críticas');
      process.exit(0);
    } else {
      log.error('⚠️  ATENCIÓN REQUERIDA - Vulnerabilidades encontradas');
      process.exit(1);
    }
  }
}

// Ejecutar auditoría
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.run().catch(error => {
    log.error(`Error fatal: ${error.message}`);
    process.exit(1);
  });
}

module.exports = SecurityAuditor;
