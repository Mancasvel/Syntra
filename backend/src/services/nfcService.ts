import { PrismaClient } from '@prisma/client';
import mqtt from 'mqtt';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { SocketService } from './socketService';

interface NFCInteraction {
  deviceId: string;
  userId?: string;
  eventId: string;
  type: 'TAP' | 'PROXIMITY' | 'HANDSHAKE';
  data?: any;
  location?: string;
  timestamp: Date;
}

interface NFCDeviceData {
  userId: string;
  eventId: string;
  profile: {
    name: string;
    company?: string;
    position?: string;
    interests: string[];
    networkingStatus: string;
  };
  achievements: string[];
  connections: number;
}

export class NFCService {
  private prisma: PrismaClient;
  private mqttClient: mqtt.MqttClient | null = null;
  private socketService: SocketService | null = null;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public initialize(): void {
    this.connectMQTT();
    logger.info('🔗 NFC Service initialized');
  }

  public setSocketService(socketService: SocketService): void {
    this.socketService = socketService;
  }

  private connectMQTT(): void {
    if (!config.MQTT_URL) {
      logger.warn('MQTT URL not configured, NFC real-time features disabled');
      return;
    }

    try {
      this.mqttClient = mqtt.connect(config.MQTT_URL, {
        username: config.MQTT_USERNAME,
        password: config.MQTT_PASSWORD,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
      });

      this.mqttClient.on('connect', () => {
        logger.info('🔗 Connected to MQTT broker for NFC communication');
        this.subscribeTo NFC Topics();
      });

      this.mqttClient.on('error', (error) => {
        logger.error('MQTT connection error:', error);
      });

      this.mqttClient.on('message', (topic, message) => {
        this.handleMQTTMessage(topic, message);
      });

    } catch (error) {
      logger.error('Failed to connect to MQTT broker:', error);
    }
  }

  private subscribeToNFCTopics(): void {
    if (!this.mqttClient) return;

    const topics = [
      'syntra/nfc/interactions',
      'syntra/nfc/device-status',
      'syntra/nfc/proximity',
    ];

    topics.forEach(topic => {
      this.mqttClient!.subscribe(topic, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          logger.debug(`Subscribed to MQTT topic: ${topic}`);
        }
      });
    });
  }

  private async handleMQTTMessage(topic: string, message: Buffer): Promise<void> {
    try {
      const data = JSON.parse(message.toString());
      
      switch (topic) {
        case 'syntra/nfc/interactions':
          await this.handleNFCInteraction(data);
          break;
        case 'syntra/nfc/device-status':
          await this.handleDeviceStatusUpdate(data);
          break;
        case 'syntra/nfc/proximity':
          await this.handleProximityEvent(data);
          break;
        default:
          logger.warn(`Unknown MQTT topic: ${topic}`);
      }
    } catch (error) {
      logger.error(`Error processing MQTT message from ${topic}:`, error);
    }
  }

  // ============================================
  // NFC DEVICE MANAGEMENT
  // ============================================

  public async createNFCDevice(data: {
    deviceId: string;
    type: 'WRISTBAND' | 'BADGE' | 'STICKER' | 'CARD';
    eventId?: string;
    userId?: string;
  }) {
    try {
      const device = await this.prisma.nFCDevice.create({
        data: {
          deviceId: data.deviceId,
          type: data.type,
          eventId: data.eventId,
          userId: data.userId,
          isActive: true,
        },
      });

      logger.info(`Created NFC device: ${data.deviceId}`);
      return device;
    } catch (error) {
      logger.error('Error creating NFC device:', error);
      throw error;
    }
  }

  public async assignDeviceToUser(deviceId: string, userId: string, eventId: string) {
    try {
      const device = await this.prisma.nFCDevice.update({
        where: { deviceId },
        data: {
          userId,
          eventId,
          nfcData: await this.generateNFCData(userId, eventId),
          lastSync: new Date(),
        },
      });

      // Enviar configuración al dispositivo físico
      await this.sendDeviceConfiguration(deviceId, device.nfcData as any);

      logger.info(`Assigned device ${deviceId} to user ${userId}`);
      return device;
    } catch (error) {
      logger.error('Error assigning device to user:', error);
      throw error;
    }
  }

  private async generateNFCData(userId: string, eventId: string): Promise<NFCDeviceData> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        attendeeProfile: true,
        achievements: {
          where: { achievement: { eventId } },
          include: { achievement: true },
        },
        connections: true,
      },
    });

    if (!user) throw new Error('User not found');

    return {
      userId,
      eventId,
      profile: {
        name: `${user.firstName} ${user.lastName}`,
        company: user.attendeeProfile?.company,
        position: user.attendeeProfile?.position,
        interests: user.attendeeProfile?.interests || [],
        networkingStatus: user.attendeeProfile?.networkingStatus || 'AVAILABLE',
      },
      achievements: user.achievements.map(ua => ua.achievement.name),
      connections: user.connections.length,
    };
  }

  // ============================================
  // NFC INTERACTIONS
  // ============================================

  public async handleNFCInteraction(interaction: NFCInteraction): Promise<void> {
    try {
      // Registrar interacción en BD
      const savedInteraction = await this.prisma.interaction.create({
        data: {
          type: interaction.type === 'TAP' ? 'NFC_TAP' : 'CONNECTION_MADE',
          userId: interaction.userId!,
          eventId: interaction.eventId,
          deviceId: interaction.deviceId,
          data: interaction.data,
          location: interaction.location,
        },
      });

      // Procesar según tipo de interacción
      switch (interaction.type) {
        case 'HANDSHAKE':
          await this.handleHandshakeInteraction(interaction);
          break;
        case 'TAP':
          await this.handleTapInteraction(interaction);
          break;
        case 'PROXIMITY':
          await this.handleProximityInteraction(interaction);
          break;
      }

      // Notificar via WebSocket
      this.socketService?.emitToEvent(interaction.eventId, 'nfc-interaction', {
        ...savedInteraction,
        type: interaction.type,
      });

      logger.info(`Processed NFC interaction: ${interaction.type} from ${interaction.deviceId}`);
    } catch (error) {
      logger.error('Error handling NFC interaction:', error);
      throw error;
    }
  }

  private async handleHandshakeInteraction(interaction: NFCInteraction): Promise<void> {
    const { deviceId, data } = interaction;
    
    if (!data?.targetDeviceId) return;

    // Obtener usuarios de ambos dispositivos
    const [device1, device2] = await Promise.all([
      this.prisma.nFCDevice.findUnique({
        where: { deviceId },
        include: { user: { include: { attendeeProfile: true } } },
      }),
      this.prisma.nFCDevice.findUnique({
        where: { deviceId: data.targetDeviceId },
        include: { user: { include: { attendeeProfile: true } } },
      }),
    ]);

    if (!device1?.user || !device2?.user) return;

    // Crear conexión mutua
    await this.createConnection(device1.user.id, device2.user.id, interaction.eventId);

    // Verificar logros desbloqueables
    await this.checkNetworkingAchievements(device1.user.id, interaction.eventId);
    await this.checkNetworkingAchievements(device2.user.id, interaction.eventId);

    // Calcular compatibilidad
    const compatibility = this.calculateCompatibility(
      device1.user.attendeeProfile!,
      device2.user.attendeeProfile!
    );

    // Enviar feedback a dispositivos
    await this.sendHandshakeFeedback(deviceId, data.targetDeviceId, compatibility);
  }

  private async createConnection(userId1: string, userId2: string, eventContext: string): Promise<void> {
    try {
      // Crear conexión bidireccional
      await this.prisma.$transaction([
        this.prisma.connection.upsert({
          where: {
            userId_connectedId: {
              userId: userId1,
              connectedId: userId2,
            },
          },
          update: {
            strength: { increment: 1 },
            lastContact: new Date(),
          },
          create: {
            userId: userId1,
            connectedId: userId2,
            eventContext,
            strength: 1,
          },
        }),
        this.prisma.connection.upsert({
          where: {
            userId_connectedId: {
              userId: userId2,
              connectedId: userId1,
            },
          },
          update: {
            strength: { increment: 1 },
            lastContact: new Date(),
          },
          create: {
            userId: userId2,
            connectedId: userId1,
            eventContext,
            strength: 1,
          },
        }),
      ]);

      logger.info(`Created connection between users ${userId1} and ${userId2}`);
    } catch (error) {
      logger.error('Error creating connection:', error);
    }
  }

  private calculateCompatibility(profile1: any, profile2: any): number {
    if (!profile1?.interests || !profile2?.interests) return 0;

    const interests1 = new Set(profile1.interests);
    const interests2 = new Set(profile2.interests);
    
    const intersection = new Set([...interests1].filter(x => interests2.has(x)));
    const union = new Set([...interests1, ...interests2]);
    
    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  // ============================================
  // ACHIEVEMENTS
  // ============================================

  private async checkNetworkingAchievements(userId: string, eventId: string): Promise<void> {
    const connectionCount = await this.prisma.connection.count({
      where: { userId, eventContext: eventId },
    });

    const achievements = await this.prisma.achievement.findMany({
      where: {
        eventId,
        conditions: {
          path: ['type'],
          equals: 'networking',
        },
      },
    });

    for (const achievement of achievements) {
      const conditions = achievement.conditions as any;
      
      if (conditions.minConnections && connectionCount >= conditions.minConnections) {
        await this.unlockAchievement(userId, achievement.id);
      }
    }
  }

  private async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    try {
      await this.prisma.userAchievement.create({
        data: {
          userId,
          achievementId,
        },
      });

      // Notificar via WebSocket
      const achievement = await this.prisma.achievement.findUnique({
        where: { id: achievementId },
      });

      this.socketService?.emitToUser(userId, 'achievement-unlocked', achievement);

      logger.info(`User ${userId} unlocked achievement ${achievementId}`);
    } catch (error) {
      // Ignorar si ya existe
      if (error.code !== 'P2002') {
        logger.error('Error unlocking achievement:', error);
      }
    }
  }

  // ============================================
  // DEVICE COMMUNICATION
  // ============================================

  private async sendDeviceConfiguration(deviceId: string, nfcData: any): Promise<void> {
    if (!this.mqttClient) return;

    const topic = `syntra/nfc/config/${deviceId}`;
    const message = JSON.stringify({
      deviceId,
      data: nfcData,
      timestamp: new Date().toISOString(),
    });

    this.mqttClient.publish(topic, message, { qos: 1 }, (error) => {
      if (error) {
        logger.error(`Failed to send config to device ${deviceId}:`, error);
      } else {
        logger.debug(`Sent configuration to device ${deviceId}`);
      }
    });
  }

  private async sendHandshakeFeedback(device1: string, device2: string, compatibility: number): Promise<void> {
    if (!this.mqttClient) return;

    const feedbackData = {
      compatibility,
      vibration: compatibility > 70 ? 'strong' : compatibility > 40 ? 'medium' : 'weak',
      ledColor: compatibility > 70 ? 'green' : compatibility > 40 ? 'yellow' : 'red',
      timestamp: new Date().toISOString(),
    };

    // Enviar feedback a ambos dispositivos
    [device1, device2].forEach(deviceId => {
      const topic = `syntra/nfc/feedback/${deviceId}`;
      this.mqttClient!.publish(topic, JSON.stringify(feedbackData), { qos: 1 });
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  public async getDeviceStatus(deviceId: string) {
    return await this.prisma.nFCDevice.findUnique({
      where: { deviceId },
      include: {
        user: {
          include: {
            attendeeProfile: true,
          },
        },
        event: true,
      },
    });
  }

  public async updateDeviceBattery(deviceId: string, batteryLevel: number) {
    await this.prisma.nFCDevice.update({
      where: { deviceId },
      data: { 
        battery: batteryLevel,
        lastSync: new Date(),
      },
    });
  }

  private async handleDeviceStatusUpdate(data: any): Promise<void> {
    const { deviceId, battery, isActive } = data;
    
    await this.prisma.nFCDevice.update({
      where: { deviceId },
      data: {
        battery,
        isActive,
        lastSync: new Date(),
      },
    });
  }

  private async handleTapInteraction(interaction: NFCInteraction): Promise<void> {
    // Registrar tap simple para analytics
    logger.debug(`NFC tap registered for device ${interaction.deviceId}`);
  }

  private async handleProximityEvent(data: any): Promise<void> {
    // Manejar eventos de proximidad para sugerencias de networking
    const { deviceId, nearbyDevices } = data;
    
    if (nearbyDevices?.length > 0) {
      this.socketService?.emitToDevice(deviceId, 'nearby-users', {
        count: nearbyDevices.length,
        devices: nearbyDevices,
      });
    }
  }

  private async handleProximityInteraction(interaction: NFCInteraction): Promise<void> {
    // Procesar eventos de proximidad
    logger.debug(`Proximity event for device ${interaction.deviceId}`);
  }

  public async cleanup(): Promise<void> {
    if (this.mqttClient) {
      this.mqttClient.end();
    }
    await this.prisma.$disconnect();
    logger.info('NFC Service cleanup completed');
  }
}

export default NFCService;
