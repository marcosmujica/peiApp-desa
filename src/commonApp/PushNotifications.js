import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Clase para gestionar notificaciones push
 * Obtiene y almacena el token del usuario para su uso posterior
 */
class PushNotifications {
  constructor() {
    this.token = null;
    this.isInitialized = false;
  }

  /**
   * Inicializar y obtener el token de notificaciones
   * @returns {Promise<string|null>} El token de push notifications o null si falla
   */
  async initialize(initCallback) {
    if (this.isInitialized && this.token) {
      console.log('✅ PushNotifications ya inicializado, token:', this.token);
      return this.token;
    }

    try {
      // Configurar canal de Android si es necesario
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Solo funciona en dispositivos físicos
      if (!Device.isDevice) {
        console.warn('⚠️ Las notificaciones push solo funcionan en dispositivos físicos');
        this.token = `mock-token-${Date.now()}`;
        this.isInitialized = true;
        return this.token;
      }

      // Verificar permisos existentes
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Solicitar permisos si no están otorgados
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Verificar si se otorgaron los permisos
      if (finalStatus !== 'granted') {
        console.error('❌ Permisos de notificaciones denegados');
        return null;
      }

      // Obtener el token de Expo Push Notifications
      const tokenData = await Notifications.getExpoPushTokenAsync();
      this.token = tokenData.data;
      this.isInitialized = true;
      initCallback ()

      console.log('✅ Token de notificaciones obtenido:', this.token);
      return this.token;

    } catch (error) {
      console.error('❌ Error obteniendo token de notificaciones:', error);
      return null;
    }
  }

  /**
   * Obtener el token actual
   * @returns {string|null} El token almacenado o null si no está disponible
   */
  getToken() {
    if (!this.isInitialized) {
      console.warn('⚠️ PushNotifications no está inicializado. Llama a initialize() primero.');
    }
    return this.token;
  }

  /**
   * Verificar si el token está disponible
   * @returns {boolean} True si hay un token disponible
   */
  hasToken() {
    return this.token !== null;
  }

  /**
   * Resetear el token (útil para logout o cambio de usuario)
   */
  reset() {
    this.token = null;
    this.isInitialized = false;
    console.log('🔄 Token de notificaciones reseteado');
  }
}

// Exportar instancia singleton
const pushNotifications = new PushNotifications();
export default pushNotifications;

// Exportar clase para casos donde se necesiten múltiples instancias
export { PushNotifications };
