import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { 
  HomeIcon, 
  UserGroupIcon, 
  TrophyIcon, 
  MapIcon,
  UserIcon 
} from 'react-native-heroicons/outline';
import { 
  HomeIcon as HomeIconSolid, 
  UserGroupIcon as UserGroupIconSolid, 
  TrophyIcon as TrophyIconSolid, 
  MapIcon as MapIconSolid,
  UserIcon as UserIconSolid 
} from 'react-native-heroicons/solid';

import { useTheme } from '@/hooks/useTheme';
import { TabBarBadge } from '@/components/ui/TabBarBadge';
import { useNotificationBadge } from '@/hooks/useNotificationBadge';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { 
    unreadConnections, 
    unreadAchievements, 
    unreadNotifications 
  } = useNotificationBadge();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 88 : 68,
          elevation: 8,
          shadowColor: colors.shadow,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      {/* Home - Dashboard principal */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused, color, size }) => (
            focused ? 
              <HomeIconSolid size={size} color={color} /> : 
              <HomeIcon size={size} color={color} />
          ),
          tabBarBadge: unreadNotifications > 0 ? (
            <TabBarBadge count={unreadNotifications} />
          ) : undefined,
        }}
      />

      {/* Connections - Networking y conexiones */}
      <Tabs.Screen
        name="connections"
        options={{
          title: 'Conexiones',
          tabBarIcon: ({ focused, color, size }) => (
            focused ? 
              <UserGroupIconSolid size={size} color={color} /> : 
              <UserGroupIcon size={size} color={color} />
          ),
          tabBarBadge: unreadConnections > 0 ? (
            <TabBarBadge count={unreadConnections} />
          ) : undefined,
        }}
      />

      {/* Map - Mapa del evento y ubicaciones */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ focused, color, size }) => (
            focused ? 
              <MapIconSolid size={size} color={color} /> : 
              <MapIcon size={size} color={color} />
          ),
        }}
      />

      {/* Achievements - Gamificación y logros */}
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Logros',
          tabBarIcon: ({ focused, color, size }) => (
            focused ? 
              <TrophyIconSolid size={size} color={color} /> : 
              <TrophyIcon size={size} color={color} />
          ),
          tabBarBadge: unreadAchievements > 0 ? (
            <TabBarBadge count={unreadAchievements} />
          ) : undefined,
        }}
      />

      {/* Profile - Perfil del usuario */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused, color, size }) => (
            focused ? 
              <UserIconSolid size={size} color={color} /> : 
              <UserIcon size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
