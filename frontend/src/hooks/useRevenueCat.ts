import { useState, useEffect, useCallback } from 'react';
import { Purchases, CustomerInfo, Offering, PurchasesPackage } from '@revenuecat/purchases-js';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

export interface RevenueCatConfig {
  apiKey: string;
  userId?: string;
  attributes?: Record<string, string>;
}

export interface SubscriptionStatus {
  isActive: boolean;
  productId?: string;
  expirationDate?: Date;
  willRenew: boolean;
  isInGracePeriod: boolean;
  unsubscribeDetectedAt?: Date;
}

export interface UseRevenueCatReturn {
  // Status
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Customer info
  customerInfo: CustomerInfo | null;
  subscriptionStatus: SubscriptionStatus | null;
  
  // Offerings
  offerings: Offering[] | null;
  currentOffering: Offering | null;
  
  // Actions
  initialize: (config: RevenueCatConfig) => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  getCustomerInfo: () => Promise<void>;
  
  // Subscription checks
  hasActiveSubscription: boolean;
  hasEntitlement: (entitlementId: string) => boolean;
  isSubscriptionExpired: boolean;
  daysUntilExpiration: number | null;
}

export function useRevenueCat(): UseRevenueCatReturn {
  const { user } = useAuth();
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<Offering[] | null>(null);
  const [currentOffering, setCurrentOffering] = useState<Offering | null>(null);

  // Initialize RevenueCat
  const initialize = useCallback(async (config: RevenueCatConfig) => {
    try {
      setIsLoading(true);
      setError(null);

      // Configure RevenueCat
      await Purchases.configure({
        apiKey: config.apiKey,
        appUserId: config.userId || user?.id,
      });

      // Set user attributes
      if (config.attributes) {
        await Purchases.setAttributes(config.attributes);
      }

      // Get initial customer info
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      // Get offerings
      const offeringsData = await Purchases.getOfferings();
      setOfferings(Object.values(offeringsData.all));
      setCurrentOffering(offeringsData.current);

      setIsInitialized(true);
      console.log('RevenueCat initialized successfully');
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize RevenueCat';
      setError(errorMessage);
      console.error('RevenueCat initialization error:', err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Purchase a package
  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { customerInfo: updatedInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(updatedInfo);

      toast.success('¡Suscripción activada exitosamente!');
      return true;

    } catch (err: any) {
      let errorMessage = 'Error al procesar la compra';
      
      if (err.userCancelled) {
        errorMessage = 'Compra cancelada por el usuario';
      } else if (err.code === 'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE') {
        errorMessage = 'Producto no disponible para compra';
      } else if (err.code === 'PAYMENT_PENDING') {
        errorMessage = 'Pago pendiente de procesamiento';
      } else if (err.code === 'INVALID_RECEIPT') {
        errorMessage = 'Recibo de compra inválido';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
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

      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);

      // Check if any entitlements were restored
      const hasActiveEntitlements = Object.keys(info.entitlements.active).length > 0;
      
      if (hasActiveEntitlements) {
        toast.success('Compras restauradas exitosamente');
        return true;
      } else {
        toast.info('No se encontraron compras previas');
        return false;
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Error al restaurar compras';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;

    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get customer info
  const getCustomerInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err: any) {
      console.error('Error getting customer info:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Computed values
  const subscriptionStatus: SubscriptionStatus | null = React.useMemo(() => {
    if (!customerInfo) return null;

    const activeEntitlements = customerInfo.entitlements.active;
    const allEntitlements = customerInfo.entitlements.all;

    // Check if user has any active entitlements
    const hasActive = Object.keys(activeEntitlements).length > 0;
    
    if (!hasActive) {
      return {
        isActive: false,
        willRenew: false,
        isInGracePeriod: false,
      };
    }

    // Get the first active entitlement (assuming single subscription model)
    const firstEntitlement = Object.values(activeEntitlements)[0];
    
    return {
      isActive: true,
      productId: firstEntitlement.productIdentifier,
      expirationDate: firstEntitlement.expirationDate ? new Date(firstEntitlement.expirationDate) : undefined,
      willRenew: firstEntitlement.willRenew,
      isInGracePeriod: firstEntitlement.isInGracePeriod,
      unsubscribeDetectedAt: firstEntitlement.unsubscribeDetectedAt ? new Date(firstEntitlement.unsubscribeDetectedAt) : undefined,
    };
  }, [customerInfo]);

  const hasActiveSubscription = React.useMemo(() => {
    return subscriptionStatus?.isActive ?? false;
  }, [subscriptionStatus]);

  const hasEntitlement = useCallback((entitlementId: string): boolean => {
    if (!customerInfo) return false;
    return entitlementId in customerInfo.entitlements.active;
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

  // Auto-initialize if user is available
  useEffect(() => {
    if (user && !isInitialized && process.env.NEXT_PUBLIC_REVENUECAT_API_KEY) {
      initialize({
        apiKey: process.env.NEXT_PUBLIC_REVENUECAT_API_KEY,
        userId: user.id,
        attributes: {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        },
      });
    }
  }, [user, isInitialized, initialize]);

  // Refresh customer info periodically
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      getCustomerInfo();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [isInitialized, getCustomerInfo]);

  return {
    // Status
    isInitialized,
    isLoading,
    error,
    
    // Customer info
    customerInfo,
    subscriptionStatus,
    
    // Offerings
    offerings,
    currentOffering,
    
    // Actions
    initialize,
    purchasePackage,
    restorePurchases,
    getCustomerInfo,
    
    // Subscription checks
    hasActiveSubscription,
    hasEntitlement,
    isSubscriptionExpired,
    daysUntilExpiration,
  };
}

export default useRevenueCat;
