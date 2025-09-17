import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { 
  CreditCardIcon,
  PlusIcon,
  ClockIcon,
  ShoppingBagIcon,
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  QrCodeIcon
} from 'react-native-heroicons/outline';

// Components
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useEvent } from '@/hooks/useEvent';
import { useFestivalTokens } from '@/hooks/useFestivalTokens';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
  const { user } = useAuth();
  const { currentEvent } = useEvent();
  const { colors } = useTheme();
  const {
    walletBalance,
    isLoadingWallet,
    spendingHistory,
    isLoadingHistory,
    festivalPass,
    refreshWallet,
    purchaseTokens,
    loadSpendingHistory,
    loadFestivalPass,
    formatTokens,
    canAfford,
  } = useFestivalTokens();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load festival data when event changes
  useEffect(() => {
    if (currentEvent?.id) {
      loadFestivalPass(currentEvent.id);
    }
  }, [currentEvent?.id, loadFestivalPass]);

  // Handle pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshWallet(),
      loadSpendingHistory(),
      currentEvent?.id ? loadFestivalPass(currentEvent.id) : Promise.resolve(),
    ]);
    setIsRefreshing(false);
  };

  // Handle token purchase
  const handlePurchaseTokens = () => {
    Alert.alert(
      'Comprar Tokens',
      '¿Cuántos tokens quieres comprar?',
      [
        { text: 'Cancelar' },
        { 
          text: '10€ (10 tokens)', 
          onPress: () => purchaseTokens(10, 'CREDIT_CARD') 
        },
        { 
          text: '25€ (25 tokens)', 
          onPress: () => purchaseTokens(25, 'CREDIT_CARD') 
        },
        { 
          text: '50€ (50 tokens)', 
          onPress: () => purchaseTokens(50, 'CREDIT_CARD') 
        },
      ]
    );
  };

  if (isLoadingWallet && !walletBalance) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <LoadingSpinner size="large" />
        <Text className="mt-4 text-gray-600 font-medium">
          Cargando tu wallet...
        </Text>
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
          {/* Header */}
          <Animatable.View animation="fadeInDown" duration={800} className="px-6 pt-4 pb-6">
            <Text className="text-2xl font-bold text-gray-900">
              Festival Wallet
            </Text>
            <Text className="text-gray-600 mt-1">
              Paga en cualquier festival con tokens
            </Text>
          </Animatable.View>

          {/* Wallet Balance Card */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={800} 
            delay={100}
            className="mx-6 mb-6"
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-6 shadow-lg"
            >
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-white/80 text-sm font-medium">
                    Balance Total
                  </Text>
                  <Text className="text-white text-3xl font-bold mt-1">
                    {walletBalance ? formatTokens(walletBalance.tokenBalance) : '0 tokens'}
                  </Text>
                  <Text className="text-white/80 text-sm mt-2">
                    ≈ €{walletBalance?.tokenBalance || 0}
                  </Text>
                </View>
                <View className="bg-white/20 p-3 rounded-full">
                  <CreditCardIcon size={24} color="white" />
                </View>
              </View>

              {/* Daily Limit Progress */}
              {walletBalance && (
                <View className="mt-6">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-white/80 text-sm">
                      Gasto diario
                    </Text>
                    <Text className="text-white text-sm">
                      €{walletBalance.dailySpentToday} / €{walletBalance.dailyLimit}
                    </Text>
                  </View>
                  <View className="bg-white/20 h-2 rounded-full">
                    <View 
                      className="bg-white h-full rounded-full"
                      style={{ 
                        width: `${Math.min((walletBalance.dailySpentToday / walletBalance.dailyLimit) * 100, 100)}%` 
                      }}
                    />
                  </View>
                  {!walletBalance.canSpend && (
                    <Text className="text-yellow-300 text-xs mt-2">
                      ⚠️ Límite diario alcanzado
                    </Text>
                  )}
                </View>
              )}

              {/* Quick Actions */}
              <View className="flex-row mt-6 space-x-3">
                <Pressable
                  onPress={handlePurchaseTokens}
                  className="flex-1 bg-white/20 rounded-xl py-3 px-4 flex-row items-center justify-center active:scale-95"
                >
                  <PlusIcon size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Comprar
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={() => {/* Navigate to QR scanner */}}
                  className="flex-1 bg-white/20 rounded-xl py-3 px-4 flex-row items-center justify-center active:scale-95"
                >
                  <QrCodeIcon size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Pagar NFC
                  </Text>
                </Pressable>
              </View>
            </LinearGradient>
          </Animatable.View>

          {/* Festival Pass */}
          {festivalPass && (
            <Animatable.View 
              animation="fadeInUp" 
              duration={800} 
              delay={200}
              className="mx-6 mb-6"
            >
              <View className="bg-white rounded-2xl p-6 shadow-soft">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-lg font-bold text-gray-900">
                      Pase del Festival
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      {festivalPass.event.name}
                    </Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${
                    festivalPass.type === 'VIP' ? 'bg-yellow-100' :
                    festivalPass.type === 'BACKSTAGE' ? 'bg-purple-100' :
                    'bg-blue-100'
                  }`}>
                    <Text className={`text-xs font-semibold ${
                      festivalPass.type === 'VIP' ? 'text-yellow-800' :
                      festivalPass.type === 'BACKSTAGE' ? 'text-purple-800' :
                      'text-blue-800'
                    }`}>
                      {festivalPass.type}
                    </Text>
                  </View>
                </View>

                {festivalPass.tokenBalance > 0 && (
                  <View className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <Text className="text-gray-700 text-sm">
                      Tokens específicos del festival: {formatTokens(festivalPass.tokenBalance)}
                    </Text>
                  </View>
                )}
              </View>
            </Animatable.View>
          )}

          {/* Quick Stats */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={800} 
            delay={300}
            className="mx-6 mb-6"
          >
            <View className="flex-row space-x-3">
              <View className="flex-1 bg-white rounded-xl p-4 shadow-soft">
                <View className="flex-row items-center">
                  <View className="bg-green-100 p-2 rounded-full">
                    <ArrowUpIcon size={16} color="#22c55e" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-gray-600 text-xs">
                      Gastado hoy
                    </Text>
                    <Text className="text-gray-900 font-bold">
                      {walletBalance ? formatTokens(walletBalance.dailySpentToday) : '0'}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-1 bg-white rounded-xl p-4 shadow-soft">
                <View className="flex-row items-center">
                  <View className="bg-blue-100 p-2 rounded-full">
                    <ShoppingBagIcon size={16} color="#3b82f6" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-gray-600 text-xs">
                      Compras
                    </Text>
                    <Text className="text-gray-900 font-bold">
                      {spendingHistory.length}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Animatable.View>

          {/* Recent Transactions */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={800} 
            delay={400}
            className="mx-6 mb-6"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">
                Transacciones Recientes
              </Text>
              <Pressable onPress={() => {/* Navigate to full history */}}>
                <Text className="text-primary-600 font-medium">
                  Ver todas
                </Text>
              </Pressable>
            </View>

            <View className="bg-white rounded-2xl shadow-soft">
              {isLoadingHistory ? (
                <View className="p-6 items-center">
                  <LoadingSpinner size="small" />
                  <Text className="text-gray-600 text-sm mt-2">
                    Cargando historial...
                  </Text>
                </View>
              ) : spendingHistory.length === 0 ? (
                <View className="p-6 items-center">
                  <ShoppingBagIcon size={48} color="#9ca3af" />
                  <Text className="text-gray-600 text-center mt-4">
                    No hay transacciones aún
                  </Text>
                  <Text className="text-gray-500 text-sm text-center mt-1">
                    Tus compras aparecerán aquí
                  </Text>
                </View>
              ) : (
                <View>
                  {spendingHistory.slice(0, 5).map((transaction, index) => (
                    <View 
                      key={transaction.id}
                      className={`p-4 flex-row items-center justify-between ${
                        index < spendingHistory.slice(0, 5).length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="bg-red-100 p-2 rounded-full">
                          <ArrowDownIcon size={16} color="#ef4444" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-gray-900 font-medium">
                            {transaction.vendorName}
                          </Text>
                          <Text className="text-gray-600 text-sm">
                            {transaction.productName || transaction.vendorCategory}
                          </Text>
                          <Text className="text-gray-500 text-xs">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-red-600 font-bold">
                          -{formatTokens(transaction.tokenAmount)}
                        </Text>
                        {transaction.quantity > 1 && (
                          <Text className="text-gray-500 text-xs">
                            x{transaction.quantity}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Animatable.View>

          {/* Promociones */}
          <Animatable.View 
            animation="fadeInUp" 
            duration={800} 
            delay={500}
            className="mx-6 mb-8"
          >
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Promociones
            </Text>
            
            <View className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6">
              <View className="flex-row items-center">
                <TrophyIcon size={24} color="#f59e0b" />
                <Text className="text-yellow-800 font-bold text-lg ml-3">
                  ¡Bonus por conectar!
                </Text>
              </View>
              <Text className="text-yellow-700 mt-2">
                Gana 5 tokens extra por cada nueva conexión NFC que hagas en el festival
              </Text>
              <Pressable className="bg-yellow-500 rounded-xl py-3 px-4 mt-4 active:scale-95">
                <Text className="text-white font-semibold text-center">
                  Saber más
                </Text>
              </Pressable>
            </View>
          </Animatable.View>

          {/* Espaciado inferior para el tab bar */}
          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
