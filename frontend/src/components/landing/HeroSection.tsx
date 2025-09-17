'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  PlayCircleIcon, 
  SparklesIcon,
  UserGroupIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon 
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const stats = [
  { label: 'Eventos exitosos', value: '500+', icon: ChartBarIcon },
  { label: 'Conexiones creadas', value: '50K+', icon: UserGroupIcon },
  { label: 'Dispositivos activos', value: '25K+', icon: DevicePhoneMobileIcon },
];

const floatingElements = [
  { id: 1, delay: 0, x: '10%', y: '20%', size: 'w-3 h-3' },
  { id: 2, delay: 1, x: '80%', y: '30%', size: 'w-2 h-2' },
  { id: 3, delay: 2, x: '60%', y: '70%', size: 'w-4 h-4' },
  { id: 4, delay: 0.5, x: '20%', y: '80%', size: 'w-2 h-2' },
  { id: 5, delay: 1.5, x: '90%', y: '60%', size: 'w-3 h-3' },
];

export function HeroSection() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  const dynamicWords = ['memorables', 'conectadas', 'inteligentes', 'únicas', 'innovadoras'];

  // Animación de palabras dinámicas
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % dynamicWords.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Elementos flotantes de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((element) => (
          <motion.div
            key={element.id}
            className={`absolute ${element.size} bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full opacity-20`}
            style={{ left: element.x, top: element.y }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4,
              delay: element.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Patrón de grid sutil */}
      <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenido principal */}
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge de novedad */}
            <motion.div
              className="inline-flex mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Badge variant="primary" className="px-4 py-2 text-sm font-medium">
                <SparklesIcon className="w-4 h-4 mr-2" />
                🚀 Revoluciona tus eventos con IA y NFC
              </Badge>
            </motion.div>

            {/* Título principal */}
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Transformamos eventos en{' '}
              <span className="relative">
                <span className="text-gradient font-display">
                  experiencias
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </span>{' '}
              <motion.span
                key={currentWordIndex}
                className="text-gradient"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {dynamicWords[currentWordIndex]}
              </motion.span>
            </motion.h1>

            {/* Subtítulo */}
            <motion.p
              className="text-xl text-gray-600 mb-8 max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Conecta asistentes con{' '}
              <span className="font-semibold text-primary-600">pulseras NFC inteligentes</span>,
              crea experiencias gamificadas y obtén{' '}
              <span className="font-semibold text-secondary-600">analytics en tiempo real</span>.
              Desde regalos de bienvenida hasta networking automático.
            </motion.p>

            {/* Botones de acción */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <Button
                size="lg"
                className="bg-gradient-brand hover:opacity-90 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Crear mi evento
                <SparklesIcon className="ml-2 w-5 h-5" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-primary-200 text-primary-700 hover:bg-primary-50 px-8 py-4 text-lg font-semibold"
                onClick={() => setIsVideoPlaying(true)}
              >
                <PlayCircleIcon className="mr-2 w-5 h-5" />
                Ver demo (2 min)
              </Button>
            </motion.div>

            {/* Estadísticas */}
            <motion.div
              className="grid grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center lg:text-left"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                >
                  <div className="flex items-center justify-center lg:justify-start mb-2">
                    <stat.icon className="w-5 h-5 text-primary-500 mr-2" />
                    <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Visual principal */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="relative">
              {/* Imagen principal */}
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="/images/hero-dashboard-preview.jpg"
                  alt="Dashboard de Syntra mostrando analytics en tiempo real"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-lg"
                  priority
                />
                
                {/* Overlay con elementos interactivos */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
                
                {/* Badges flotantes */}
                <motion.div
                  className="absolute -top-4 -left-4 bg-success-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✨ +127 conexiones
                </motion.div>
                
                <motion.div
                  className="absolute -bottom-4 -right-4 bg-secondary-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  🏆 15 logros desbloqueados
                </motion.div>
              </div>

              {/* Elementos decorativos */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-2xl blur-2xl opacity-20 animate-pulse" />
              
              {/* Pulseras NFC flotantes */}
              <motion.div
                className="absolute top-10 -right-10 w-20 h-20 bg-gradient-to-r from-accent-400 to-accent-500 rounded-full shadow-lg flex items-center justify-center"
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
              >
                <DevicePhoneMobileIcon className="w-8 h-8 text-white" />
              </motion.div>

              <motion.div
                className="absolute bottom-10 -left-10 w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full shadow-lg flex items-center justify-center"
                animate={{ 
                  rotate: -360,
                  y: [0, -10, 0],
                }}
                transition={{ 
                  rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                  y: { duration: 3, repeat: Infinity }
                }}
              >
                <UserGroupIcon className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de video (si se implementa) */}
      {isVideoPlaying && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsVideoPlaying(false)}
        >
          <motion.div
            className="bg-white rounded-2xl p-2 max-w-4xl w-full"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
              <p className="text-white text-lg">Video demo aquí</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}
