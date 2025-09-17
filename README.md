# 🎯 Syntra - Transformamos eventos en experiencias digitales memorables

## 🚀 Visión General

Syntra es una plataforma completa que revoluciona los eventos mediante tecnología NFC, gamificación e inteligencia artificial. Conectamos asistentes, creamos experiencias memorables y proporcionamos analytics valiosos a organizadores.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NFC Devices   │    │   Mobile App    │    │  Web Platform   │
│  (Pulseras/Tags)│◄──►│  (iOS/Android)  │◄──►│   (B2B/B2C)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Cloud Backend │
                    │ (API + AI + DB) │
                    └─────────────────┘
```

## 📁 Estructura del Proyecto

```
syntra/
├── backend/                 # API Node.js + Express
├── frontend/                # Dashboard Web React
├── mobile/                  # App React Native
├── nfc-core/               # Lógica NFC y dispositivos
├── ai-engine/              # Módulos de IA y ML
├── docs/                   # Documentación
├── docker-compose.yml      # Orquestación de servicios
└── README.md
```

## 🛠️ Stack Tecnológico

### Backend
- **Node.js + Express**: API REST escalable
- **PostgreSQL**: Base de datos principal
- **Redis**: Cache y sesiones en tiempo real
- **Socket.io**: Comunicación en tiempo real
- **JWT**: Autenticación segura

### Frontend Web
- **React + TypeScript**: Dashboard responsive
- **Next.js**: SSR y optimización
- **Tailwind CSS**: UI moderna
- **Recharts**: Visualización de datos

### Mobile App
- **React Native**: Cross-platform
- **Expo**: Desarrollo rápido
- **NFC Manager**: Integración NFC nativa
- **Reanimated**: Animaciones fluidas

### DevOps & Cloud
- **Docker**: Containerización
- **AWS/Vercel**: Hosting y CI/CD
- **Prisma**: ORM y migraciones
- **Jest**: Testing automatizado

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 6+

### Instalación Completa
```bash
# Clonar y configurar
git clone https://github.com/tu-usuario/syntra.git
cd syntra

# Instalar dependencias
npm run install:all

# Configurar base de datos
npm run db:setup

# Iniciar todos los servicios
npm run dev:all
```

## 🎯 Funcionalidades Core

### Para Asistentes
- ✅ Conexión automática via NFC
- ✅ Gamificación y logros
- ✅ Networking inteligente
- ✅ Experiencias AR/VR
- ✅ Historial persistente

### Para Organizadores  
- ✅ Dashboard de analytics en tiempo real
- ✅ Gestión completa de eventos
- ✅ Insights de engagement
- ✅ ROI y métricas avanzadas
- ✅ Herramientas de marketing

### Para Empresas (B2B)
- ✅ Packs personalizados
- ✅ Branding completo
- ✅ Integración CRM
- ✅ Reports ejecutivos
- ✅ Escalabilidad empresarial

## 🏆 Diferenciadores Únicos

1. **Ecosistema Completo**: Desde hardware hasta analytics
2. **IA Contextual**: Inteligencia que aprende del evento
3. **Gamificación Social**: Conexiones naturales y divertidas
4. **Escalabilidad Total**: De 50 a 50,000 asistentes
5. **ROI Medible**: Métricas concretas para organizadores

## 📈 Roadmap de Desarrollo

### Fase 1: MVP (3 meses)
- [x] Arquitectura base
- [ ] Sistema NFC básico
- [ ] App móvil core
- [ ] Dashboard organizadores
- [ ] Gamificación básica

### Fase 2: Escalabilidad (3 meses)
- [ ] IA y recomendaciones
- [ ] E-commerce B2C
- [ ] Analytics avanzados
- [ ] Integración redes sociales

### Fase 3: Innovación (6 meses)
- [ ] Realidad aumentada
- [ ] IoT avanzado
- [ ] Machine learning
- [ ] Expansión internacional

## 🤝 Contribución

¡Bienvenidas las contribuciones! Ver [CONTRIBUTING.md](docs/CONTRIBUTING.md) para guidelines.

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 📞 Contacto

- **Email**: hello@syntra.com
- **Website**: https://syntra.com
- **LinkedIn**: @syntra-events

---

**Syntra** - *Donde cada evento se convierte en una experiencia inolvidable* ✨
