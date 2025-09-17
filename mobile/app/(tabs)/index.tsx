import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { 
  SparklesIcon, 
  UserGroupIcon, 
  MapPinIcon,
  TrophyIcon,
  BoltIcon,
  QrCodeIcon 
} from 'react-native-heroicons/outline';

// Components
import { EventHeader } from '@/components/dashboard/EventHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LiveActivity } from '@/components/dashboard/LiveActivity';
import { NearbyUsers } from '@/components/dashboard/NearbyUsers';
import { AchievementProgress } from '@/components/dashboard/AchievementProgress';
import { EventSchedule } from '@/components/dashboard/EventSchedule';
import { ConnectionsPreview } from '@/components/dashboard/ConnectionsPreview';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useEvent } from '@/hooks/useEvent';
import { useNFC } from '@/hooks/useNFC';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';

// Services
import { dashboardService } from '@/services/dashboardService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const { currentEvent, isLoading: eventLoading } = useEvent();
  const { isNFCEnabled, startNFCScanning } = useNFC();
  const { hasUnreadNotifications } = useNotifications();
  const { colors } = useTheme();

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos del dashboard
  const loadDashboardData = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const data = await dashboardService.getDashboardData(currentEvent?.id);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading dashboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentEvent?.id) {
      loadDashboardData();
    }
  }, [currentEvent?.id]);

  // Manejar pull to refresh
  const handleRefresh = () => {
    loadDashboardData(true);
  };

  // Acciones rápidas
  const quickActions = [
    {
      id: 'nfc-scan',
      title: 'Conectar NFC',
      subtitle: 'Toca para conectar',
      icon: QrCodeIcon,
      color: colors.primary,
      onPress: startNFCScanning,
      disabled: !isNFCEnabled,
    },
    {
      id: 'nearby',
      title: 'Personas cerca',
      subtitle: `${dashboardData?.nearbyCount || 0} personas`,
      icon: MapPinIcon,
      color: colors.secondary,
      onPress: () => {/* Navigate to nearby users */},
    },
    {
      id: 'achievements',
      title: 'Mis logros',
      subtitle: `${dashboardData?.achievementCount || 0}/20`,
      icon: TrophyIcon,
      color: colors.accent,
      onPress: () => {/* Navigate to achievements */},
    },
    {
      id: 'leaderboard',
      title: 'Clasificación',
      subtitle: `#${dashboardData?.leaderboardPosition || '--'}`,
      icon: BoltIcon,
      color: colors.warning,
      onPress: () => {/* Navigate to leaderboard */},
    },
  ];

  if (eventLoading || isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <LoadingSpinner size="large" />
        <Text className="mt-4 text-gray-600 font-medium">
          Cargando tu evento...
        </Text>
      </SafeAreaView>
    );
  }

  if (!currentEvent) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50 px-6">
        <View className="bg-white p-8 rounded-2xl shadow-soft">
          <SparklesIcon size={48} color={colors.primary} className="mx-auto mb-4" />
          <Text className="text-xl font-bold text-center mb-2">
            ¡Bienvenido a Syntra!
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            No tienes ningún evento activo. Escanea tu pulsera NFC o contacta con el organizador.
          </Text>
          <Pressable
            className="bg-primary-500 py-3 px-6 rounded-xl"
            onPress={startNFCScanning}
          >
            <Text className="text-white font-semibold text-center">
              Escanear NFC
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header con información del evento */}
          <Animatable.View animation="fadeInDown" duration={800}>
            <EventHeader 
              event={currentEvent}
              user={user}
              hasNotifications={hasUnreadNotifications}
            />
          </Animatable.View>

          {/* Actividad en vivo */}
          {dashboardData?.liveActivity && (
            <Animatable.View 
              animation="fadeInUp" 
              duration={800} 
              delay={100}
              className="px-4 mb-6"
            >
              <LiveActivity activity={dashboardData.liveActivity} />
            </Animatable.View>
          )}

          {/* Acciones rápidas */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={800} 
            delay={200}
            className="px-4 mb-6"
          >
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Acciones rápidas
            </Text>
            <QuickActions actions={quickActions} />
          </Animatable.View>

          {/* Personas cerca */}
          {dashboardData?.nearbyUsers && dashboardData.nearbyUsers.length > 0 && (
            <Animatable.View 
              animation="fadeInUp" 
              duration={800} 
              delay={300}
              className="mb-6"
            >
              <NearbyUsers users={dashboardData.nearbyUsers} />
            </Animatable.View>
          )}

          {/* Progreso de logros */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={800} 
            delay={400}
            className="px-4 mb-6"
          >
            <AchievementProgress 
              achievements={dashboardData?.recentAchievements || []}
              totalProgress={dashboardData?.achievementProgress || 0}
            />
          </Animatable.View>

          {/* Preview de conexiones */}
          {dashboardData?.recentConnections && (
            <Animatable.View 
              animation="fadeInUp" 
              duration={800} 
              delay={500}
              className="px-4 mb-6"
            >
              <ConnectionsPreview connections={dashboardData.recentConnections} />
            </Animatable.View>
          )}

          {/* Programa del evento */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={800} 
            delay={600}
            className="px-4 mb-8"
          >
            <EventSchedule 
              schedule={dashboardData?.upcomingSchedule || []}
              currentTime={new Date()}
            />
          </Animatable.View>

          {/* Espaciado inferior para el tab bar */}
          <View className="h-6" />
        </ScrollView>

        {/* Botón flotante de NFC */}
        {isNFCEnabled && (
          <Animatable.View
            animation="bounceIn"
            duration={1000}
            delay={800}
            className="absolute bottom-24 right-6"
          >
            <Pressable
              onPress={startNFCScanning}
              className="w-16 h-16 rounded-full shadow-lg active:scale-95"
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-full h-full rounded-full items-center justify-center"
              >
                <QrCodeIcon size={28} color="white" />
              </LinearGradient>
            </Pressable>
          </Animatable.View>
        )}

        {/* Indicador de estado NFC */}
        {!isNFCEnabled && (
          <View className="absolute bottom-24 right-6 bg-red-500 px-3 py-2 rounded-full">
            <Text className="text-white text-xs font-medium">
              NFC desactivado
            </Text>
          </View>
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}
