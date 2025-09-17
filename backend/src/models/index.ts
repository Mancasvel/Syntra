import mongoose from 'mongoose';

// ============================================
// USER MODELS
// ============================================

const UserSchema = new mongoose.Schema({
  // Identificación
  email: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  
  // Información personal
  firstName: String,
  lastName: String,
  avatar: String,
  bio: String,
  
  // Configuración
  role: { type: String, enum: ['USER', 'ORGANIZER', 'ADMIN'], default: 'USER' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  
  // Preferencias
  preferences: {
    notifications: { type: Boolean, default: true },
    privacy: { type: String, enum: ['PUBLIC', 'FRIENDS', 'PRIVATE'], default: 'PUBLIC' },
    language: { type: String, default: 'es' },
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: Date,
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes para performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

export const User = mongoose.model('User', UserSchema);

// ============================================
// EVENT MODELS
// ============================================

const EventSchema = new mongoose.Schema({
  // Información básica
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['CONFERENCE', 'FESTIVAL', 'CORPORATE', 'WEDDING', 'OTHER'], required: true },
  category: String,
  
  // Fechas y ubicación
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  timezone: { type: String, default: 'Europe/Madrid' },
  
  location: {
    name: String,
    address: String,
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number,
    }
  },
  
  // Configuración
  isPublic: { type: Boolean, default: true },
  requiresApproval: { type: Boolean, default: false },
  maxAttendees: Number,
  currentAttendees: { type: Number, default: 0 },
  
  // Organizador
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Configuración NFC
  nfcConfig: {
    enabled: { type: Boolean, default: true },
    autoConnect: { type: Boolean, default: true },
    vibrationEnabled: { type: Boolean, default: true },
    soundEnabled: { type: Boolean, default: true },
  },
  
  // Festival Tokens
  tokenConfig: {
    enabled: { type: Boolean, default: false },
    tokenName: { type: String, default: 'Tokens' },
    exchangeRate: { type: Number, default: 1 }, // 1 EUR = X tokens
    dailyLimit: { type: Number, default: 100 },
    vendorCommission: { type: Number, default: 0.03 }, // 3%
  },
  
  // Gamificación
  gamificationConfig: {
    enabled: { type: Boolean, default: true },
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
    leaderboardEnabled: { type: Boolean, default: true },
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'events'
});

// Indexes para performance
EventSchema.index({ organizerId: 1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ type: 1 });
EventSchema.index({ 'location.city': 1 });
EventSchema.index({ isPublic: 1, startDate: 1 });

export const Event = mongoose.model('Event', EventSchema);

// ============================================
// NFC DEVICE MODELS
// ============================================

const NFCDeviceSchema = new mongoose.Schema({
  // Identificación del device
  deviceId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['WRISTBAND', 'CARD', 'STICKER', 'RING', 'CUSTOM'], required: true },
  
  // Asociaciones
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  
  // Configuración del device
  isActive: { type: Boolean, default: true },
  batteryLevel: Number, // Para devices con batería
  
  // Datos almacenados en el NFC
  nfcData: {
    profileData: {
      name: String,
      title: String,
      company: String,
      contact: {
        email: String,
        phone: String,
        linkedin: String,
        twitter: String,
      }
    },
    preferences: {
      autoShare: { type: Boolean, default: true },
      vibrationEnabled: { type: Boolean, default: true },
      soundEnabled: { type: Boolean, default: true },
    }
  },
  
  // Festival Tokens (NUEVA FUNCIONALIDAD)
  tokenData: {
    enabled: { type: Boolean, default: false },
    lastBalance: { type: Number, default: 0 },
    lastSync: Date,
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastSync: Date,
}, {
  timestamps: true,
  collection: 'nfc_devices'
});

// Indexes
NFCDeviceSchema.index({ deviceId: 1 });
NFCDeviceSchema.index({ userId: 1 });
NFCDeviceSchema.index({ eventId: 1 });
NFCDeviceSchema.index({ userId: 1, eventId: 1 });

export const NFCDevice = mongoose.model('NFCDevice', NFCDeviceSchema);

// ============================================
// FESTIVAL TOKENS MODELS (NUEVA FUNCIONALIDAD)
// ============================================

const DigitalWalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Balance
  tokenBalance: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'EUR' },
  
  // Configuración
  isActive: { type: Boolean, default: true },
  dailySpendLimit: { type: Number, default: 100 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'digital_wallets'
});

DigitalWalletSchema.index({ userId: 1 });

export const DigitalWallet = mongoose.model('DigitalWallet', DigitalWalletSchema);

const TokenPurchaseSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'DigitalWallet', required: true },
  
  // Información de compra
  amount: { type: Number, required: true }, // EUR amount
  tokenAmount: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  exchangeRate: { type: Number, default: 1 },
  
  // Información de pago
  paymentMethod: { type: String, enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY', 'BANK_TRANSFER'], required: true },
  paymentId: String, // RevenueCat/Stripe transaction ID
  cardLast4: String,
  
  // Estado
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date,
}, {
  timestamps: true,
  collection: 'token_purchases'
});

TokenPurchaseSchema.index({ walletId: 1 });
TokenPurchaseSchema.index({ status: 1 });
TokenPurchaseSchema.index({ createdAt: -1 });

export const TokenPurchase = mongoose.model('TokenPurchase', TokenPurchaseSchema);

const FestivalVendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  
  // Información del vendor
  type: { type: String, enum: ['FOOD_TRUCK', 'BAR', 'MERCHANDISE', 'SERVICES', 'GAMES', 'EXPERIENCES'], required: true },
  category: { type: String, required: true }, // "food", "drinks", "merchandise", "services"
  
  // Configuración
  acceptsTokens: { type: Boolean, default: true },
  tokenRate: { type: Number, default: 1 }, // 1 token = X EUR
  
  // Ubicación en el festival
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  location: String,
  
  // Productos
  products: [{
    name: { type: String, required: true },
    description: String,
    category: String,
    priceTokens: { type: Number, required: true },
    priceEur: Number,
    isAvailable: { type: Boolean, default: true },
    stock: Number,
    images: [String],
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'festival_vendors'
});

FestivalVendorSchema.index({ eventId: 1 });
FestivalVendorSchema.index({ type: 1 });
FestivalVendorSchema.index({ acceptsTokens: 1 });

export const FestivalVendor = mongoose.model('FestivalVendor', FestivalVendorSchema);

const TokenTransactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'DigitalWallet', required: true },
  
  // Información de transacción
  type: { type: String, enum: ['PURCHASE', 'SPENDING', 'REFUND', 'TRANSFER', 'REWARD', 'BONUS'], required: true },
  amount: { type: Number, required: true },
  description: String,
  
  // Contexto
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'FestivalVendor' },
  productId: String, // Product within vendor
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'NFCDevice' },
  
  // Metadata adicional
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
}, {
  collection: 'token_transactions'
});

TokenTransactionSchema.index({ walletId: 1, createdAt: -1 });
TokenTransactionSchema.index({ eventId: 1 });
TokenTransactionSchema.index({ type: 1 });

export const TokenTransaction = mongoose.model('TokenTransaction', TokenTransactionSchema);

const FestivalSpendingSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'DigitalWallet', required: true },
  
  // Información de compra
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'FestivalVendor', required: true },
  productId: String, // Product within vendor
  
  // Transacción
  tokenAmount: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  
  // Contexto
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'NFCDevice' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
}, {
  collection: 'festival_spending'
});

FestivalSpendingSchema.index({ walletId: 1, createdAt: -1 });
FestivalSpendingSchema.index({ eventId: 1 });
FestivalSpendingSchema.index({ vendorId: 1 });

export const FestivalSpending = mongoose.model('FestivalSpending', FestivalSpendingSchema);

// ============================================
// NETWORKING MODELS (FUNCIONALIDAD ORIGINAL)
// ============================================

const InteractionSchema = new mongoose.Schema({
  // Participantes
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Contexto
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'NFCDevice' },
  
  // Tipo de interacción
  type: { type: String, enum: ['NFC_TAP', 'QR_SCAN', 'MANUAL_ADD', 'PROXIMITY'], default: 'NFC_TAP' },
  
  // Datos intercambiados
  dataExchanged: {
    profileShared: { type: Boolean, default: true },
    contactShared: { type: Boolean, default: false },
    socialMediaShared: { type: Boolean, default: false },
    customData: mongoose.Schema.Types.Mixed,
  },
  
  // Ubicación y contexto
  location: {
    lat: Number,
    lng: Number,
    accuracy: Number,
  },
  
  // Metadata
  metadata: {
    deviceInfo: String,
    signalStrength: Number,
    duration: Number, // seconds
    mutualConnection: { type: Boolean, default: false },
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
}, {
  collection: 'interactions'
});

InteractionSchema.index({ userId: 1, eventId: 1 });
InteractionSchema.index({ eventId: 1, createdAt: -1 });
InteractionSchema.index({ userId: 1, targetUserId: 1, eventId: 1 });

export const Interaction = mongoose.model('Interaction', InteractionSchema);

const ConnectionSchema = new mongoose.Schema({
  // Usuarios conectados
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  connectedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Contexto de la conexión
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  interactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interaction' },
  
  // Estado de la conexión
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'BLOCKED'], default: 'ACCEPTED' },
  strength: { type: Number, default: 1, min: 1, max: 5 }, // Connection strength
  
  // Información adicional
  notes: String,
  tags: [String],
  isFavorite: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'connections'
});

ConnectionSchema.index({ userId: 1 });
ConnectionSchema.index({ connectedUserId: 1 });
ConnectionSchema.index({ eventId: 1 });
ConnectionSchema.index({ userId: 1, eventId: 1 });

export const Connection = mongoose.model('Connection', ConnectionSchema);

// ============================================
// GAMIFICATION MODELS
// ============================================

const AchievementSchema = new mongoose.Schema({
  // Información básica
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: String,
  
  // Configuración
  type: { type: String, enum: ['NETWORKING', 'SPENDING', 'EVENT', 'SOCIAL', 'SPECIAL'], required: true },
  category: String,
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD', 'LEGENDARY'], default: 'EASY' },
  
  // Condiciones
  conditions: {
    requiredCount: { type: Number, default: 1 },
    timeLimit: Number, // seconds
    eventSpecific: { type: Boolean, default: false },
    requirements: mongoose.Schema.Types.Mixed,
  },
  
  // Recompensas
  rewards: {
    tokens: { type: Number, default: 0 },
    points: { type: Number, default: 10 },
    badge: String,
    title: String,
  },
  
  // Configuración
  isActive: { type: Boolean, default: true },
  isHidden: { type: Boolean, default: false }, // Secret achievements
  
  // Asociación con eventos
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // null = global achievement
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'achievements'
});

AchievementSchema.index({ type: 1 });
AchievementSchema.index({ eventId: 1 });
AchievementSchema.index({ isActive: 1 });

export const Achievement = mongoose.model('Achievement', AchievementSchema);

const UserAchievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  
  // Progreso
  progress: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  completedAt: Date,
  
  // Contexto
  context: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'user_achievements'
});

UserAchievementSchema.index({ userId: 1 });
UserAchievementSchema.index({ achievementId: 1 });
UserAchievementSchema.index({ userId: 1, eventId: 1 });
UserAchievementSchema.index({ userId: 1, isCompleted: 1 });

export const UserAchievement = mongoose.model('UserAchievement', UserAchievementSchema);

// ============================================
// DATABASE CONNECTION
// ============================================

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI or DATABASE_URL environment variable is required');
    }

    await mongoose.connect(mongoUri, {
      // Connection options for MongoDB Atlas
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Connected to MongoDB Atlas');
    
    // Ensure indexes are created
    await Promise.all([
      User.ensureIndexes(),
      Event.ensureIndexes(),
      NFCDevice.ensureIndexes(),
      DigitalWallet.ensureIndexes(),
      TokenPurchase.ensureIndexes(),
      FestivalVendor.ensureIndexes(),
      TokenTransaction.ensureIndexes(),
      FestivalSpending.ensureIndexes(),
      Interaction.ensureIndexes(),
      Connection.ensureIndexes(),
      Achievement.ensureIndexes(),
      UserAchievement.ensureIndexes(),
    ]);

    console.log('✅ Database indexes created');

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};

// Export all models
export {
  mongoose
};
