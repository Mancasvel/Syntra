import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

import { useAuth } from './useAuth';
import { useNFC } from './useNFC';
import { apiService } from '@/services/apiService';
import { logger } from '@/utils/logger';

export interface WalletBalance {
  tokenBalance: number;
  currency: string;
  dailySpentToday: number;
  dailyLimit: number;
  canSpend: boolean;
}

export interface FestivalVendor {
  id: string;
  name: string;
  type: string;
  category: string;
  location?: string;
  acceptsTokens: boolean;
  tokenRate: number;
  products: VendorProduct[];
}

export interface VendorProduct {
  id: string;
  name: string;
  description?: string;
  priceTokens: number;
  priceEur?: number;
  isAvailable: boolean;
  stock?: number;
  images: string[];
}

export interface SpendingHistoryItem {
  id: string;
  tokenAmount: number;
  quantity: number;
  vendorName: string;
  vendorCategory: string;
  productName?: string;
  eventName: string;
  createdAt: string;
}

export interface FestivalPass {
  id: string;
  type: 'GENERAL_ADMISSION' | 'VIP' | 'BACKSTAGE' | 'PRESS' | 'ARTIST' | 'STAFF';
  tokenBalance: number;
  isActive: boolean;
  canReload: boolean;
  activatedAt?: string;
  expiresAt?: string;
  event: {
    name: string;
    startDate: string;
    endDate: string;
  };
}

export interface UseFestivalTokensReturn {
  // Wallet state
  walletBalance: WalletBalance | null;
  isLoadingWallet: boolean;
  
  // Vendors and products
  vendors: FestivalVendor[];
  isLoadingVendors: boolean;
  
  // Spending history
  spendingHistory: SpendingHistoryItem[];
  isLoadingHistory: boolean;
  
  // Festival pass
  festivalPass: FestivalPass | null;
  isLoadingPass: boolean;
  
  // Actions
  refreshWallet: () => Promise<void>;
  purchaseTokens: (amount: number, paymentMethod: string) => Promise<boolean>;
  spendTokens: (vendorId: string, amount: number, productId?: string) => Promise<boolean>;
  processNFCPayment: (vendorId: string, amount: number, productId?: string) => Promise<boolean>;
  loadVendors: (eventId: string) => Promise<void>;
  loadSpendingHistory: () => Promise<void>;
  loadFestivalPass: (eventId: string) => Promise<void>;
  
  // Utilities
  canAfford: (amount: number) => boolean;
  formatTokens: (amount: number) => string;
  getVendorById: (vendorId: string) => FestivalVendor | null;
  getProductById: (productId: string) => VendorProduct | null;
}

export function useFestivalTokens(): UseFestivalTokensReturn {
  const { user } = useAuth();
  const { startNFCScanning, isNFCEnabled } = useNFC();
  
  // State
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [vendors, setVendors] = useState<FestivalVendor[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [spendingHistory, setSpendingHistory] = useState<SpendingHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [festivalPass, setFestivalPass] = useState<FestivalPass | null>(null);
  const [isLoadingPass, setIsLoadingPass] = useState(false);

  // ============================================
  // WALLET OPERATIONS
  // ============================================

  const refreshWallet = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingWallet(true);
      const response = await apiService.get('/festival-tokens/wallet/balance');
      setWalletBalance(response.data);
    } catch (error: any) {
      logger.error('Error refreshing wallet:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo actualizar el balance del wallet',
      });
    } finally {
      setIsLoadingWallet(false);
    }
  }, [user]);

  const purchaseTokens = useCallback(async (
    amount: number,
    paymentMethod: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoadingWallet(true);

      const response = await apiService.post('/festival-tokens/purchase', {
        amount,
        paymentMethod,
      });

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: '¡Tokens comprados!',
          text2: `Se agregaron ${amount} tokens a tu wallet`,
        });

        // Refresh wallet balance
        await refreshWallet();
        
        // Haptic feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        return true;
      } else {
        throw new Error(response.data.message || 'Purchase failed');
      }

    } catch (error: any) {
      logger.error('Error purchasing tokens:', error);
      
      Alert.alert(
        'Error en la compra',
        error.message || 'No se pudieron comprar los tokens',
        [{ text: 'OK' }]
      );
      
      return false;
    } finally {
      setIsLoadingWallet(false);
    }
  }, [user, refreshWallet]);

  // ============================================
  // SPENDING OPERATIONS
  // ============================================

  const spendTokens = useCallback(async (
    vendorId: string,
    amount: number,
    productId?: string
  ): Promise<boolean> => {
    if (!user || !walletBalance) return false;

    // Check if user can afford
    if (walletBalance.tokenBalance < amount) {
      Alert.alert(
        'Saldo insuficiente',
        'No tienes suficientes tokens para esta compra',
        [
          { text: 'Cancelar' },
          { 
            text: 'Comprar tokens', 
            onPress: () => {
              // Navigate to token purchase screen
            }
          }
        ]
      );
      return false;
    }

    // Check daily limit
    if (!walletBalance.canSpend) {
      Alert.alert(
        'Límite diario alcanzado',
        'Has alcanzado tu límite de gasto diario',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      const response = await apiService.post('/festival-tokens/spend', {
        vendorId,
        tokenAmount: amount,
        productId,
      });

      if (response.data.success) {
        const vendor = getVendorById(vendorId);
        const product = productId ? getProductById(productId) : null;
        
        Toast.show({
          type: 'success',
          text1: 'Compra exitosa',
          text2: `${amount} tokens gastados en ${vendor?.name || 'vendor'}`,
        });

        // Refresh data
        await Promise.all([
          refreshWallet(),
          loadSpendingHistory(),
        ]);
        
        // Haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        return true;
      } else {
        throw new Error(response.data.message || 'Spending failed');
      }

    } catch (error: any) {
      logger.error('Error spending tokens:', error);
      
      Alert.alert(
        'Error en la compra',
        error.message || 'No se pudo procesar la compra',
        [{ text: 'OK' }]
      );
      
      return false;
    }
  }, [user, walletBalance, refreshWallet, loadSpendingHistory]);

  const processNFCPayment = useCallback(async (
    vendorId: string,
    amount: number,
    productId?: string
  ): Promise<boolean> => {
    if (!isNFCEnabled) {
      Alert.alert(
        'NFC no disponible',
        'Habilita NFC para usar pagos con pulsera',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      // Show confirmation
      return new Promise((resolve) => {
        const vendor = getVendorById(vendorId);
        const product = productId ? getProductById(productId) : null;
        
        Alert.alert(
          'Confirmar pago NFC',
          `¿Pagar ${amount} tokens en ${vendor?.name || 'vendor'}${product ? ` por ${product.name}` : ''}?`,
          [
            {
              text: 'Cancelar',
              onPress: () => resolve(false),
            },
            {
              text: 'Pagar',
              onPress: async () => {
                try {
                  const response = await apiService.post('/festival-tokens/nfc-payment', {
                    vendorId,
                    amount,
                    productId,
                  });

                  if (response.data.success) {
                    Toast.show({
                      type: 'success',
                      text1: 'Pago NFC exitoso',
                      text2: `${amount} tokens debitados`,
                    });

                    // Refresh data
                    await Promise.all([
                      refreshWallet(),
                      loadSpendingHistory(),
                    ]);
                    
                    // Strong haptic feedback for NFC payment
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    
                    resolve(true);
                  } else {
                    throw new Error(response.data.message || 'NFC payment failed');
                  }
                } catch (error: any) {
                  logger.error('Error processing NFC payment:', error);
                  Alert.alert('Error', error.message || 'Pago NFC falló');
                  resolve(false);
                }
              },
            },
          ]
        );
      });

    } catch (error: any) {
      logger.error('Error with NFC payment:', error);
      return false;
    }
  }, [isNFCEnabled, refreshWallet, loadSpendingHistory]);

  // ============================================
  // DATA LOADING
  // ============================================

  const loadVendors = useCallback(async (eventId: string) => {
    try {
      setIsLoadingVendors(true);
      const response = await apiService.get(`/festival-tokens/vendors/${eventId}`);
      setVendors(response.data);
    } catch (error: any) {
      logger.error('Error loading vendors:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron cargar los vendors del festival',
      });
    } finally {
      setIsLoadingVendors(false);
    }
  }, []);

  const loadSpendingHistory = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingHistory(true);
      const response = await apiService.get('/festival-tokens/spending-history');
      setSpendingHistory(response.data);
    } catch (error: any) {
      logger.error('Error loading spending history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  const loadFestivalPass = useCallback(async (eventId: string) => {
    if (!user) return;

    try {
      setIsLoadingPass(true);
      const response = await apiService.get(`/festival-tokens/pass/${eventId}`);
      setFestivalPass(response.data);
    } catch (error: any) {
      logger.error('Error loading festival pass:', error);
      // Don't show error toast as pass might not exist
    } finally {
      setIsLoadingPass(false);
    }
  }, [user]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const canAfford = useCallback((amount: number): boolean => {
    return walletBalance ? walletBalance.tokenBalance >= amount && walletBalance.canSpend : false;
  }, [walletBalance]);

  const formatTokens = useCallback((amount: number): string => {
    return `${amount.toLocaleString()} tokens`;
  }, []);

  const getVendorById = useCallback((vendorId: string): FestivalVendor | null => {
    return vendors.find(vendor => vendor.id === vendorId) || null;
  }, [vendors]);

  const getProductById = useCallback((productId: string): VendorProduct | null => {
    for (const vendor of vendors) {
      const product = vendor.products.find(p => p.id === productId);
      if (product) return product;
    }
    return null;
  }, [vendors]);

  // ============================================
  // EFFECTS
  // ============================================

  // Load wallet balance when user is available
  useEffect(() => {
    if (user) {
      refreshWallet();
    }
  }, [user, refreshWallet]);

  // Load spending history when user is available
  useEffect(() => {
    if (user) {
      loadSpendingHistory();
    }
  }, [user, loadSpendingHistory]);

  // Periodic wallet refresh
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshWallet();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [user, refreshWallet]);

  return {
    // Wallet state
    walletBalance,
    isLoadingWallet,
    
    // Vendors and products
    vendors,
    isLoadingVendors,
    
    // Spending history
    spendingHistory,
    isLoadingHistory,
    
    // Festival pass
    festivalPass,
    isLoadingPass,
    
    // Actions
    refreshWallet,
    purchaseTokens,
    spendTokens,
    processNFCPayment,
    loadVendors,
    loadSpendingHistory,
    loadFestivalPass,
    
    // Utilities
    canAfford,
    formatTokens,
    getVendorById,
    getProductById,
  };
}

export default useFestivalTokens;
