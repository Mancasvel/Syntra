import { useState, useEffect, useCallback } from 'react';
import Purchases, { 
  CustomerInfo, 
  Offerings, 
  PurchasesPackage,
  PurchasesEntitlementInfo,
  PURCHASE_TYPE
} from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import Toast from 'react-native-toast-message';

import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';

export interface RevenueCatConfig {
  apiKey: string;
  userId?: string;
  attributes?: Record<string, string>;
}

export interface SubscriptionPlan {
  identifier: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
    introPrice?: {
      price: number;
      priceString: string;
      cycles: number;
      period: string;
      periodUnit: string;
      periodNumberOfUnits: number;
    };
  };
}

export interface SubscriptionStatus {
  isActive: boolean;
  productId?: string;
  expirationDate?: Date;
  originalPurchaseDate?: Date;
  latestPurchaseDate?: Date;
  willRenew: boolean;
  isInGracePeriod: boolean;
  unsubscribeDetectedAt?: Date;
  billingIssueDetectedAt?: Date;
  isSandbox: boolean;
  store: string;
}

export interface UseRevenueCatReturn {
  // Initialization
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Customer data
  customerInfo: CustomerInfo | null;
  subscriptionStatus: SubscriptionStatus | null;
  
  // Offerings
  offerings: Offerings | null;
  availablePlans: SubscriptionPlan[];
  
  // Actions
  initialize: (config: RevenueCatConfig) => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshCustomerInfo: () => Promise<void>;
  
  // Subscription utilities
  hasActiveSubscription: boolean;
  hasEntitlement: (entitlementId: string) => boolean;
  getEntitlement: (entitlementId: string) => PurchasesEntitlementInfo | null;
  isSubscriptionExpired: boolean;
  daysUntilExpiration: number | null;
  
  // Plan utilities
  getMonthlyPlan: () => SubscriptionPlan | null;
  getYearlyPlan: () => SubscriptionPlan | null;
  getPlanById: (planId: string) => SubscriptionPlan | null;
}

export function useRevenueCat(): UseRevenueCatReturn {
  const { user } = useAuth();
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<Offerings | null>(null);

  // Initialize RevenueCat
  const initialize = useCallback(async (config: RevenueCatConfig) => {
    try {
      setIsLoading(true);
      setError(null);

      // Configure RevenueCat
      await Purchases.configure({
        apiKey: config.apiKey,
        appUserId: config.userId || user?.id,
        observerMode: false,
        userDefaultsSuiteName: undefined,
        useAmazon: false,
      });

      // Set debug mode in development
      if (__DEV__) {
        await Purchases.setLogLevel('DEBUG');
      }

      // Set user attributes
      if (config.attributes) {
        await Purchases.setAttributes(config.attributes);
      }

      // Get initial data
      const [customerData, offeringsData] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      setCustomerInfo(customerData);
      setOfferings(offeringsData);
      setIsInitialized(true);

      logger.info('RevenueCat initialized successfully', {
        userId: config.userId || user?.id,
        hasOfferings: Object.keys(offeringsData.all).length > 0,
        activeEntitlements: Object.keys(customerData.entitlements.active).length,
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize RevenueCat';
      setError(errorMessage);
      logger.error('RevenueCat initialization failed:', err);
      
      Toast.show({
        type: 'error',
        text1: 'Error de inicialización',
        text2: 'No se pudo conectar con el servicio de suscripciones',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Purchase a package
  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      logger.info('Attempting to purchase package:', {
        identifier: pkg.identifier,
        productId: pkg.product.identifier,
        price: pkg.product.priceString,
      });

      const { customerInfo: updatedInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(updatedInfo);

      // Check if purchase was successful
      const hasActiveEntitlements = Object.keys(updatedInfo.entitlements.active).length > 0;
      
      if (hasActiveEntitlements) {
        Toast.show({
          type: 'success',
          text1: '¡Suscripción activada!',
          text2: 'Ya puedes disfrutar de todas las funciones premium',
        });

        logger.info('Purchase completed successfully', {
          activeEntitlements: Object.keys(updatedInfo.entitlements.active),
        });

        return true;
      } else {
        throw new Error('Purchase completed but no active entitlements found');
      }

    } catch (err: any) {
      let errorMessage = 'Error al procesar la compra';
      let shouldShowAlert = true;

      // Handle specific error cases
      if (err.userCancelled) {
        errorMessage = 'Compra cancelada';
        shouldShowAlert = false; // User intentionally cancelled
      } else if (err.code === 'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE') {
        errorMessage = 'Producto no disponible';
      } else if (err.code === 'PAYMENT_PENDING') {
        errorMessage = 'Pago pendiente de procesamiento';
        Toast.show({
          type: 'info',
          text1: 'Pago pendiente',
          text2: 'Tu compra está siendo procesada',
        });
        shouldShowAlert = false;
      } else if (err.code === 'INVALID_RECEIPT') {
        errorMessage = 'Error en el recibo de compra';
      } else if (err.code === 'INSUFFICIENT_PERMISSIONS') {
        errorMessage = 'Permisos insuficientes para realizar la compra';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      logger.error('Purchase failed:', {
        error: err,
        code: err.code,
        userCancelled: err.userCancelled,
      });

      if (shouldShowAlert) {
        Alert.alert(
          'Error en la compra',
          errorMessage,
          [{ text: 'OK' }]
        );
      }

      return false;

    } finally {
      setIsLoading(false);
    }
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      logger.info('Attempting to restore purchases');

      const customerData = await Purchases.restorePurchases();
      setCustomerInfo(customerData);

      // Check if any entitlements were restored
      const hasActiveEntitlements = Object.keys(customerData.entitlements.active).length > 0;
      
      if (hasActiveEntitlements) {
        Toast.show({
          type: 'success',
          text1: 'Compras restauradas',
          text2: 'Tus suscripciones han sido restauradas exitosamente',
        });

        logger.info('Purchases restored successfully', {
          activeEntitlements: Object.keys(customerData.entitlements.active),
        });

        return true;
      } else {
        Toast.show({
          type: 'info',
          text1: 'Sin compras previas',
          text2: 'No se encontraron suscripciones anteriores',
        });

        logger.info('No previous purchases found to restore');
        return false;
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Error al restaurar compras';
      setError(errorMessage);
      logger.error('Restore purchases failed:', err);

      Alert.alert(
        'Error al restaurar',
        errorMessage,
        [{ text: 'OK' }]
      );

      return false;

    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh customer info
  const refreshCustomerInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const customerData = await Purchases.getCustomerInfo();
      setCustomerInfo(customerData);
      logger.debug('Customer info refreshed');
    } catch (err: any) {
      logger.error('Failed to refresh customer info:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Computed subscription status
  const subscriptionStatus: SubscriptionStatus | null = React.useMemo(() => {
    if (!customerInfo) return null;

    const activeEntitlements = customerInfo.entitlements.active;
    const hasActive = Object.keys(activeEntitlements).length > 0;
    
    if (!hasActive) {
      return {
        isActive: false,
        willRenew: false,
        isInGracePeriod: false,
        isSandbox: false,
        store: 'unknown',
      };
    }

    // Get the primary entitlement (usually the first one)
    const primaryEntitlement = Object.values(activeEntitlements)[0];
    
    return {
      isActive: true,
      productId: primaryEntitlement.productIdentifier,
      expirationDate: primaryEntitlement.expirationDate ? new Date(primaryEntitlement.expirationDate) : undefined,
      originalPurchaseDate: primaryEntitlement.originalPurchaseDate ? new Date(primaryEntitlement.originalPurchaseDate) : undefined,
      latestPurchaseDate: primaryEntitlement.latestPurchaseDate ? new Date(primaryEntitlement.latestPurchaseDate) : undefined,
      willRenew: primaryEntitlement.willRenew,
      isInGracePeriod: primaryEntitlement.isInGracePeriod,
      unsubscribeDetectedAt: primaryEntitlement.unsubscribeDetectedAt ? new Date(primaryEntitlement.unsubscribeDetectedAt) : undefined,
      billingIssueDetectedAt: primaryEntitlement.billingIssueDetectedAt ? new Date(primaryEntitlement.billingIssueDetectedAt) : undefined,
      isSandbox: primaryEntitlement.isSandbox,
      store: primaryEntitlement.store,
    };
  }, [customerInfo]);

  // Available subscription plans
  const availablePlans: SubscriptionPlan[] = React.useMemo(() => {
    if (!offerings?.current) return [];

    const plans: SubscriptionPlan[] = [];
    
    // Extract packages from current offering
    Object.values(offerings.current.availablePackages).forEach(pkg => {
      plans.push({
        identifier: pkg.identifier,
        product: {
          identifier: pkg.product.identifier,
          description: pkg.product.description,
          title: pkg.product.title,
          price: pkg.product.price,
          priceString: pkg.product.priceString,
          currencyCode: pkg.product.currencyCode,
          introPrice: pkg.product.introPrice ? {
            price: pkg.product.introPrice.price,
            priceString: pkg.product.introPrice.priceString,
            cycles: pkg.product.introPrice.cycles,
            period: pkg.product.introPrice.period,
            periodUnit: pkg.product.introPrice.periodUnit,
            periodNumberOfUnits: pkg.product.introPrice.periodNumberOfUnits,
          } : undefined,
        },
      });
    });

    return plans;
  }, [offerings]);

  // Utility functions
  const hasActiveSubscription = React.useMemo(() => {
    return subscriptionStatus?.isActive ?? false;
  }, [subscriptionStatus]);

  const hasEntitlement = useCallback((entitlementId: string): boolean => {
    if (!customerInfo) return false;
    return entitlementId in customerInfo.entitlements.active;
  }, [customerInfo]);

  const getEntitlement = useCallback((entitlementId: string): PurchasesEntitlementInfo | null => {
    if (!customerInfo) return null;
    return customerInfo.entitlements.active[entitlementId] || null;
  }, [customerInfo]);

  const isSubscriptionExpired = React.useMemo(() => {
    if (!subscriptionStatus?.expirationDate) return false;
    return subscriptionStatus.expirationDate < new Date();
  }, [subscriptionStatus]);

  const daysUntilExpiration = React.useMemo(() => {
    if (!subscriptionStatus?.expirationDate) return null;
    
    const now = new Date();
    const expiration = subscriptionStatus.expirationDate;
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }, [subscriptionStatus]);

  // Plan utility functions
  const getMonthlyPlan = useCallback((): SubscriptionPlan | null => {
    return availablePlans.find(plan => 
      plan.identifier.toLowerCase().includes('monthly') ||
      plan.identifier.toLowerCase().includes('month')
    ) || null;
  }, [availablePlans]);

  const getYearlyPlan = useCallback((): SubscriptionPlan | null => {
    return availablePlans.find(plan => 
      plan.identifier.toLowerCase().includes('yearly') ||
      plan.identifier.toLowerCase().includes('year') ||
      plan.identifier.toLowerCase().includes('annual')
    ) || null;
  }, [availablePlans]);

  const getPlanById = useCallback((planId: string): SubscriptionPlan | null => {
    return availablePlans.find(plan => plan.identifier === planId) || null;
  }, [availablePlans]);

  // Auto-initialize when user is available
  useEffect(() => {
    if (user && !isInitialized) {
      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
        android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
      });

      if (apiKey) {
        initialize({
          apiKey,
          userId: user.id,
          attributes: {
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          },
        });
      }
    }
  }, [user, isInitialized, initialize]);

  // Set up customer info update listener
  useEffect(() => {
    if (!isInitialized) return;

    const subscription = Purchases.addCustomerInfoUpdateListener((info) => {
      logger.debug('Customer info updated via listener');
      setCustomerInfo(info);
    });

    return () => {
      subscription.remove();
    };
  }, [isInitialized]);

  return {
    // Initialization
    isInitialized,
    isLoading,
    error,
    
    // Customer data
    customerInfo,
    subscriptionStatus,
    
    // Offerings
    offerings,
    availablePlans,
    
    // Actions
    initialize,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
    
    // Subscription utilities
    hasActiveSubscription,
    hasEntitlement,
    getEntitlement,
    isSubscriptionExpired,
    daysUntilExpiration,
    
    // Plan utilities
    getMonthlyPlan,
    getYearlyPlan,
    getPlanById,
  };
}

export default useRevenueCat;
