import NfcManager, { 
  NfcTech, 
  Ndef, 
  NfcEvents,
  TagEvent 
} from 'react-native-nfc-manager';
import { Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

import { apiService } from './apiService';
import { notificationService } from './notificationService';
import { soundService } from './soundService';
import { logger } from '@/utils/logger';

export interface NFCData {
  userId: string;
  eventId: string;
  deviceId: string;
  profile: {
    name: string;
    company?: string;
    position?: string;
    interests: string[];
    networkingStatus: 'AVAILABLE' | 'BUSY' | 'DO_NOT_DISTURB';
  };
  achievements: string[];
  connections: number;
  timestamp: string;
}

export interface NFCInteraction {
  type: 'HANDSHAKE' | 'TAP' | 'PROXIMITY';
  targetUserId?: string;
  targetDeviceId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  data?: any;
}

class NFCService {
  private isInitialized = false;
  private isScanning = false;
  private currentEventId: string | null = null;
  private currentUserId: string | null = null;

  // Inicializar el servicio NFC
  async initialize(): Promise<boolean> {
    try {
      // Verificar si NFC está disponible
      const isSupported = await NfcManager.isSupported();
      if (!isSupported) {
        logger.warn('NFC not supported on this device');
        return false;
      }

      // Inicializar NFC Manager
      await NfcManager.start();
      this.isInitialized = true;

      // Configurar listeners
      this.setupEventListeners();

      logger.info('NFC Service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize NFC Service:', error);
      return false;
    }
  }

  // Configurar listeners de eventos NFC
  private setupEventListeners(): void {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, this.handleTagDiscovered);
    NfcManager.setEventListener(NfcEvents.SessionClosed, this.handleSessionClosed);
  }

  // Manejar descubrimiento de tags NFC
  private handleTagDiscovered = async (tag: TagEvent) => {
    try {
      logger.info('NFC Tag discovered:', tag.id);

      // Reproducir sonido y vibración
      await this.provideFeedback('discovery');

      // Leer datos del tag
      const nfcData = await this.readNFCData(tag);
      if (!nfcData) {
        throw new Error('No se pudieron leer los datos del NFC');
      }

      // Procesar interacción
      await this.processNFCInteraction(nfcData, tag);

    } catch (error) {
      logger.error('Error handling NFC tag:', error);
      await this.provideFeedback('error');
      
      Alert.alert(
        'Error NFC',
        'No se pudo procesar la pulsera NFC. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      // Detener escaneo
      this.stopScanning();
    }
  };

  // Manejar cierre de sesión NFC
  private handleSessionClosed = () => {
    logger.info('NFC Session closed');
    this.isScanning = false;
  };

  // Iniciar escaneo NFC
  async startScanning(eventId: string, userId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('No se pudo inicializar NFC');
        }
      }

      if (this.isScanning) {
        logger.warn('NFC scanning already in progress');
        return true;
      }

      this.currentEventId = eventId;
      this.currentUserId = userId;

      // Verificar si NFC está habilitado
      const isEnabled = await NfcManager.isEnabled();
      if (!isEnabled) {
        Alert.alert(
          'NFC Deshabilitado',
          'Por favor, habilita NFC en la configuración de tu dispositivo.',
          [
            { text: 'Cancelar' },
            { 
              text: 'Configuración', 
              onPress: () => NfcManager.goToNfcSetting() 
            }
          ]
        );
        return false;
      }

      // Iniciar lectura de tags NDEF
      await NfcManager.requestTechnology(NfcTech.Ndef);
      this.isScanning = true;

      logger.info('NFC scanning started');
      return true;

    } catch (error) {
      logger.error('Failed to start NFC scanning:', error);
      this.isScanning = false;
      
      Alert.alert(
        'Error NFC',
        'No se pudo iniciar el escaneo NFC. Verifica que tu dispositivo soporte NFC.',
        [{ text: 'OK' }]
      );
      
      return false;
    }
  }

  // Detener escaneo NFC
  async stopScanning(): Promise<void> {
    try {
      if (this.isScanning) {
        await NfcManager.cancelTechnologyRequest();
        this.isScanning = false;
        logger.info('NFC scanning stopped');
      }
    } catch (error) {
      logger.error('Error stopping NFC scanning:', error);
    }
  }

  // Leer datos del tag NFC
  private async readNFCData(tag: TagEvent): Promise<NFCData | null> {
    try {
      // Leer mensaje NDEF
      const ndefMessage = tag.ndefMessage;
      if (!ndefMessage || ndefMessage.length === 0) {
        throw new Error('No NDEF message found');
      }

      // Decodificar el primer record
      const record = ndefMessage[0];
      const payload = Ndef.text.decodePayload(record.payload);
      
      // Parsear datos JSON
      const nfcData: NFCData = JSON.parse(payload);
      
      // Validar estructura de datos
      if (!nfcData.userId || !nfcData.eventId || !nfcData.deviceId) {
        throw new Error('Invalid NFC data structure');
      }

      return nfcData;

    } catch (error) {
      logger.error('Error reading NFC data:', error);
      return null;
    }
  }

  // Procesar interacción NFC
  private async processNFCInteraction(nfcData: NFCData, tag: TagEvent): Promise<void> {
    try {
      // Verificar que el evento coincida
      if (nfcData.eventId !== this.currentEventId) {
        Alert.alert(
          'Evento diferente',
          'Esta pulsera pertenece a un evento diferente.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Evitar auto-conexión
      if (nfcData.userId === this.currentUserId) {
        Alert.alert(
          'Tu propia pulsera',
          '¡Esta es tu pulsera! Toca la pulsera de otra persona para conectar.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Crear interacción
      const interaction: NFCInteraction = {
        type: 'HANDSHAKE',
        targetUserId: nfcData.userId,
        targetDeviceId: nfcData.deviceId,
        data: {
          compatibility: await this.calculateCompatibility(nfcData),
          timestamp: new Date().toISOString(),
        }
      };

      // Enviar interacción al backend
      const result = await apiService.post('/nfc/interactions', {
        eventId: this.currentEventId,
        userId: this.currentUserId,
        interaction,
      });

      // Procesar respuesta
      await this.handleInteractionResult(result.data, nfcData);

    } catch (error) {
      logger.error('Error processing NFC interaction:', error);
      throw error;
    }
  }

  // Manejar resultado de la interacción
  private async handleInteractionResult(result: any, targetData: NFCData): Promise<void> {
    const { connection, achievements, compatibility } = result;

    // Feedback basado en compatibilidad
    await this.provideFeedback('connection', compatibility);

    // Mostrar resultado de conexión
    const isNewConnection = connection?.isNew;
    const connectionStrength = connection?.strength || 1;

    Alert.alert(
      isNewConnection ? '¡Nueva conexión!' : '¡Reconectado!',
      `Conectado con ${targetData.profile.name}\n` +
      `Compatibilidad: ${Math.round(compatibility)}%\n` +
      `Conexiones: ${connectionStrength}`,
      [
        { text: 'Ver perfil', onPress: () => this.showUserProfile(targetData.userId) },
        { text: 'OK' }
      ]
    );

    // Mostrar logros desbloqueados
    if (achievements && achievements.length > 0) {
      setTimeout(() => {
        this.showAchievements(achievements);
      }, 1000);
    }

    // Enviar notificación local
    await notificationService.showConnectionNotification({
      userName: targetData.profile.name,
      compatibility,
      isNew: isNewConnection,
    });
  }

  // Calcular compatibilidad con otro usuario
  private async calculateCompatibility(targetData: NFCData): Promise<number> {
    try {
      // Obtener datos del usuario actual
      const currentUser = await apiService.get('/users/me');
      const currentInterests = currentUser.data.attendeeProfile?.interests || [];
      const targetInterests = targetData.profile.interests || [];

      if (currentInterests.length === 0 || targetInterests.length === 0) {
        return 50; // Compatibilidad base
      }

      // Calcular intersección de intereses
      const commonInterests = currentInterests.filter(interest => 
        targetInterests.includes(interest)
      );

      const totalInterests = new Set([...currentInterests, ...targetInterests]).size;
      const compatibility = (commonInterests.length / totalInterests) * 100;

      return Math.max(20, Math.min(100, compatibility)); // Entre 20% y 100%

    } catch (error) {
      logger.error('Error calculating compatibility:', error);
      return 50; // Compatibilidad por defecto
    }
  }

  // Proporcionar feedback háptico y sonoro
  private async provideFeedback(type: 'discovery' | 'connection' | 'error', compatibility?: number): Promise<void> {
    try {
      switch (type) {
        case 'discovery':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await soundService.playSound('scan');
          break;

        case 'connection':
          if (compatibility && compatibility > 70) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await soundService.playSound('connection-strong');
          } else if (compatibility && compatibility > 40) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await soundService.playSound('connection-medium');
          } else {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await soundService.playSound('connection-weak');
          }
          break;

        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          await soundService.playSound('error');
          break;
      }
    } catch (error) {
      logger.error('Error providing feedback:', error);
    }
  }

  // Mostrar perfil de usuario
  private showUserProfile(userId: string): void {
    // Implementar navegación al perfil
    // router.push(`/user-profile/${userId}`);
  }

  // Mostrar logros desbloqueados
  private showAchievements(achievements: any[]): void {
    achievements.forEach((achievement, index) => {
      setTimeout(() => {
        Alert.alert(
          '🏆 ¡Logro desbloqueado!',
          `${achievement.name}\n${achievement.description}`,
          [{ text: 'Genial!' }]
        );
      }, index * 1500);
    });
  }

  // Escribir datos en tag NFC (para configuración inicial)
  async writeNFCTag(data: NFCData): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Preparar mensaje NDEF
      const jsonString = JSON.stringify(data);
      const ndefRecord = Ndef.textRecord(jsonString);
      const ndefMessage = [ndefRecord];

      // Iniciar escritura
      await NfcManager.requestTechnology(NfcTech.Ndef);
      await NfcManager.writeNdefMessage(ndefMessage);

      logger.info('NFC tag written successfully');
      return true;

    } catch (error) {
      logger.error('Error writing NFC tag:', error);
      return false;
    } finally {
      await NfcManager.cancelTechnologyRequest();
    }
  }

  // Verificar si NFC está disponible y habilitado
  async isNFCAvailable(): Promise<{ supported: boolean; enabled: boolean }> {
    try {
      const supported = await NfcManager.isSupported();
      const enabled = supported ? await NfcManager.isEnabled() : false;

      return { supported, enabled };
    } catch (error) {
      logger.error('Error checking NFC availability:', error);
      return { supported: false, enabled: false };
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      if (this.isScanning) {
        await this.stopScanning();
      }

      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.setEventListener(NfcEvents.SessionClosed, null);

      if (this.isInitialized) {
        await NfcManager.stop();
        this.isInitialized = false;
      }

      logger.info('NFC Service cleanup completed');
    } catch (error) {
      logger.error('Error during NFC cleanup:', error);
    }
  }

  // Getters
  get isReady(): boolean {
    return this.isInitialized;
  }

  get isScanningActive(): boolean {
    return this.isScanning;
  }
}

export const nfcService = new NFCService();
export default nfcService;
