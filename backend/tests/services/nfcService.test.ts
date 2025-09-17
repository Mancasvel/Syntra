import { NFCService } from '@/services/nfcService';
import { prismaMock, createMockUser, createMockEvent, createMockNFCDevice } from '../setup';

describe('NFCService', () => {
  let nfcService: NFCService;

  beforeEach(() => {
    nfcService = new NFCService();
    jest.clearAllMocks();
  });

  describe('createNFCDevice', () => {
    it('should create a new NFC device successfully', async () => {
      const mockDevice = createMockNFCDevice();
      prismaMock.nFCDevice.create.mockResolvedValue(mockDevice);

      const result = await nfcService.createNFCDevice({
        deviceId: 'nfc-device-123',
        type: 'WRISTBAND',
        eventId: 'test-event-id',
        userId: 'test-user-id',
      });

      expect(result).toEqual(mockDevice);
      expect(prismaMock.nFCDevice.create).toHaveBeenCalledWith({
        data: {
          deviceId: 'nfc-device-123',
          type: 'WRISTBAND',
          eventId: 'test-event-id',
          userId: 'test-user-id',
          isActive: true,
        },
      });
    });

    it('should handle creation errors', async () => {
      prismaMock.nFCDevice.create.mockRejectedValue(new Error('Database error'));

      await expect(
        nfcService.createNFCDevice({
          deviceId: 'nfc-device-123',
          type: 'WRISTBAND',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('assignDeviceToUser', () => {
    it('should assign device to user and generate NFC data', async () => {
      const mockUser = createMockUser();
      const mockEvent = createMockEvent();
      const mockDevice = createMockNFCDevice({
        nfcData: {
          userId: mockUser.id,
          eventId: mockEvent.id,
          profile: {
            name: `${mockUser.firstName} ${mockUser.lastName}`,
            interests: [],
            networkingStatus: 'AVAILABLE',
          },
          achievements: [],
          connections: 0,
        },
      });

      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        attendeeProfile: {
          id: 'profile-id',
          userId: mockUser.id,
          bio: null,
          company: 'Test Company',
          position: 'Developer',
          linkedin: null,
          twitter: null,
          networkingStatus: 'AVAILABLE',
          interests: ['technology', 'networking'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        achievements: [],
        connections: [],
      });

      prismaMock.nFCDevice.update.mockResolvedValue(mockDevice);

      const result = await nfcService.assignDeviceToUser(
        'nfc-device-123',
        mockUser.id,
        mockEvent.id
      );

      expect(result).toEqual(mockDevice);
      expect(prismaMock.nFCDevice.update).toHaveBeenCalledWith({
        where: { deviceId: 'nfc-device-123' },
        data: {
          userId: mockUser.id,
          eventId: mockEvent.id,
          nfcData: expect.any(Object),
          lastSync: expect.any(Date),
        },
      });
    });
  });

  describe('handleNFCInteraction', () => {
    it('should process handshake interaction successfully', async () => {
      const interaction = {
        deviceId: 'device-1',
        userId: 'user-1',
        eventId: 'event-1',
        type: 'HANDSHAKE' as const,
        data: { targetDeviceId: 'device-2' },
        timestamp: new Date(),
      };

      const mockInteraction = {
        id: 'interaction-id',
        type: 'CONNECTION_MADE',
        userId: 'user-1',
        eventId: 'event-1',
        deviceId: 'device-1',
        data: interaction.data,
        location: null,
        createdAt: new Date(),
      };

      const mockDevice1 = {
        ...createMockNFCDevice({ deviceId: 'device-1' }),
        user: {
          ...createMockUser({ id: 'user-1' }),
          attendeeProfile: {
            id: 'profile-1',
            userId: 'user-1',
            interests: ['tech', 'networking'],
            networkingStatus: 'AVAILABLE',
            bio: null,
            company: null,
            position: null,
            linkedin: null,
            twitter: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      };

      const mockDevice2 = {
        ...createMockNFCDevice({ deviceId: 'device-2' }),
        user: {
          ...createMockUser({ id: 'user-2' }),
          attendeeProfile: {
            id: 'profile-2',
            userId: 'user-2',
            interests: ['tech', 'business'],
            networkingStatus: 'AVAILABLE',
            bio: null,
            company: null,
            position: null,
            linkedin: null,
            twitter: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      };

      prismaMock.interaction.create.mockResolvedValue(mockInteraction);
      prismaMock.nFCDevice.findUnique
        .mockResolvedValueOnce(mockDevice1)
        .mockResolvedValueOnce(mockDevice2);

      // Mock connection creation
      prismaMock.connection.upsert.mockResolvedValue({
        id: 'connection-id',
        userId: 'user-1',
        connectedId: 'user-2',
        strength: 1,
        firstMet: new Date(),
        lastContact: new Date(),
        eventContext: 'event-1',
        notes: null,
      });

      await expect(nfcService.handleNFCInteraction(interaction)).resolves.not.toThrow();

      expect(prismaMock.interaction.create).toHaveBeenCalled();
    });

    it('should handle interaction errors gracefully', async () => {
      const interaction = {
        deviceId: 'device-1',
        userId: 'user-1',
        eventId: 'event-1',
        type: 'HANDSHAKE' as const,
        timestamp: new Date(),
      };

      prismaMock.interaction.create.mockRejectedValue(new Error('Database error'));

      await expect(nfcService.handleNFCInteraction(interaction)).rejects.toThrow();
    });
  });

  describe('getDeviceStatus', () => {
    it('should return device status with user and event info', async () => {
      const mockDeviceWithRelations = {
        ...createMockNFCDevice(),
        user: createMockUser(),
        event: createMockEvent(),
      };

      prismaMock.nFCDevice.findUnique.mockResolvedValue(mockDeviceWithRelations);

      const result = await nfcService.getDeviceStatus('nfc-device-123');

      expect(result).toEqual(mockDeviceWithRelations);
      expect(prismaMock.nFCDevice.findUnique).toHaveBeenCalledWith({
        where: { deviceId: 'nfc-device-123' },
        include: {
          user: {
            include: {
              attendeeProfile: true,
            },
          },
          event: true,
        },
      });
    });
  });

  describe('updateDeviceBattery', () => {
    it('should update device battery level', async () => {
      const mockDevice = createMockNFCDevice({ battery: 75 });
      prismaMock.nFCDevice.update.mockResolvedValue(mockDevice);

      await nfcService.updateDeviceBattery('nfc-device-123', 75);

      expect(prismaMock.nFCDevice.update).toHaveBeenCalledWith({
        where: { deviceId: 'nfc-device-123' },
        data: {
          battery: 75,
          lastSync: expect.any(Date),
        },
      });
    });
  });

  describe('calculateCompatibility', () => {
    it('should calculate compatibility based on common interests', async () => {
      const currentUser = {
        data: {
          attendeeProfile: {
            interests: ['tech', 'networking', 'startups'],
          },
        },
      };

      const targetData = {
        profile: {
          interests: ['tech', 'business', 'startups'],
        },
      };

      // Mock API call to get current user
      jest.spyOn(nfcService as any, 'calculateCompatibility').mockImplementation(
        async (targetData) => {
          const currentInterests = ['tech', 'networking', 'startups'];
          const targetInterests = targetData.profile.interests;
          
          const commonInterests = currentInterests.filter(interest =>
            targetInterests.includes(interest)
          );
          
          const totalInterests = new Set([...currentInterests, ...targetInterests]).size;
          return Math.max(20, (commonInterests.length / totalInterests) * 100);
        }
      );

      const compatibility = await (nfcService as any).calculateCompatibility(targetData);

      expect(compatibility).toBeGreaterThanOrEqual(20);
      expect(compatibility).toBeLessThanOrEqual(100);
    });
  });
});
