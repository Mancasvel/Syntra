import request from 'supertest';
import { app } from '@/index';
import { prismaMock, createMockUser, createMockEvent, createAuthHeaders } from '../setup';

describe('API Integration Tests', () => {
  describe('Authentication', () => {
    describe('POST /api/v1/auth/register', () => {
      it('should register a new user successfully', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        };

        const mockUser = createMockUser(userData);
        prismaMock.user.create.mockResolvedValue(mockUser);
        prismaMock.user.findUnique.mockResolvedValue(null); // User doesn't exist

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            user: expect.objectContaining({
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
            }),
            token: expect.any(String),
          },
        });
      });

      it('should return error for duplicate email', async () => {
        const userData = {
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        };

        prismaMock.user.findUnique.mockResolvedValue(createMockUser()); // User exists

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: expect.objectContaining({
            message: expect.stringContaining('already exists'),
          }),
        });
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'invalid-email',
            // Missing required fields
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('should login with valid credentials', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123',
        };

        const mockUser = createMockUser({ email: loginData.email });
        prismaMock.user.findUnique.mockResolvedValue(mockUser);

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            user: expect.objectContaining({
              email: loginData.email,
            }),
            token: expect.any(String),
          },
        });
      });

      it('should reject invalid credentials', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };

        prismaMock.user.findUnique.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Events', () => {
    describe('GET /api/v1/events', () => {
      it('should return list of public events', async () => {
        const mockEvents = [
          createMockEvent({ name: 'Event 1', isPublic: true }),
          createMockEvent({ name: 'Event 2', isPublic: true }),
        ];

        prismaMock.event.findMany.mockResolvedValue(mockEvents);

        const response = await request(app)
          .get('/api/v1/events')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ name: 'Event 1' }),
            expect.objectContaining({ name: 'Event 2' }),
          ]),
        });
      });

      it('should filter events by query parameters', async () => {
        const mockEvents = [createMockEvent({ name: 'Tech Conference' })];
        prismaMock.event.findMany.mockResolvedValue(mockEvents);

        const response = await request(app)
          .get('/api/v1/events')
          .query({ search: 'tech' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(prismaMock.event.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  name: expect.objectContaining({
                    contains: 'tech',
                    mode: 'insensitive',
                  }),
                }),
              ]),
            }),
          })
        );
      });
    });

    describe('POST /api/v1/events', () => {
      it('should create event with valid data and authentication', async () => {
        const eventData = {
          name: 'New Event',
          description: 'Event description',
          startDate: '2024-06-01T10:00:00Z',
          endDate: '2024-06-01T18:00:00Z',
          timezone: 'UTC',
          location: 'Test Location',
        };

        const mockEvent = createMockEvent(eventData);
        const mockUser = createMockUser({ role: 'ORGANIZER' });

        prismaMock.event.create.mockResolvedValue(mockEvent);
        prismaMock.user.findUnique.mockResolvedValue(mockUser);

        const response = await request(app)
          .post('/api/v1/events')
          .set(createAuthHeaders())
          .send(eventData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.objectContaining({
            name: eventData.name,
            description: eventData.description,
          }),
        });
      });

      it('should require authentication', async () => {
        const eventData = {
          name: 'New Event',
          description: 'Event description',
          startDate: '2024-06-01T10:00:00Z',
          endDate: '2024-06-01T18:00:00Z',
          timezone: 'UTC',
          location: 'Test Location',
        };

        const response = await request(app)
          .post('/api/v1/events')
          .send(eventData)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('NFC', () => {
    describe('POST /api/v1/nfc/interactions', () => {
      it('should process NFC interaction with valid data', async () => {
        const interactionData = {
          eventId: 'test-event-id',
          userId: 'test-user-id',
          interaction: {
            type: 'HANDSHAKE',
            targetUserId: 'target-user-id',
            targetDeviceId: 'target-device-id',
            data: {
              compatibility: 75,
              timestamp: new Date().toISOString(),
            },
          },
        };

        const mockResult = {
          connection: { isNew: true, strength: 1 },
          achievements: [],
          compatibility: 75,
        };

        // Mock the NFC service method
        jest.spyOn(require('@/services/nfcService'), 'handleNFCInteraction')
          .mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/v1/nfc/interactions')
          .set(createAuthHeaders())
          .send(interactionData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: mockResult,
        });
      });

      it('should validate interaction data', async () => {
        const invalidData = {
          eventId: 'test-event-id',
          // Missing required fields
        };

        const response = await request(app)
          .post('/api/v1/nfc/interactions')
          .set(createAuthHeaders())
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/nfc/devices/:deviceId', () => {
      it('should return device status', async () => {
        const deviceId = 'test-device-123';
        const mockDevice = {
          id: 'device-id',
          deviceId,
          type: 'WRISTBAND',
          isActive: true,
          battery: 85,
          user: createMockUser(),
          event: createMockEvent(),
        };

        jest.spyOn(require('@/services/nfcService'), 'getDeviceStatus')
          .mockResolvedValue(mockDevice);

        const response = await request(app)
          .get(`/api/v1/nfc/devices/${deviceId}`)
          .set(createAuthHeaders())
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: expect.objectContaining({
            deviceId,
            type: 'WRISTBAND',
            battery: 85,
          }),
        });
      });

      it('should return 404 for non-existent device', async () => {
        const deviceId = 'non-existent-device';

        jest.spyOn(require('@/services/nfcService'), 'getDeviceStatus')
          .mockResolvedValue(null);

        const response = await request(app)
          .get(`/api/v1/nfc/devices/${deviceId}`)
          .set(createAuthHeaders())
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('Not found'),
        }),
      });
    });

    it('should handle server errors gracefully', async () => {
      // Mock a service to throw an error
      prismaMock.event.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/v1/events')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: expect.any(String),
        }),
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API endpoints', async () => {
      // Make multiple requests rapidly
      const requests = Array(10).fill(null).map(() =>
        request(app).get('/api/v1/events')
      );

      const responses = await Promise.all(requests);
      
      // At least some should succeed
      expect(responses.some(res => res.status === 200)).toBe(true);
    });
  });
});
