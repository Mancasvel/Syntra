import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  __esModule: true,
  PrismaClient: jest.fn().mockImplementation(() => mockDeep<PrismaClient>()),
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
  })),
}));

// Mock MQTT
jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    end: jest.fn(),
  })),
}));

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

// Mock RevenueCat
jest.mock('revenuecat-node', () => ({
  RevenueCat: jest.fn().mockImplementation(() => ({
    getSubscriber: jest.fn(),
    createSubscriber: jest.fn(),
    updateSubscriber: jest.fn(),
    getOfferings: jest.fn(),
    makePurchase: jest.fn(),
  })),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ userId: 'test-user-id', role: 'USER' })),
  decode: jest.fn(() => ({ userId: 'test-user-id' })),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true)),
  genSalt: jest.fn(() => Promise.resolve('salt')),
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-id' })),
  })),
}));

// Global test setup
beforeEach(() => {
  mockReset(prismaMock);
});

// Export mocked prisma for use in tests
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'ATTENDEE',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockEvent = (overrides = {}) => ({
  id: 'test-event-id',
  name: 'Test Event',
  description: 'Test event description',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-02'),
  timezone: 'UTC',
  location: 'Test Location',
  isPublic: true,
  status: 'PUBLISHED',
  organizerId: 'test-organizer-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockNFCDevice = (overrides = {}) => ({
  id: 'test-device-id',
  deviceId: 'nfc-device-123',
  type: 'WRISTBAND',
  isActive: true,
  eventId: 'test-event-id',
  userId: 'test-user-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Test database helpers
export const clearDatabase = async () => {
  // Implementation would clear test database
  console.log('Database cleared for testing');
};

// HTTP test helpers
export const createAuthHeaders = (token = 'mock-jwt-token') => ({
  Authorization: `Bearer ${token}`,
});

// Mock responses
export const mockSuccessResponse = (data = {}) => ({
  success: true,
  data,
  message: 'Success',
});

export const mockErrorResponse = (message = 'Error', code = 400) => ({
  success: false,
  error: {
    message,
    code,
  },
});
