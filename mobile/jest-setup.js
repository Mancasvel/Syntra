import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};
  
  return Reanimated;
});

// Mock Animated API
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => 
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 5,
        altitude: 0,
        altitudeAccuracy: 0,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    })
  ),
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  scheduleNotificationAsync: jest.fn(),
  cancelNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock NFC Manager
jest.mock('react-native-nfc-manager', () => ({
  isSupported: jest.fn(() => Promise.resolve(true)),
  isEnabled: jest.fn(() => Promise.resolve(true)),
  start: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  requestTechnology: jest.fn(() => Promise.resolve()),
  cancelTechnologyRequest: jest.fn(() => Promise.resolve()),
  setEventListener: jest.fn(),
  writeNdefMessage: jest.fn(() => Promise.resolve()),
  goToNfcSetting: jest.fn(),
  NfcTech: {
    Ndef: 'Ndef',
  },
  NfcEvents: {
    DiscoverTag: 'DiscoverTag',
    SessionClosed: 'SessionClosed',
  },
  Ndef: {
    textRecord: jest.fn(),
    text: {
      decodePayload: jest.fn(() => '{"test": "data"}'),
    },
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }) => children,
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Stack: ({ children }) => children,
  Tabs: ({ children }) => children,
  Link: ({ children, href, ...props }) => children,
}));

// Mock React Native Animatable
jest.mock('react-native-animatable', () => ({
  View: 'View',
  Text: 'Text',
  Image: 'Image',
}));

// Mock Lottie
jest.mock('lottie-react-native', () => 'LottieView');

// Mock React Native Sound
jest.mock('react-native-sound', () => {
  const Sound = jest.fn();
  Sound.prototype.play = jest.fn();
  Sound.prototype.stop = jest.fn();
  Sound.prototype.pause = jest.fn();
  Sound.prototype.release = jest.fn();
  Sound.setCategory = jest.fn();
  return Sound;
});

// Mock Toast Message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
  __esModule: true,
  default: () => null,
}));

// Mock Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock Heroicons
jest.mock('react-native-heroicons/outline', () => ({
  HomeIcon: 'HomeIcon',
  UserGroupIcon: 'UserGroupIcon',
  TrophyIcon: 'TrophyIcon',
  MapIcon: 'MapIcon',
  UserIcon: 'UserIcon',
  SparklesIcon: 'SparklesIcon',
  QrCodeIcon: 'QrCodeIcon',
  BoltIcon: 'BoltIcon',
  MapPinIcon: 'MapPinIcon',
}));

jest.mock('react-native-heroicons/solid', () => ({
  HomeIcon: 'HomeIconSolid',
  UserGroupIcon: 'UserGroupIconSolid',
  TrophyIcon: 'TrophyIconSolid',
  MapIcon: 'MapIconSolid',
  UserIcon: 'UserIconSolid',
}));

// Mock Socket.io Client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

// Mock Zustand
jest.mock('zustand', () => ({
  create: jest.fn(() => () => ({
    user: null,
    currentEvent: null,
    isLoading: false,
  })),
}));

// Mock React Query
jest.mock('react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    error: null,
    isLoading: false,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  })),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}));

// Mock RevenueCat
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  getCustomerInfo: jest.fn(() => Promise.resolve({
    activeSubscriptions: [],
    allPurchasedProductIdentifiers: [],
  })),
  getOfferings: jest.fn(() => Promise.resolve({
    current: {
      monthly: {
        product: {
          identifier: 'monthly_subscription',
          price: 9.99,
          priceString: '$9.99',
        },
      },
    },
  })),
  purchaseProduct: jest.fn(() => Promise.resolve({
    customerInfo: {},
    productIdentifier: 'test_product',
  })),
  restoreTransactions: jest.fn(() => Promise.resolve({})),
  logIn: jest.fn(() => Promise.resolve({})),
  logOut: jest.fn(() => Promise.resolve({})),
  setAttributes: jest.fn(),
  PURCHASE_TYPE: {
    SUBS: 'subs',
    INAPP: 'inapp',
  },
}));

// Global mocks
global.__DEV__ = true;
global.fetch = jest.fn();

// Suppress specific warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Animated:') || 
     args[0].includes('VirtualizedLists should never be nested'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};
