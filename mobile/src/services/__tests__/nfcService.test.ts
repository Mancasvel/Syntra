import { nfcService, NFCData, NFCInteraction } from '../nfcService';
import NfcManager from 'react-native-nfc-manager';
import * as Haptics from 'expo-haptics';

// Mock the modules
jest.mock('react-native-nfc-manager');
jest.mock('expo-haptics');
jest.mock('../apiService');
jest.mock('../notificationService');
jest.mock('../soundService');

const mockNfcManager = NfcManager as jest.Mocked<typeof NfcManager>;
const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;

describe('NFCService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize NFC service successfully when supported', async () => {
      mockNfcManager.isSupported.mockResolvedValue(true);
      mockNfcManager.start.mockResolvedValue();

      const result = await nfcService.initialize();

      expect(result).toBe(true);
      expect(mockNfcManager.isSupported).toHaveBeenCalled();
      expect(mockNfcManager.start).toHaveBeenCalled();
      expect(mockNfcManager.setEventListener).toHaveBeenCalledTimes(2);
    });

    it('should return false when NFC is not supported', async () => {
      mockNfcManager.isSupported.mockResolvedValue(false);

      const result = await nfcService.initialize();

      expect(result).toBe(false);
      expect(mockNfcManager.start).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockNfcManager.isSupported.mockResolvedValue(true);
      mockNfcManager.start.mockRejectedValue(new Error('NFC start failed'));

      const result = await nfcService.initialize();

      expect(result).toBe(false);
    });
  });

  describe('startScanning', () => {
    beforeEach(async () => {
      mockNfcManager.isSupported.mockResolvedValue(true);
      mockNfcManager.start.mockResolvedValue();
      await nfcService.initialize();
    });

    it('should start NFC scanning successfully', async () => {
      mockNfcManager.isEnabled.mockResolvedValue(true);
      mockNfcManager.requestTechnology.mockResolvedValue();

      const result = await nfcService.startScanning('event-123', 'user-456');

      expect(result).toBe(true);
      expect(mockNfcManager.isEnabled).toHaveBeenCalled();
      expect(mockNfcManager.requestTechnology).toHaveBeenCalled();
      expect(nfcService.isScanningActive).toBe(true);
    });

    it('should return false when NFC is not enabled', async () => {
      mockNfcManager.isEnabled.mockResolvedValue(false);

      const result = await nfcService.startScanning('event-123', 'user-456');

      expect(result).toBe(false);
      expect(mockNfcManager.requestTechnology).not.toHaveBeenCalled();
    });

    it('should handle scanning start errors', async () => {
      mockNfcManager.isEnabled.mockResolvedValue(true);
      mockNfcManager.requestTechnology.mockRejectedValue(new Error('Request failed'));

      const result = await nfcService.startScanning('event-123', 'user-456');

      expect(result).toBe(false);
      expect(nfcService.isScanningActive).toBe(false);
    });
  });

  describe('stopScanning', () => {
    beforeEach(async () => {
      mockNfcManager.isSupported.mockResolvedValue(true);
      mockNfcManager.start.mockResolvedValue();
      mockNfcManager.isEnabled.mockResolvedValue(true);
      mockNfcManager.requestTechnology.mockResolvedValue();
      
      await nfcService.initialize();
      await nfcService.startScanning('event-123', 'user-456');
    });

    it('should stop NFC scanning successfully', async () => {
      mockNfcManager.cancelTechnologyRequest.mockResolvedValue();

      await nfcService.stopScanning();

      expect(mockNfcManager.cancelTechnologyRequest).toHaveBeenCalled();
      expect(nfcService.isScanningActive).toBe(false);
    });

    it('should handle stop scanning errors gracefully', async () => {
      mockNfcManager.cancelTechnologyRequest.mockRejectedValue(new Error('Cancel failed'));

      await expect(nfcService.stopScanning()).resolves.not.toThrow();
    });
  });

  describe('writeNFCTag', () => {
    const mockNFCData: NFCData = {
      userId: 'user-123',
      eventId: 'event-456',
      deviceId: 'device-789',
      profile: {
        name: 'Test User',
        company: 'Test Company',
        position: 'Developer',
        interests: ['tech', 'networking'],
        networkingStatus: 'AVAILABLE',
      },
      achievements: ['networker'],
      connections: 5,
      timestamp: new Date().toISOString(),
    };

    beforeEach(async () => {
      mockNfcManager.isSupported.mockResolvedValue(true);
      mockNfcManager.start.mockResolvedValue();
      await nfcService.initialize();
    });

    it('should write NFC tag successfully', async () => {
      mockNfcManager.requestTechnology.mockResolvedValue();
      mockNfcManager.writeNdefMessage.mockResolvedValue();
      mockNfcManager.cancelTechnologyRequest.mockResolvedValue();

      const result = await nfcService.writeNFCTag(mockNFCData);

      expect(result).toBe(true);
      expect(mockNfcManager.requestTechnology).toHaveBeenCalled();
      expect(mockNfcManager.writeNdefMessage).toHaveBeenCalled();
      expect(mockNfcManager.cancelTechnologyRequest).toHaveBeenCalled();
    });

    it('should handle write errors', async () => {
      mockNfcManager.requestTechnology.mockResolvedValue();
      mockNfcManager.writeNdefMessage.mockRejectedValue(new Error('Write failed'));
      mockNfcManager.cancelTechnologyRequest.mockResolvedValue();

      const result = await nfcService.writeNFCTag(mockNFCData);

      expect(result).toBe(false);
      expect(mockNfcManager.cancelTechnologyRequest).toHaveBeenCalled();
    });
  });

  describe('isNFCAvailable', () => {
    it('should return correct availability status', async () => {
      mockNfcManager.isSupported.mockResolvedValue(true);
      mockNfcManager.isEnabled.mockResolvedValue(true);

      const result = await nfcService.isNFCAvailable();

      expect(result).toEqual({
        supported: true,
        enabled: true,
      });
    });

    it('should handle unsupported NFC', async () => {
      mockNfcManager.isSupported.mockResolvedValue(false);

      const result = await nfcService.isNFCAvailable();

      expect(result).toEqual({
        supported: false,
        enabled: false,
      });
      expect(mockNfcManager.isEnabled).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockNfcManager.isSupported.mockRejectedValue(new Error('Check failed'));

      const result = await nfcService.isNFCAvailable();

      expect(result).toEqual({
        supported: false,
        enabled: false,
      });
    });
  });

  describe('handleTagDiscovered', () => {
    const mockTag = {
      id: 'tag-123',
      techTypes: ['Ndef'],
      type: 'NfcA',
      ndefMessage: [
        {
          id: Uint8Array.from([1]),
          type: Uint8Array.from([84]), // 'T' for text record
          payload: Uint8Array.from([2, 101, 110, 116, 101, 115, 116]), // text payload
        },
      ],
    };

    beforeEach(async () => {
      mockNfcManager.isSupported.mockResolvedValue(true);
      mockNfcManager.start.mockResolvedValue();
      mockNfcManager.isEnabled.mockResolvedValue(true);
      mockNfcManager.requestTechnology.mockResolvedValue();
      
      await nfcService.initialize();
      await nfcService.startScanning('event-123', 'user-456');
    });

    it('should handle tag discovery with valid data', async () => {
      // Mock the Ndef text decoding
      const mockNfcData = {
        userId: 'other-user',
        eventId: 'event-123',
        deviceId: 'device-789',
        profile: {
          name: 'Other User',
          interests: ['tech'],
          networkingStatus: 'AVAILABLE',
        },
        achievements: [],
        connections: 0,
        timestamp: new Date().toISOString(),
      };

      mockNfcManager.Ndef.text.decodePayload.mockReturnValue(JSON.stringify(mockNfcData));
      mockHaptics.impactAsync.mockResolvedValue();

      // Simulate tag discovery
      const handleTagDiscovered = (nfcService as any).handleTagDiscovered;
      await expect(handleTagDiscovered(mockTag)).resolves.not.toThrow();

      expect(mockHaptics.impactAsync).toHaveBeenCalled();
    });

    it('should handle invalid NFC data gracefully', async () => {
      mockNfcManager.Ndef.text.decodePayload.mockReturnValue('invalid json');
      mockHaptics.notificationAsync.mockResolvedValue();

      const handleTagDiscovered = (nfcService as any).handleTagDiscovered;
      await expect(handleTagDiscovered(mockTag)).resolves.not.toThrow();

      expect(mockHaptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Error
      );
    });

    it('should prevent self-connection', async () => {
      const mockNfcData = {
        userId: 'user-456', // Same as scanning user
        eventId: 'event-123',
        deviceId: 'device-789',
        profile: {
          name: 'Same User',
          interests: ['tech'],
          networkingStatus: 'AVAILABLE',
        },
        achievements: [],
        connections: 0,
        timestamp: new Date().toISOString(),
      };

      mockNfcManager.Ndef.text.decodePayload.mockReturnValue(JSON.stringify(mockNfcData));

      const handleTagDiscovered = (nfcService as any).handleTagDiscovered;
      await expect(handleTagDiscovered(mockTag)).resolves.not.toThrow();

      // Should show alert for self-connection attempt
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      mockNfcManager.isSupported.mockResolvedValue(true);
      mockNfcManager.start.mockResolvedValue();
      await nfcService.initialize();
    });

    it('should cleanup NFC service properly', async () => {
      mockNfcManager.cancelTechnologyRequest.mockResolvedValue();
      mockNfcManager.stop.mockResolvedValue();

      await nfcService.cleanup();

      expect(mockNfcManager.setEventListener).toHaveBeenCalledWith(
        mockNfcManager.NfcEvents.DiscoverTag,
        null
      );
      expect(mockNfcManager.setEventListener).toHaveBeenCalledWith(
        mockNfcManager.NfcEvents.SessionClosed,
        null
      );
      expect(mockNfcManager.stop).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockNfcManager.stop.mockRejectedValue(new Error('Stop failed'));

      await expect(nfcService.cleanup()).resolves.not.toThrow();
    });
  });

  describe('getters', () => {
    it('should return correct ready state', async () => {
      expect(nfcService.isReady).toBe(false);

      mockNfcManager.isSupported.mockResolvedValue(true);
      mockNfcManager.start.mockResolvedValue();
      await nfcService.initialize();

      expect(nfcService.isReady).toBe(true);
    });

    it('should return correct scanning state', async () => {
      expect(nfcService.isScanningActive).toBe(false);

      mockNfcManager.isSupported.mockResolvedValue(true);
      mockNfcManager.start.mockResolvedValue();
      mockNfcManager.isEnabled.mockResolvedValue(true);
      mockNfcManager.requestTechnology.mockResolvedValue();

      await nfcService.initialize();
      await nfcService.startScanning('event-123', 'user-456');

      expect(nfcService.isScanningActive).toBe(true);
    });
  });
});
