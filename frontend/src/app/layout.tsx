import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';

import { Providers } from '@/providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Syntra - Transformamos eventos en experiencias digitales memorables',
    template: '%s | Syntra',
  },
  description: 'Plataforma completa para crear experiencias de eventos inolvidables con tecnología NFC, gamificación e inteligencia artificial.',
  keywords: [
    'eventos',
    'nfc',
    'gamificación',
    'networking',
    'experiencias digitales',
    'tecnología',
    'innovación',
  ],
  authors: [{ name: 'Syntra Team' }],
  creator: 'Syntra',
  publisher: 'Syntra',
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://syntra.com',
    title: 'Syntra - Experiencias de eventos memorables',
    description: 'Transformamos eventos en experiencias digitales inolvidables con NFC, gamificación e IA.',
    siteName: 'Syntra',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Syntra - Experiencias de eventos memorables',
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Syntra - Experiencias de eventos memorables',
    description: 'Transformamos eventos en experiencias digitales inolvidables con NFC, gamificación e IA.',
    creator: '@syntra_events',
    images: ['/twitter-image.jpg'],
  },
  
  // Icons
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  
  // Manifest
  manifest: '/site.webmanifest',
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verificación
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  
  // Otros
  category: 'technology',
  classification: 'Business',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="es" 
      className={`${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect para mejorar performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS prefetch para APIs externas */}
        <link rel="dns-prefetch" href="//api.syntra.com" />
        <link rel="dns-prefetch" href="//cdn.syntra.com" />
        
        {/* Theme color para móviles */}
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        
        {/* Viewport optimizado */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
        />
        
        {/* Configuración PWA */}
        <meta name="application-name" content="Syntra" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Syntra" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Structured Data para SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Syntra',
              url: 'https://syntra.com',
              logo: 'https://syntra.com/logo.png',
              description: 'Transformamos eventos en experiencias digitales memorables',
              sameAs: [
                'https://twitter.com/syntra_events',
                'https://linkedin.com/company/syntra',
                'https://instagram.com/syntra_events',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+34-xxx-xxx-xxx',
                contactType: 'customer service',
                availableLanguage: ['Spanish', 'English'],
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>
          {/* Skip to main content para accesibilidad */}
          <a 
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Saltar al contenido principal
          </a>
          
          {/* Contenido principal */}
          <div id="main-content">
            {children}
          </div>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                borderRadius: '0.75rem',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#f9fafb',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f9fafb',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#0ea5e9',
                  secondary: '#f9fafb',
                },
              },
            }}
          />
          
          {/* Service Worker registration */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              `,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
