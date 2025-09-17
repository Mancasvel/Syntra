import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { auth } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { festivalTokenService } from '@/services/festivalTokenService';

const router = Router();

// Middleware para validar errores
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array(),
    });
  }
  next();
};

// ============================================
// WALLET ENDPOINTS
// ============================================

/**
 * GET /api/v1/festival-tokens/wallet/balance
 * Get user's wallet balance
 */
router.get('/wallet/balance', auth, async (req: any, res: any) => {
  try {
    const balance = await festivalTokenService.getWalletBalance(req.user.id);
    
    res.json({
      success: true,
      data: balance,
    });
  } catch (error: any) {
    logger.error('Error getting wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting wallet balance',
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/festival-tokens/purchase
 * Purchase tokens with payment method
 */
router.post(
  '/purchase',
  auth,
  [
    body('amount')
      .isFloat({ min: 1, max: 1000 })
      .withMessage('Amount must be between 1 and 1000 EUR'),
    body('paymentMethod')
      .isIn(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY'])
      .withMessage('Invalid payment method'),
    body('cardLast4')
      .optional()
      .isLength({ min: 4, max: 4 })
      .withMessage('Card last 4 digits must be 4 characters'),
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { amount, paymentMethod, cardLast4 } = req.body;
      
      const purchase = await festivalTokenService.purchaseTokens({
        userId: req.user.id,
        amount,
        paymentMethod,
        cardLast4,
      });

      res.json({
        success: true,
        message: 'Tokens purchased successfully',
        data: purchase,
      });
    } catch (error: any) {
      logger.error('Error purchasing tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Error purchasing tokens',
        error: error.message,
      });
    }
  }
);

// ============================================
// SPENDING ENDPOINTS
// ============================================

/**
 * POST /api/v1/festival-tokens/spend
 * Spend tokens at a vendor
 */
router.post(
  '/spend',
  auth,
  [
    body('vendorId')
      .isMongoId()
      .withMessage('Invalid vendor ID'),
    body('tokenAmount')
      .isFloat({ min: 0.01 })
      .withMessage('Token amount must be greater than 0'),
    body('productId')
      .optional()
      .isString()
      .withMessage('Invalid product ID'),
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('eventId')
      .isMongoId()
      .withMessage('Invalid event ID'),
    body('deviceId')
      .optional()
      .isMongoId()
      .withMessage('Invalid device ID'),
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { vendorId, tokenAmount, productId, quantity, eventId, deviceId } = req.body;
      
      const spending = await festivalTokenService.spendTokens({
        userId: req.user.id,
        vendorId,
        tokenAmount,
        productId,
        quantity,
        eventId,
        deviceId,
      });

      res.json({
        success: true,
        message: 'Tokens spent successfully',
        data: spending,
      });
    } catch (error: any) {
      logger.error('Error spending tokens:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error spending tokens',
      });
    }
  }
);

/**
 * POST /api/v1/festival-tokens/nfc-payment
 * Process NFC payment with device ID
 */
router.post(
  '/nfc-payment',
  auth,
  [
    body('vendorId')
      .isMongoId()
      .withMessage('Invalid vendor ID'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('productId')
      .optional()
      .isString()
      .withMessage('Invalid product ID'),
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { vendorId, amount, productId } = req.body;
      
      // Get user's NFC device (assuming one active device per user per event)
      // In a real implementation, you'd determine the device from the NFC tap
      const deviceId = req.headers['x-device-id'] || req.body.deviceId;
      
      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: 'NFC device ID required for payment',
        });
      }

      const payment = await festivalTokenService.processNFCPayment(
        deviceId,
        vendorId,
        amount,
        productId
      );

      res.json({
        success: true,
        message: 'NFC payment processed successfully',
        data: payment,
      });
    } catch (error: any) {
      logger.error('Error processing NFC payment:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error processing NFC payment',
      });
    }
  }
);

// ============================================
// VENDOR ENDPOINTS
// ============================================

/**
 * GET /api/v1/festival-tokens/vendors/:eventId
 * Get all vendors for an event
 */
router.get(
  '/vendors/:eventId',
  [
    param('eventId')
      .isMongoId()
      .withMessage('Invalid event ID'),
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { eventId } = req.params;
      
      const vendors = await festivalTokenService.getFestivalVendors(eventId);

      res.json({
        success: true,
        data: vendors,
      });
    } catch (error: any) {
      logger.error('Error getting festival vendors:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting festival vendors',
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/v1/festival-tokens/vendors
 * Create a new festival vendor (admin only)
 */
router.post(
  '/vendors',
  auth,
  [
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Vendor name must be between 2 and 100 characters'),
    body('type')
      .isIn(['FOOD_TRUCK', 'BAR', 'MERCHANDISE', 'SERVICES', 'GAMES', 'EXPERIENCES'])
      .withMessage('Invalid vendor type'),
    body('category')
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be between 2 and 50 characters'),
    body('eventId')
      .isMongoId()
      .withMessage('Invalid event ID'),
    body('tokenRate')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Token rate must be greater than 0'),
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const vendorData = req.body;
      
      const vendor = await festivalTokenService.createFestivalVendor(vendorData);

      res.status(201).json({
        success: true,
        message: 'Festival vendor created successfully',
        data: vendor,
      });
    } catch (error: any) {
      logger.error('Error creating festival vendor:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating festival vendor',
        error: error.message,
      });
    }
  }
);

// ============================================
// HISTORY AND ANALYTICS ENDPOINTS
// ============================================

/**
 * GET /api/v1/festival-tokens/spending-history
 * Get user's spending history
 */
router.get(
  '/spending-history',
  auth,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      
      const history = await festivalTokenService.getUserSpendingHistory(req.user.id, limit);

      res.json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      logger.error('Error getting spending history:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting spending history',
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/v1/festival-tokens/analytics/:eventId
 * Get spending analytics for an event (organizers only)
 */
router.get(
  '/analytics/:eventId',
  auth,
  [
    param('eventId')
      .isMongoId()
      .withMessage('Invalid event ID'),
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { eventId } = req.params;
      
      // TODO: Add authorization check for event organizers
      
      const analytics = await festivalTokenService.getSpendingAnalytics(eventId);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      logger.error('Error getting spending analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting spending analytics',
        error: error.message,
      });
    }
  }
);

// ============================================
// FESTIVAL PASS ENDPOINTS
// ============================================

/**
 * GET /api/v1/festival-tokens/pass/:eventId
 * Get user's festival pass for an event
 */
router.get(
  '/pass/:eventId',
  auth,
  [
    param('eventId')
      .isMongoId()
      .withMessage('Invalid event ID'),
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { eventId } = req.params;
      
      const pass = await festivalTokenService.getFestivalPass(req.user.id, eventId);

      if (!pass) {
        return res.status(404).json({
          success: false,
          message: 'Festival pass not found',
        });
      }

      res.json({
        success: true,
        data: pass,
      });
    } catch (error: any) {
      logger.error('Error getting festival pass:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting festival pass',
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/v1/festival-tokens/pass
 * Create a festival pass for user
 */
router.post(
  '/pass',
  auth,
  [
    body('eventId')
      .isMongoId()
      .withMessage('Invalid event ID'),
    body('type')
      .isIn(['GENERAL_ADMISSION', 'VIP', 'BACKSTAGE', 'PRESS', 'ARTIST', 'STAFF'])
      .withMessage('Invalid pass type'),
    body('tokenBalance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Token balance must be 0 or greater'),
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { eventId, type, tokenBalance = 0 } = req.body;
      
      const pass = await festivalTokenService.createFestivalPass(
        req.user.id,
        eventId,
        type,
        tokenBalance
      );

      res.status(201).json({
        success: true,
        message: 'Festival pass created successfully',
        data: pass,
      });
    } catch (error: any) {
      logger.error('Error creating festival pass:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating festival pass',
        error: error.message,
      });
    }
  }
);

// ============================================
// REWARDS ENDPOINTS
// ============================================

/**
 * POST /api/v1/festival-tokens/reward
 * Add token reward to user (internal/admin use)
 */
router.post(
  '/reward',
  auth,
  [
    body('userId')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Reward amount must be greater than 0'),
    body('description')
      .isLength({ min: 5, max: 200 })
      .withMessage('Description must be between 5 and 200 characters'),
    body('eventId')
      .optional()
      .isMongoId()
      .withMessage('Invalid event ID'),
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { userId, amount, description, eventId } = req.body;
      
      // TODO: Add admin authorization check
      
      await festivalTokenService.addTokenReward(userId, amount, description, eventId);

      res.json({
        success: true,
        message: 'Token reward added successfully',
      });
    } catch (error: any) {
      logger.error('Error adding token reward:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding token reward',
        error: error.message,
      });
    }
  }
);

export default router;
