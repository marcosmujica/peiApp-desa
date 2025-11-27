import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

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
      // Detectar si estamos en Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';
      
      // Configurar canal de Android si es necesario
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // En Expo Go o simulador, usar token mock
      if (isExpoGo || !Device.isDevice) {
        const reason = isExpoGo 
          ? 'Expo Go no soporta push notifications reales (SDK 53+). Usa development build.'
          : 'Push notifications solo funcionan en dispositivos físicos';
        
        console.warn(`⚠️ ${reason}`);
        this.token = `mock-token-${Date.now()}`;
        this.isInitialized = true;
        
        if (initCallback && typeof initCallback === 'function') {
          initCallback(this.token);
        }
        
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
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.error('❌ No se encontró projectId en app.json');
        return null;
      }
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      });
      this.token = tokenData.data;
      this.isInitialized = true;

      console.log('✅ Token de notificaciones obtenido:', this.token);
      
      // Llamar al callback con el token
      if (initCallback && typeof initCallback === 'function') {
        initCallback(this.token);
      }
      
      return this.token;

    } catch (error) {
      console.error('❌ Error obteniendo token de notificaciones:', error);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      
      // Generar token mock en caso de error para no bloquear la app
      this.token = `error-token-${Date.now()}`;
      this.isInitialized = true;
      
      if (initCallback && typeof initCallback === 'function') {
        initCallback(this.token);
      }
      
      return this.token;
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
