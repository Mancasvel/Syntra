import axios, { AxiosInstance } from 'axios';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export interface RevenueCatCustomer {
  app_user_id: string;
  subscriber: {
    entitlements: Record<string, RevenueCatEntitlement>;
    subscriptions: Record<string, RevenueCatSubscription>;
    non_subscriptions: Record<string, RevenueCatPurchase[]>;
    first_seen: string;
    last_seen: string;
    management_url: string;
    original_app_user_id: string;
    original_application_version: string;
    original_purchase_date: string;
    other_purchases: Record<string, RevenueCatPurchase[]>;
  };
}

export interface RevenueCatEntitlement {
  expires_date: string | null;
  grace_period_expires_date: string | null;
  product_identifier: string;
  purchase_date: string;
  billing_issues_detected_at: string | null;
  ownership_type: 'PURCHASED' | 'FAMILY_SHARED';
  store: 'app_store' | 'mac_app_store' | 'play_store' | 'stripe' | 'promotional';
  period_type: 'normal' | 'intro' | 'trial';
  unsubscribe_detected_at: string | null;
  original_purchase_date: string;
}

export interface RevenueCatSubscription {
  auto_resume_date: string | null;
  billing_issues_detected_at: string | null;
  expires_date: string;
  grace_period_expires_date: string | null;
  is_sandbox: boolean;
  original_purchase_date: string;
  ownership_type: 'PURCHASED' | 'FAMILY_SHARED';
  period_type: 'normal' | 'intro' | 'trial';
  purchase_date: string;
  refunded_at: string | null;
  store: 'app_store' | 'mac_app_store' | 'play_store' | 'stripe' | 'promotional';
  store_transaction_id: string;
  unsubscribe_detected_at: string | null;
}

export interface RevenueCatPurchase {
  id: string;
  is_sandbox: boolean;
  original_purchase_date: string;
  purchase_date: string;
  refunded_at: string | null;
  store: string;
  store_transaction_id: string;
}

export interface RevenueCatOffering {
  identifier: string;
  description: string;
  packages: RevenueCatPackage[];
  metadata: Record<string, any>;
}

export interface RevenueCatPackage {
  identifier: string;
  platform_product_identifier: string;
}

export interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    type: 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | 'UNCANCELLATION' | 
          'NON_RENEWING_PURCHASE' | 'EXPIRATION' | 'BILLING_ISSUE' | 
          'PRODUCT_CHANGE' | 'TRANSFER';
    id: string;
    event_timestamp_ms: number;
    app_id: string;
    app_user_id: string;
    aliases: string[];
    original_app_user_id: string;
    product_id: string;
    period_type: 'normal' | 'intro' | 'trial';
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    environment: 'SANDBOX' | 'PRODUCTION';
    entitlement_id: string | null;
    entitlement_ids: string[];
    presented_offering_id: string | null;
    transaction_id: string;
    original_transaction_id: string;
    is_family_share: boolean;
    country_code: string;
    app_version: string;
    currency: string;
    price: number;
    price_in_purchased_currency: number;
    subscriber_attributes: Record<string, any>;
    store: 'app_store' | 'mac_app_store' | 'play_store' | 'stripe' | 'promotional';
    takehome_percentage: number;
    offer_code: string | null;
    tax_percentage: number;
    commission_percentage: number;
  };
}

class RevenueCatService {
  private client: AxiosInstance;
  private isConfigured = false;

  constructor() {
    if (!config.REVENUECAT_API_KEY) {
      logger.warn('RevenueCat API key not configured');
      return;
    }

    this.client = axios.create({
      baseURL: 'https://api.revenuecat.com/v1',
      headers: {
        'Authorization': `Bearer ${config.REVENUECAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.setupInterceptors();
    this.isConfigured = true;
    logger.info('RevenueCat service configured');
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`RevenueCat API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('RevenueCat API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`RevenueCat API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('RevenueCat API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // CUSTOMER MANAGEMENT
  // ============================================

  async getCustomerInfo(appUserId: string): Promise<RevenueCatCustomer | null> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat service not configured');
    }

    try {
      const response = await this.client.get(`/subscribers/${appUserId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Customer doesn't exist
      }
      throw error;
    }
  }

  async createCustomer(appUserId: string, attributes: Record<string, any> = {}): Promise<RevenueCatCustomer> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat service not configured');
    }

    try {
      const response = await this.client.post(`/subscribers/${appUserId}`, {
        attributes,
      });
      return response.data;
    } catch (error) {
      logger.error(`Error creating RevenueCat customer ${appUserId}:`, error);
      throw error;
    }
  }

  async updateCustomerAttributes(appUserId: string, attributes: Record<string, any>): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat service not configured');
    }

    try {
      await this.client.post(`/subscribers/${appUserId}/attributes`, {
        attributes,
      });
      logger.info(`Updated RevenueCat customer attributes for ${appUserId}`);
    } catch (error) {
      logger.error(`Error updating RevenueCat customer attributes for ${appUserId}:`, error);
      throw error;
    }
  }

  // ============================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================

  async getActiveSubscriptions(appUserId: string): Promise<RevenueCatSubscription[]> {
    const customer = await this.getCustomerInfo(appUserId);
    if (!customer) return [];

    const now = new Date();
    const activeSubscriptions: RevenueCatSubscription[] = [];

    Object.values(customer.subscriber.subscriptions).forEach(subscription => {
      const expiresDate = new Date(subscription.expires_date);
      if (expiresDate > now && !subscription.unsubscribe_detected_at) {
        activeSubscriptions.push(subscription);
      }
    });

    return activeSubscriptions;
  }

  async getActiveEntitlements(appUserId: string): Promise<RevenueCatEntitlement[]> {
    const customer = await this.getCustomerInfo(appUserId);
    if (!customer) return [];

    const now = new Date();
    const activeEntitlements: RevenueCatEntitlement[] = [];

    Object.values(customer.subscriber.entitlements).forEach(entitlement => {
      if (!entitlement.expires_date) {
        // Lifetime entitlement
        activeEntitlements.push(entitlement);
      } else {
        const expiresDate = new Date(entitlement.expires_date);
        if (expiresDate > now) {
          activeEntitlements.push(entitlement);
        }
      }
    });

    return activeEntitlements;
  }

  async hasActiveSubscription(appUserId: string): Promise<boolean> {
    const activeSubscriptions = await this.getActiveSubscriptions(appUserId);
    return activeSubscriptions.length > 0;
  }

  async hasEntitlement(appUserId: string, entitlementId: string): Promise<boolean> {
    const customer = await this.getCustomerInfo(appUserId);
    if (!customer) return false;

    const entitlement = customer.subscriber.entitlements[entitlementId];
    if (!entitlement) return false;

    // Check if entitlement is active
    if (!entitlement.expires_date) return true; // Lifetime

    const now = new Date();
    const expiresDate = new Date(entitlement.expires_date);
    return expiresDate > now;
  }

  // ============================================
  // OFFERINGS AND PRODUCTS
  // ============================================

  async getOfferings(): Promise<RevenueCatOffering[]> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat service not configured');
    }

    try {
      const response = await this.client.get('/offerings');
      return response.data.offerings || [];
    } catch (error) {
      logger.error('Error fetching RevenueCat offerings:', error);
      throw error;
    }
  }

  // ============================================
  // PURCHASE VALIDATION
  // ============================================

  async validatePurchase(
    appUserId: string,
    receiptData: string,
    store: 'app_store' | 'play_store'
  ): Promise<RevenueCatCustomer> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat service not configured');
    }

    try {
      const endpoint = store === 'app_store' 
        ? `/subscribers/${appUserId}/receipts`
        : `/subscribers/${appUserId}/receipts`;

      const response = await this.client.post(endpoint, {
        fetch_token: receiptData,
      });

      logger.info(`Purchase validated for user ${appUserId} on ${store}`);
      return response.data;
    } catch (error) {
      logger.error(`Error validating purchase for ${appUserId}:`, error);
      throw error;
    }
  }

  // ============================================
  // WEBHOOK HANDLING
  // ============================================

  async handleWebhook(webhookData: RevenueCatWebhookEvent): Promise<void> {
    const { event } = webhookData;
    const { type, app_user_id, product_id } = event;

    logger.info(`Processing RevenueCat webhook: ${type} for user ${app_user_id}`);

    try {
      switch (type) {
        case 'INITIAL_PURCHASE':
          await this.handleInitialPurchase(event);
          break;
        case 'RENEWAL':
          await this.handleRenewal(event);
          break;
        case 'CANCELLATION':
          await this.handleCancellation(event);
          break;
        case 'UNCANCELLATION':
          await this.handleUncancellation(event);
          break;
        case 'EXPIRATION':
          await this.handleExpiration(event);
          break;
        case 'BILLING_ISSUE':
          await this.handleBillingIssue(event);
          break;
        case 'PRODUCT_CHANGE':
          await this.handleProductChange(event);
          break;
        default:
          logger.warn(`Unhandled webhook event type: ${type}`);
      }
    } catch (error) {
      logger.error(`Error processing webhook event ${type}:`, error);
      throw error;
    }
  }

  private async handleInitialPurchase(event: RevenueCatWebhookEvent['event']): Promise<void> {
    // Update user subscription status in database
    // Send welcome email
    // Unlock premium features
    logger.info(`Initial purchase processed for user ${event.app_user_id}`);
  }

  private async handleRenewal(event: RevenueCatWebhookEvent['event']): Promise<void> {
    // Update subscription renewal date
    // Send renewal confirmation
    logger.info(`Renewal processed for user ${event.app_user_id}`);
  }

  private async handleCancellation(event: RevenueCatWebhookEvent['event']): Promise<void> {
    // Mark subscription as cancelled
    // Send cancellation email
    // Schedule feature downgrade at expiration
    logger.info(`Cancellation processed for user ${event.app_user_id}`);
  }

  private async handleUncancellation(event: RevenueCatWebhookEvent['event']): Promise<void> {
    // Reactivate subscription
    // Send reactivation email
    logger.info(`Uncancellation processed for user ${event.app_user_id}`);
  }

  private async handleExpiration(event: RevenueCatWebhookEvent['event']): Promise<void> {
    // Downgrade user to free tier
    // Send expiration notification
    logger.info(`Expiration processed for user ${event.app_user_id}`);
  }

  private async handleBillingIssue(event: RevenueCatWebhookEvent['event']): Promise<void> {
    // Send billing issue notification
    // Provide grace period if configured
    logger.info(`Billing issue processed for user ${event.app_user_id}`);
  }

  private async handleProductChange(event: RevenueCatWebhookEvent['event']): Promise<void> {
    // Update subscription tier
    // Adjust feature access
    logger.info(`Product change processed for user ${event.app_user_id}`);
  }

  // ============================================
  // ANALYTICS AND REPORTING
  // ============================================

  async getSubscriptionMetrics(startDate: Date, endDate: Date): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat service not configured');
    }

    try {
      const response = await this.client.get('/charts/metrics', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching subscription metrics:', error);
      throw error;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  isSubscriptionActive(subscription: RevenueCatSubscription): boolean {
    const now = new Date();
    const expiresDate = new Date(subscription.expires_date);
    return expiresDate > now && !subscription.unsubscribe_detected_at;
  }

  getSubscriptionStatus(subscription: RevenueCatSubscription): 'active' | 'cancelled' | 'expired' | 'billing_issue' {
    const now = new Date();
    const expiresDate = new Date(subscription.expires_date);

    if (subscription.billing_issues_detected_at) {
      return 'billing_issue';
    }

    if (subscription.unsubscribe_detected_at) {
      return 'cancelled';
    }

    if (expiresDate <= now) {
      return 'expired';
    }

    return 'active';
  }

  formatPrice(price: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  }
}

export const revenueCatService = new RevenueCatService();
export default revenueCatService;
