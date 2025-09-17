import { Metadata } from 'next';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ProblemSolutionSection } from '@/components/landing/ProblemSolutionSection';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Syntra - Transformamos eventos en experiencias digitales memorables',
  description: 'Descubre cómo Syntra revoluciona los eventos con tecnología NFC, gamificación e IA. Conecta asistentes, crea experiencias únicas y obtén analytics valiosos.',
  openGraph: {
    title: 'Syntra - El futuro de los eventos está aquí',
    description: 'Pulseras inteligentes, gamificación social y analytics en tiempo real. Transforma tu próximo evento en una experiencia inolvidable.',
    images: [
      {
        url: '/images/hero-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Syntra - Experiencias de eventos memorables',
      },
    ],
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section con impacto visual inmediato */}
      <HeroSection />
      
      {/* Problema que resolvemos */}
      <ProblemSolutionSection />
      
      {/* Nuestras características únicas */}
      <FeaturesSection />
      
      {/* Demostración del producto */}
      <ProductShowcase />
      
      {/* Testimonios y casos de éxito */}
      <TestimonialsSection />
      
      {/* Precios y paquetes */}
      <PricingSection />
      
      {/* Call to Action final */}
      <CTASection />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}
