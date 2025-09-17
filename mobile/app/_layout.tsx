import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

// Providers
import { AuthProvider } from '@/providers/AuthProvider';
import { EventProvider } from '@/providers/EventProvider';
import { NFCProvider } from '@/providers/NFCProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

// Services
import { initializeApp } from '@/services/appService';
import { setupNotifications } from '@/services/notificationService';

// Configuración de toast
import { toastConfig } from '@/config/toastConfig';

// Prevenir que la splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Inicializar servicios de la app
        await initializeApp();
        
        // Configurar notificaciones
        await setupNotifications();
        
        // Ocultar splash screen cuando todo esté listo
        if (fontsLoaded) {
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // Ocultar splash screen incluso si hay error
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [fontsLoaded]);

  // No renderizar nada hasta que las fuentes estén cargadas
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <EventProvider>
                <NFCProvider>
                  <NotificationProvider>
                    <StatusBar style="auto" />
                    
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: '#f9fafb' },
                        animation: 'slide_from_right',
                      }}
                    >
                      {/* Pantallas principales */}
                      <Stack.Screen 
                        name="(tabs)" 
                        options={{ 
                          headerShown: false,
                          gestureEnabled: false 
                        }} 
                      />
                      
                      {/* Auth screens */}
                      <Stack.Screen 
                        name="(auth)" 
                        options={{ 
                          headerShown: false,
                          presentation: 'fullScreenModal',
                          animation: 'fade'
                        }} 
                      />
                      
                      {/* Modal screens */}
                      <Stack.Screen
                        name="nfc-scan"
                        options={{
                          presentation: 'modal',
                          headerShown: true,
                          headerTitle: 'Conectar con NFC',
                          headerStyle: {
                            backgroundColor: '#0ea5e9',
                          },
                          headerTintColor: '#ffffff',
                          headerTitleStyle: {
                            fontFamily: 'Poppins-SemiBold',
                          },
                        }}
                      />
                      
                      <Stack.Screen
                        name="achievement-detail"
                        options={{
                          presentation: 'modal',
                          headerShown: true,
                          headerTitle: 'Logro Desbloqueado',
                          headerStyle: {
                            backgroundColor: '#d946ef',
                          },
                          headerTintColor: '#ffffff',
                          headerTitleStyle: {
                            fontFamily: 'Poppins-SemiBold',
                          },
                        }}
                      />
                      
                      <Stack.Screen
                        name="user-profile"
                        options={{
                          presentation: 'modal',
                          headerShown: true,
                          headerTitle: 'Perfil de Usuario',
                          headerStyle: {
                            backgroundColor: '#ffffff',
                          },
                          headerTintColor: '#1f2937',
                          headerTitleStyle: {
                            fontFamily: 'Poppins-SemiBold',
                          },
                        }}
                      />
                      
                      <Stack.Screen
                        name="event-details"
                        options={{
                          headerShown: true,
                          headerTitle: 'Detalles del Evento',
                          headerStyle: {
                            backgroundColor: '#ffffff',
                          },
                          headerTintColor: '#1f2937',
                          headerTitleStyle: {
                            fontFamily: 'Poppins-SemiBold',
                          },
                          headerBackTitleVisible: false,
                        }}
                      />
                      
                      <Stack.Screen
                        name="ar-experience"
                        options={{
                          presentation: 'fullScreenModal',
                          headerShown: false,
                          animation: 'fade',
                        }}
                      />
                      
                      <Stack.Screen
                        name="leaderboard"
                        options={{
                          headerShown: true,
                          headerTitle: 'Clasificación',
                          headerStyle: {
                            backgroundColor: '#f97316',
                          },
                          headerTintColor: '#ffffff',
                          headerTitleStyle: {
                            fontFamily: 'Poppins-Bold',
                          },
                        }}
                      />
                      
                      {/* Onboarding */}
                      <Stack.Screen
                        name="onboarding"
                        options={{
                          headerShown: false,
                          gestureEnabled: false,
                          animation: 'fade',
                        }}
                      />
                      
                      {/* Error screens */}
                      <Stack.Screen
                        name="error"
                        options={{
                          headerShown: true,
                          headerTitle: 'Error',
                          presentation: 'modal',
                        }}
                      />
                      
                      {/* Settings */}
                      <Stack.Screen
                        name="settings"
                        options={{
                          headerShown: true,
                          headerTitle: 'Configuración',
                          headerStyle: {
                            backgroundColor: '#ffffff',
                          },
                          headerTintColor: '#1f2937',
                          headerTitleStyle: {
                            fontFamily: 'Poppins-SemiBold',
                          },
                        }}
                      />
                    </Stack>
                    
                    {/* Toast messages */}
                    <Toast config={toastConfig} />
                  </NotificationProvider>
                </NFCProvider>
              </EventProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
