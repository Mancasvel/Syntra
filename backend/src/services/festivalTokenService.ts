import { 
  User, 
  DigitalWallet, 
  TokenPurchase, 
  TokenTransaction, 
  FestivalVendor, 
  FestivalSpending, 
  NFCDevice,
  Event 
} from '@/models';
import { revenueCatService } from './revenueCatService';
import { logger } from '@/utils/logger';
import mongoose from 'mongoose';

export interface TokenPurchaseRequest {
  userId: string;
  amount: number; // EUR amount
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'APPLE_PAY' | 'GOOGLE_PAY';
  cardLast4?: string;
}

export interface TokenSpendingRequest {
  userId: string;
  vendorId: string;
  productId?: string;
  tokenAmount: number;
  quantity?: number;
  eventId: string;
  deviceId?: string; // NFC device used for payment
}

export interface WalletBalance {
  tokenBalance: number;
  currency: string;
  dailySpentToday: number;
  dailyLimit: number;
  canSpend: boolean;
}

export interface FestivalVendorInfo {
  id: string;
  name: string;
  type: string;
  category: string;
  location?: string;
  acceptsTokens: boolean;
  tokenRate: number;
  products: {
    id: string;
    name: string;
    description?: string;
    priceTokens: number;
    priceEur?: number;
    isAvailable: boolean;
    stock?: number;
    images: string[];
  }[];
}

class FestivalTokenService {
  constructor() {
    // No need for client initialization with Mongoose
  }

  // ============================================
  // WALLET MANAGEMENT
  // ============================================

  async createWallet(userId: string): Promise<any> {
    try {
      const wallet = new DigitalWallet({
        userId: new mongoose.Types.ObjectId(userId),
        tokenBalance: 0,
        currency: 'EUR',
        isActive: true,
        dailySpendLimit: 100,
      });

      await wallet.save();

      logger.info(`Digital wallet created for user ${userId}`);
      return wallet;
    } catch (error) {
      logger.error(`Error creating wallet for user ${userId}:`, error);
      throw error;
    }
  }

  async getWalletBalance(userId: string): Promise<WalletBalance> {
    try {
      let wallet = await DigitalWallet.findOne({ userId: new mongoose.Types.ObjectId(userId) });

      // Create wallet if doesn't exist
      if (!wallet) {
        wallet = await this.createWallet(userId);
      }

      // Calculate daily spending
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dailySpending = await TokenTransaction.aggregate([
        {
          $match: {
            walletId: wallet._id,
            type: 'SPENDING',
            createdAt: {
              $gte: today,
              $lt: tomorrow,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
          },
        },
      ]);

      const dailySpentToday = dailySpending[0]?.totalAmount || 0;
      const canSpend = dailySpentToday < wallet.dailySpendLimit;

      return {
        tokenBalance: wallet.tokenBalance,
        currency: wallet.currency,
        dailySpentToday,
        dailyLimit: wallet.dailySpendLimit,
        canSpend,
      };
    } catch (error) {
      logger.error(`Error getting wallet balance for user ${userId}:`, error);
      throw error;
    }
  }

  // ============================================
  // TOKEN PURCHASES
  // ============================================

  async purchaseTokens(request: TokenPurchaseRequest): Promise<any> {
    try {
      const { userId, amount, paymentMethod, cardLast4 } = request;

      // Get or create wallet
      let wallet = await this.prisma.digitalWallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await this.createWallet(userId);
      }

      // Calculate token amount (1 EUR = 1 token for simplicity)
      const tokenAmount = amount;
      const exchangeRate = 1;

      // Process payment through RevenueCat (for subscription users) or direct payment
      let paymentId: string | undefined;
      
      try {
        // Here you would integrate with your payment processor
        // For now, we'll simulate successful payment
        paymentId = `payment_${Date.now()}`;
      } catch (paymentError) {
        logger.error('Payment processing failed:', paymentError);
        throw new Error('Payment processing failed');
      }

      // Create token purchase record
      const tokenPurchase = await this.prisma.tokenPurchase.create({
        data: {
          walletId: wallet.id,
          amount,
          tokenAmount,
          currency: 'EUR',
          exchangeRate,
          paymentMethod,
          paymentId,
          cardLast4,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update wallet balance
      await this.prisma.digitalWallet.update({
        where: { id: wallet.id },
        data: {
          tokenBalance: {
            increment: tokenAmount,
          },
        },
      });

      // Create transaction record
      await this.prisma.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'PURCHASE',
          amount: tokenAmount,
          description: `Token purchase - ${amount} EUR`,
        },
      });

      logger.info(`Token purchase completed: ${tokenAmount} tokens for user ${userId}`);
      return tokenPurchase;

    } catch (error) {
      logger.error('Error purchasing tokens:', error);
      throw error;
    }
  }

  // ============================================
  // FESTIVAL SPENDING
  // ============================================

  async spendTokens(request: TokenSpendingRequest): Promise<any> {
    try {
      const { userId, vendorId, productId, tokenAmount, quantity = 1, eventId, deviceId } = request;

      // Get wallet
      const wallet = await this.prisma.digitalWallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error('Digital wallet not found');
      }

      // Check balance
      if (Number(wallet.tokenBalance) < tokenAmount) {
        throw new Error('Insufficient token balance');
      }

      // Check daily limit
      const walletBalance = await this.getWalletBalance(userId);
      if (!walletBalance.canSpend) {
        throw new Error('Daily spending limit reached');
      }

      // Verify vendor exists and accepts tokens
      const vendor = await this.prisma.festivalVendor.findUnique({
        where: { id: vendorId },
        include: {
          products: productId ? {
            where: { id: productId },
          } : false,
        },
      });

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      if (!vendor.acceptsTokens) {
        throw new Error('Vendor does not accept tokens');
      }

      // Verify product if specified
      if (productId) {
        const product = vendor.products?.[0];
        if (!product) {
          throw new Error('Product not found');
        }
        if (!product.isAvailable) {
          throw new Error('Product not available');
        }
        if (product.stock !== null && product.stock < quantity) {
          throw new Error('Insufficient stock');
        }
      }

      // Process transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create spending record
        const spending = await tx.festivalSpending.create({
          data: {
            walletId: wallet.id,
            vendorId,
            productId,
            tokenAmount,
            quantity,
            eventId,
            deviceId,
          },
        });

        // Update wallet balance
        await tx.digitalWallet.update({
          where: { id: wallet.id },
          data: {
            tokenBalance: {
              decrement: tokenAmount,
            },
          },
        });

        // Create transaction record
        await tx.tokenTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'SPENDING',
            amount: tokenAmount,
            description: `Purchase at ${vendor.name}`,
            eventId,
            vendorId,
          },
        });

        // Update product stock if applicable
        if (productId) {
          await tx.vendorProduct.update({
            where: { id: productId },
            data: {
              stock: {
                decrement: quantity,
              },
            },
          });
        }

        return spending;
      });

      logger.info(`Token spending completed: ${tokenAmount} tokens at vendor ${vendorId} for user ${userId}`);
      return result;

    } catch (error) {
      logger.error('Error spending tokens:', error);
      throw error;
    }
  }

  // ============================================
  // NFC PAYMENT INTEGRATION
  // ============================================

  async processNFCPayment(
    deviceId: string,
    vendorId: string,
    amount: number,
    productId?: string
  ): Promise<any> {
    try {
      // Get device and user info
      const device = await this.prisma.nFCDevice.findUnique({
        where: { deviceId },
        include: {
          user: true,
          event: true,
        },
      });

      if (!device || !device.user || !device.event) {
        throw new Error('Invalid NFC device or not associated with user/event');
      }

      // Process token spending
      const spending = await this.spendTokens({
        userId: device.user.id,
        vendorId,
        productId,
        tokenAmount: amount,
        eventId: device.event.id,
        deviceId,
      });

      // Send real-time notification
      // socketService.emitToUser(device.user.id, 'payment-processed', {
      //   amount,
      //   vendor: vendorId,
      //   timestamp: new Date(),
      // });

      return spending;

    } catch (error) {
      logger.error('Error processing NFC payment:', error);
      throw error;
    }
  }

  // ============================================
  // VENDOR MANAGEMENT
  // ============================================

  async getFestivalVendors(eventId: string): Promise<FestivalVendorInfo[]> {
    try {
      const vendors = await this.prisma.festivalVendor.findMany({
        where: { eventId },
        include: {
          products: {
            where: { isAvailable: true },
          },
        },
      });

      return vendors.map(vendor => ({
        id: vendor.id,
        name: vendor.name,
        type: vendor.type,
        category: vendor.category,
        location: vendor.location,
        acceptsTokens: vendor.acceptsTokens,
        tokenRate: Number(vendor.tokenRate),
        products: vendor.products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          priceTokens: Number(product.priceTokens),
          priceEur: product.priceEur ? Number(product.priceEur) : undefined,
          isAvailable: product.isAvailable,
          stock: product.stock,
          images: product.images,
        })),
      }));

    } catch (error) {
      logger.error(`Error getting festival vendors for event ${eventId}:`, error);
      throw error;
    }
  }

  async createFestivalVendor(vendorData: {
    name: string;
    description?: string;
    type: string;
    category: string;
    eventId: string;
    location?: string;
    tokenRate?: number;
  }): Promise<any> {
    try {
      const vendor = await this.prisma.festivalVendor.create({
        data: {
          ...vendorData,
          acceptsTokens: true,
          tokenRate: vendorData.tokenRate || 1,
        },
      });

      logger.info(`Festival vendor created: ${vendor.name} for event ${vendorData.eventId}`);
      return vendor;

    } catch (error) {
      logger.error('Error creating festival vendor:', error);
      throw error;
    }
  }

  // ============================================
  // ANALYTICS AND REPORTING
  // ============================================

  async getSpendingAnalytics(eventId: string): Promise<any> {
    try {
      const analytics = await this.prisma.festivalSpending.groupBy({
        by: ['vendorId'],
        where: { eventId },
        _sum: {
          tokenAmount: true,
        },
        _count: {
          id: true,
        },
      });

      // Get vendor names
      const vendorIds = analytics.map(item => item.vendorId);
      const vendors = await this.prisma.festivalVendor.findMany({
        where: { id: { in: vendorIds } },
        select: { id: true, name: true, category: true },
      });

      const vendorMap = new Map(vendors.map(v => [v.id, v]));

      return analytics.map(item => ({
        vendorId: item.vendorId,
        vendorName: vendorMap.get(item.vendorId)?.name || 'Unknown',
        category: vendorMap.get(item.vendorId)?.category || 'Unknown',
        totalTokens: Number(item._sum.tokenAmount || 0),
        totalTransactions: item._count.id,
      }));

    } catch (error) {
      logger.error(`Error getting spending analytics for event ${eventId}:`, error);
      throw error;
    }
  }

  async getUserSpendingHistory(userId: string, limit: number = 50): Promise<any> {
    try {
      const wallet = await this.prisma.digitalWallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return [];
      }

      const history = await this.prisma.festivalSpending.findMany({
        where: { walletId: wallet.id },
        include: {
          vendor: {
            select: { name: true, category: true },
          },
          product: {
            select: { name: true },
          },
          event: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return history.map(spending => ({
        id: spending.id,
        tokenAmount: Number(spending.tokenAmount),
        quantity: spending.quantity,
        vendorName: spending.vendor.name,
        vendorCategory: spending.vendor.category,
        productName: spending.product?.name,
        eventName: spending.event.name,
        createdAt: spending.createdAt,
      }));

    } catch (error) {
      logger.error(`Error getting spending history for user ${userId}:`, error);
      throw error;
    }
  }

  // ============================================
  // FESTIVAL PASSES
  // ============================================

  async createFestivalPass(
    userId: string,
    eventId: string,
    type: 'GENERAL_ADMISSION' | 'VIP' | 'BACKSTAGE' | 'PRESS' | 'ARTIST' | 'STAFF',
    tokenBalance: number = 0
  ): Promise<any> {
    try {
      const pass = await this.prisma.festivalPass.create({
        data: {
          userId,
          eventId,
          type,
          tokenBalance,
          isActive: true,
          canReload: true,
          activatedAt: new Date(),
        },
      });

      logger.info(`Festival pass created: ${type} for user ${userId} at event ${eventId}`);
      return pass;

    } catch (error) {
      logger.error('Error creating festival pass:', error);
      throw error;
    }
  }

  async getFestivalPass(userId: string, eventId: string): Promise<any> {
    try {
      return await this.prisma.festivalPass.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
        include: {
          event: {
            select: { name: true, startDate: true, endDate: true },
          },
        },
      });

    } catch (error) {
      logger.error(`Error getting festival pass for user ${userId} at event ${eventId}:`, error);
      throw error;
    }
  }

  // ============================================
  // REWARDS AND BONUSES
  // ============================================

  async addTokenReward(
    userId: string,
    amount: number,
    description: string,
    eventId?: string
  ): Promise<void> {
    try {
      const wallet = await this.prisma.digitalWallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error('Digital wallet not found');
      }

      await this.prisma.$transaction(async (tx) => {
        // Update wallet balance
        await tx.digitalWallet.update({
          where: { id: wallet.id },
          data: {
            tokenBalance: {
              increment: amount,
            },
          },
        });

        // Create transaction record
        await tx.tokenTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'REWARD',
            amount,
            description,
            eventId,
          },
        });
      });

      logger.info(`Token reward added: ${amount} tokens for user ${userId} - ${description}`);

    } catch (error) {
      logger.error('Error adding token reward:', error);
      throw error;
    }
  }
}

export const festivalTokenService = new FestivalTokenService();
export default festivalTokenService;
