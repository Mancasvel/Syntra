# 🎯 Syntra - Transformamos eventos en experiencias digitales memorables

## 🚀 Visión General

Syntra es una **plataforma híbrida completa** que revoluciona los eventos mediante:
- 🤝 **Networking NFC inteligente** - Conexiones automáticas entre asistentes
- 🎪 **Festival Tokens centralizados** - Pagos cashless con pulseras NFC
- 🎮 **Gamificación social** - Logros y recompensas por interacciones
- 🤖 **Inteligencia artificial** - Recomendaciones personalizadas
- 📊 **Analytics en tiempo real** - Métricas valiosas para organizadores

**El resultado**: Eventos más conectados, experiencias memorables y ecosistema de pagos unificado.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NFC Devices   │    │   Mobile App    │    │  Web Platform   │
│  (Pulseras/Tags)│◄──►│  (iOS/Android)  │◄──►│   (B2B/B2C)     │
│                 │    │                 │    │                 │
│ • Networking    │    │ • Wallet        │    │ • Dashboard     │
│ • Payments      │    │ • NFC Scanner   │    │ • Analytics     │
│ • Data Storage  │    │ • Token Balance │    │ • Vendor Mgmt   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Cloud Backend │
                    │ • API + AI + DB │
                    │ • RevenueCat    │
                    │ • Token System  │
                    │ • Real-time WS  │
                    └─────────────────┘
```

## 📁 Estructura del Proyecto

```
syntra/
├── backend/                     # API Node.js + Express + PostgreSQL
│   ├── src/services/
│   │   ├── nfcService.ts       # Networking NFC (original)
│   │   ├── festivalTokenService.ts  # Festival Tokens (nuevo)
│   │   └── revenueCatService.ts     # Pagos y suscripciones
│   ├── prisma/schema.prisma    # Base de datos completa
│   └── tests/                  # Tests completos (70% coverage)
├── frontend/                    # Dashboard Web React + Next.js
│   ├── src/hooks/
│   │   ├── useRevenueCat.ts    # Suscripciones web
│   │   └── useAuth.ts          # Autenticación
│   └── src/components/         # Componentes testeados
├── mobile/                      # App React Native + Expo
│   ├── src/hooks/
│   │   ├── useFestivalTokens.ts # Wallet y pagos NFC
│   │   ├── useNFC.ts           # Networking NFC
│   │   └── useRevenueCat.ts    # Suscripciones móvil
│   ├── app/(tabs)/
│   │   ├── index.tsx           # Dashboard networking
│   │   ├── wallet.tsx          # Festival wallet (nuevo)
│   │   └── connections.tsx     # Conexiones NFC
│   └── src/services/           # Servicios testeados
├── docs/                        # Documentación completa
│   ├── QUICK_START.md          # Guía de inicio
│   └── NFC_GUIDE.md            # Funcionalidades NFC
├── scripts/setup.sh            # Configuración automática
├── docker-compose.yml          # Orquestación de servicios
├── .gitignore                  # Exclusiones completas
└── README.md
```

## 🛠️ Stack Tecnológico

### Backend
- **Node.js + Express + TypeScript**: API REST escalable
- **MongoDB Atlas + Mongoose**: Base de datos NoSQL en la nube
- **Redis**: Cache y sesiones en tiempo real
- **Socket.io**: Comunicación WebSocket
- **RevenueCat**: Suscripciones y pagos
- **MQTT**: Comunicación IoT/NFC devices
- **OpenAI**: Inteligencia artificial
- **JWT**: Autenticación segura

### Frontend Web
- **React + TypeScript + Next.js**: Dashboard responsive con SSR
- **Tailwind CSS**: UI moderna y personalizable
- **Framer Motion**: Animaciones fluidas
- **Recharts**: Visualización de datos avanzada
- **SWR + Zustand**: Estado global y data fetching

### Mobile App
- **React Native + Expo**: Desarrollo cross-platform
- **NFC Manager**: Integración NFC nativa iOS/Android
- **React Navigation**: Navegación nativa
- **Reanimated**: Animaciones de alto rendimiento
- **RevenueCat**: Suscripciones in-app
- **Haptic Feedback**: Retroalimentación táctil

### Pagos y Suscripciones
- **RevenueCat**: Gestión unificada de suscripciones
- **Apple Pay / Google Pay**: Pagos nativos
- **Webhooks**: Eventos en tiempo real
- **Analytics**: Métricas de suscripciones

### DevOps & Testing
- **Jest**: Testing con 70% coverage mínimo
- **GitHub Actions**: CI/CD automatizado
- **Vercel**: Hosting serverless y escalabilidad automática
- **MongoDB Atlas**: Base de datos escalable en la nube
- **Serverless Architecture**: Zero DevOps, auto-scaling

## 🚀 Inicio Rápido

### Prerrequisitos
- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **MongoDB Atlas Account** - [Crear cuenta gratuita](https://www.mongodb.com/atlas)
- **Vercel Account** - [Crear cuenta gratuita](https://vercel.com)
- **Git** - [Descargar aquí](https://git-scm.com/)

### Instalación Automática (Recomendada)
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/syntra.git
cd syntra

# Ejecutar configuración automática
./scripts/setup.sh
```

### Instalación Manual

#### 1. Configurar MongoDB Atlas
```bash
# Crear cluster en MongoDB Atlas
# Crear usuario de base de datos
# Obtener connection string
# Configurar network access (IP whitelist)
```

#### 2. Configurar aplicación
```bash
# Configurar variables de entorno
cp env.example .env

# Editar .env con tus configuraciones:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/syntra_db
# REVENUECAT_API_KEY=tu-api-key
# OPENAI_API_KEY=tu-openai-key

# Instalar dependencias
npm run install:all

# Probar conexión a MongoDB Atlas
cd backend && npm run db:connect

# Iniciar aplicación completa
npm run dev:all
```

#### 3. Deploy a Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configurar variables de entorno en Vercel dashboard
```

### URLs Disponibles
Una vez iniciado, podrás acceder a:
- **🖥️ Dashboard Web**: http://localhost:3000
- **📱 App Móvil**: http://localhost:19006 (Expo)
- **🔧 API Backend**: http://localhost:3001
- **🍃 MongoDB Atlas**: Panel web de MongoDB
- **🗄️ Redis**: localhost:6379

## 🎯 Funcionalidades Completas

### 🤝 Networking NFC (Funcionalidad Original)
**Para Asistentes:**
- ✅ **Smart Handshake**: Intercambio automático de perfiles
- ✅ **Compatibility Matcher**: Vibración cuando alguien compatible está cerca
- ✅ **Achievement Hunter**: 20+ logros desbloqueables por networking
- ✅ **Battle Royale Social**: Competencias en tiempo real
- ✅ **AR Triggers**: Realidad aumentada activada por NFC
- ✅ **Dynamic Profile**: Perfil que evoluciona durante el evento
- ✅ **Memory Capsule**: Recuerdos digitales únicos

### 🎪 Festival Tokens (Nueva Funcionalidad)
**Para Usuarios:**
- ✅ **Wallet Digital Centralizado**: Un wallet para todos los festivales
- ✅ **Compra de Tokens**: Desde tarjeta directo a la app
- ✅ **Pagos NFC Cashless**: Toca pulsera → pago instantáneo
- ✅ **Cross-Festival**: Tokens que funcionan en cualquier festival
- ✅ **Historial Completo**: Todas las transacciones organizadas
- ✅ **Límites de Seguridad**: Control de gasto diario
- ✅ **Recompensas**: Tokens bonus por conexiones NFC

**Para Vendors:**
- ✅ **Pagos Garantizados**: Sin manejo de efectivo
- ✅ **Transacciones Instantáneas**: Cobro inmediato
- ✅ **Analytics de Productos**: Métricas de ventas
- ✅ **Gestión de Stock**: Control en tiempo real
- ✅ **Integración Simple**: API fácil de usar

### 📊 Para Organizadores
- ✅ **Dashboard Unificado**: Networking + Pagos + Analytics
- ✅ **Métricas en Tiempo Real**: Engagement y ventas live
- ✅ **Gestión de Vendors**: Control completo del marketplace
- ✅ **Analytics Avanzados**: ROI, heatmaps, comportamiento
- ✅ **Comisiones Automáticas**: Revenue por transacciones
- ✅ **Reports Ejecutivos**: Insights accionables

### 🏢 Para Empresas (B2B)
- ✅ **Packs Híbridos**: Networking + Tokens personalizados
- ✅ **Branding Completo**: En wallet y experiencias NFC
- ✅ **Integración CRM**: Conexiones y gastos sincronizados
- ✅ **White Label**: Solución completamente personalizada
- ✅ **Escalabilidad**: De 50 a 50,000 asistentes sin cambios

## 🏆 Diferenciadores Únicos

### 🌟 **Lo que nos hace ÚNICOS en el mercado:**

1. **🔗 Plataforma Híbrida**: La única que combina networking NFC + pagos cashless
2. **🌍 Tokens Cross-Festival**: Un wallet para TODOS los festivales del mundo
3. **⚡ Velocidad Brutal**: Pagos más rápidos que Apple Pay (solo tocar pulsera)
4. **🎮 Gamificación Integrada**: Rewards por socializar Y por gastar
5. **🤖 IA Contextual**: Recomendaciones que aprenden del evento específico
6. **📊 Analytics Unificados**: Networking + Pagos + Engagement en un dashboard
7. **🚀 Escalabilidad Total**: De 50 a 50,000 asistentes sin cambios arquitectónicos
8. **💰 Modelo de Revenue Dual**: B2B (eventos) + B2C (tokens) + Comisiones

### 🆚 **Vs. Competencia:**

| Característica | Syntra | Eventbrite | NFC Ring | Otros |
|---|---|---|---|---|
| Networking NFC | ✅ | ❌ | ✅ | ❌ |
| Pagos Cashless | ✅ | ❌ | ❌ | Parcial |
| Cross-Festival | ✅ | ❌ | ❌ | ❌ |
| Gamificación | ✅ | ❌ | ❌ | ❌ |
| IA Integrada | ✅ | ❌ | ❌ | ❌ |
| Analytics Unificados | ✅ | Parcial | ❌ | ❌ |

## 🎯 Casos de Uso Reales

### 🎪 **Primavera Sound 2024**
```
Usuario compra 50€ en tokens → Usa pulsera NFC para:
• Cerveza: 8 tokens (sin cola de efectivo)
• Comida: 15 tokens (pago instantáneo)  
• Merchandise: 25 tokens (stock actualizado)
• Conecta con 5 personas → Gana 10 tokens bonus
• Balance restante: 12 tokens para el próximo festival
```

### 🎵 **FIB 2024**
```
Usuario llega con tokens de Primavera Sound →
Añade 30€ más desde la app → Paga todo con NFC →
Experiencia 100% cashless + networking automático
```

### 🏢 **Evento Corporativo Tech**
```
Empresa personaliza pulseras con su branding →
Empleados conectan automáticamente por departamentos →
Tokens para catering y actividades → Analytics de engagement
```

## 📈 Roadmap de Desarrollo

### ✅ Fase 1: Fundación (COMPLETADA)
- [x] **Arquitectura completa** - Backend + Frontend + Mobile
- [x] **Sistema NFC avanzado** - Networking + Pagos integrados
- [x] **Wallet Digital** - Tokens cross-festival
- [x] **Tests completos** - 70% coverage en todos los módulos
- [x] **RevenueCat integrado** - Suscripciones y pagos
- [x] **Dashboard organizadores** - Analytics unificados
- [x] **Gamificación completa** - 20+ logros y recompensas

### 🚀 Fase 2: Escalabilidad (En progreso)
- [ ] **Marketplace Web** - Gestión de vendors desde dashboard
- [ ] **IA Avanzada** - Recomendaciones predictivas
- [ ] **API Pública** - Para integraciones de terceros
- [ ] **White Label** - Solución completamente personalizable
- [ ] **Internacionalización** - Multi-idioma y multi-moneda

### 🌟 Fase 3: Innovación (Próximamente)
- [ ] **Realidad Aumentada** - Experiencias inmersivas
- [ ] **Blockchain Integration** - NFTs como logros coleccionables
- [ ] **IoT Avanzado** - Sensores ambientales y wearables
- [ ] **Machine Learning** - Predicción de comportamiento
- [ ] **Expansión Global** - Festivales internacionales

## 🧪 Testing y Calidad

### **Coverage Completo**
- ✅ **Backend**: 70% coverage mínimo con Jest + Supertest
- ✅ **Frontend**: 60% coverage con Testing Library + Jest
- ✅ **Mobile**: 60% coverage con Jest + React Native Testing Library
- ✅ **Integración**: Tests end-to-end de flujos completos
- ✅ **NFC**: Tests específicos para funcionalidades de hardware

### **Comandos de Testing**
```bash
# Tests completos
npm run test                 # Todos los módulos
npm run test:coverage        # Con reporte de coverage

# Tests específicos  
cd backend && npm test       # Solo backend
cd frontend && npm test      # Solo frontend  
cd mobile && npm test        # Solo mobile

# Tests en modo watch
npm run test:watch           # Desarrollo continuo
```

## 🚀 Despliegue en Producción

### **Variables de Entorno Requeridas**
```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/syntra_db?retryWrites=true&w=majority
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/syntra_db?retryWrites=true&w=majority

# RevenueCat (Suscripciones)
REVENUECAT_API_KEY=sk_your-secret-key
REVENUECAT_WEBHOOK_SECRET=webhook-secret

# Redis (opcional para desarrollo local)
REDIS_URL=redis://host:6379

# APIs externas
OPENAI_API_KEY=sk-your-openai-key
JWT_SECRET=your-super-secret-jwt-key

# Frontend
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
NEXT_PUBLIC_REVENUECAT_API_KEY=pk_your-public-key
```

### **Vercel Production Deploy**
```bash
# Deploy automático desde Git
git push origin main

# O deploy manual
vercel --prod

# Configurar variables de entorno en Vercel Dashboard:
# Settings → Environment Variables → Add
```

### **Desarrollo Local Directo**
```bash
# Desarrollo sin Docker (más simple y rápido)
npm run dev

# Todo funciona directamente:
# - Backend: Node.js + MongoDB Atlas
# - Frontend: Next.js dev server
# - Mobile: Expo dev server
```

## 💰 Modelo de Negocio

### **Streams de Revenue**
1. **🎫 Suscripciones B2B**: Organizadores pagan por evento
2. **💳 Comisiones de Tokens**: 2-3% por transacción cashless  
3. **📦 Packs Premium**: Hardware + software personalizado
4. **📊 Analytics Premium**: Insights avanzados y reportes
5. **🎯 White Label**: Solución completamente personalizada

### **Escalabilidad de Revenue**
- **50 asistentes**: €200-500 por evento
- **500 asistentes**: €2,000-5,000 por evento
- **5,000 asistentes**: €20,000-50,000 por evento
- **50,000 asistentes**: €200,000-500,000 por evento

## 🤝 Contribución

### **Para Desarrolladores**
```bash
# Fork del repositorio
git clone https://github.com/tu-usuario/syntra.git

# Crear branch para feature
git checkout -b feature/nueva-funcionalidad

# Hacer cambios y tests
npm run test

# Commit y push
git commit -m "feat: nueva funcionalidad brutal"
git push origin feature/nueva-funcionalidad
```

### **Guidelines**
- ✅ Tests obligatorios para nuevas features
- ✅ TypeScript strict mode
- ✅ Documentación actualizada
- ✅ Mobile-first design
- ✅ Performance optimizado

Ver [CONTRIBUTING.md](docs/CONTRIBUTING.md) para guidelines completas.

## 📞 Contacto y Soporte

### **Equipo Syntra**
- 📧 **Email**: hello@syntra.com
- 🌐 **Website**: https://syntra.com
- 💼 **LinkedIn**: @syntra-events
- 🐦 **Twitter**: @syntra_events

### **Soporte Técnico**
- 📚 **Documentación**: [docs/](docs/)
- 🐛 **Issues**: GitHub Issues
- 💬 **Discord**: Comunidad de desarrolladores
- 📖 **API Docs**: http://localhost:3001/docs

### **Para Inversores**
- 📊 **Pitch Deck**: Disponible bajo NDA
- 💰 **Modelo de Negocio**: Detallado en documentación privada
- 📈 **Métricas**: Dashboard en tiempo real para inversores

---

## 🌟 **¡El Futuro de los Eventos está Aquí!**

**Syntra** combina lo mejor de dos mundos:
- 🤝 **Networking NFC** para conexiones humanas reales
- 💳 **Festival Tokens** para experiencias cashless perfectas

*Donde cada evento se convierte en una experiencia inolvidable y cada pago es instantáneo* ✨

### **¿Listo para revolucionar tu próximo evento?**

```bash
git clone https://github.com/syntra/syntra.git
cd syntra && ./scripts/setup.sh
# ¡Y en 5 minutos tienes la plataforma completa funcionando!
```

**🚀 Let's make events unforgettable!**
