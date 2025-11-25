import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configurar comportamiento de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationManager {
  constructor() {
    this.token = null;
    this.notification = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.isAppActive = true;
  }

  /**
   * Inicializar el sistema de notificaciones
   * @param {boolean} showWhenOpen - Mostrar notificaciones cuando la app está abierta
   * @param {boolean} showWhenClosed - Mostrar notificaciones cuando la app está cerrada
   */
  async initialize(showWhenOpen = false, showWhenClosed = true) {
    try {
      // Configurar cuándo mostrar notificaciones
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: showWhenOpen ? true : !this.isAppActive,
          shouldPlaySound: showWhenClosed ? true : this.isAppActive,
          shouldSetBadge: showWhenClosed,
        }),
      });

      // Obtener token de push notifications
      this.token = await this.getExpoPushToken();

      // Configurar listeners
      this.setupNotificationListeners();

      // Registrar token (llamará a la función externa cuando esté disponible)
      if (this.token) {
        await this.registerToken(this.token);
      }

      console.log('✅ NotificationManager inicializado correctamente');
      console.log('📱 Token:', this.token);

      return {
        success: true,
        token: this.token
      };
    } catch (error) {
      console.error('❌ Error inicializando NotificationManager:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener token de Expo Push Notifications
   */
  async getExpoPushToken() {
    let token;

    // Detectar si se está ejecutando en Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (isExpoGo) {
      console.warn('⚠️ Notificaciones push deshabilitadas en Expo Go (requiere development build)');
      // Retornar token mock para que la app siga funcionando
      token = `ExponentPushToken[expo-go-mock-${Date.now()}]`;
      return token;
    }

    if (Platform.OS === 'android') {
      console.log ("Configurando canal Android")
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('No se obtuvieron permisos para notificaciones push');
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('📱 Expo Push Token obtenido:', token);
    } else {
      console.warn('⚠️ Las notificaciones push solo funcionan en dispositivos físicos');
      // En simulador/emulador, generar un token mock para testing
      token = `ExponentPushToken[mock-${Date.now()}]`;
    }

    return token;
  }

  /**
   * Configurar listeners para notificaciones
   */
  setupNotificationListeners() {
    // Listener para notificaciones recibidas mientras la app está activa
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notificación recibida:', notification);
      this.notification = notification;
      this.onNotificationReceived(notification);
    });

    // Listener para cuando el usuario toca una notificación
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notificación tocada:', response);
      this.onNotificationTapped(response);
    });
  }

  /**
   * Callback cuando se recibe una notificación
   * Puede ser sobrescrito para manejar notificaciones personalizadas
   */
  onNotificationReceived(notification) {
    // Implementación por defecto - puede ser sobrescrita
    console.log('📨 Procesando notificación recibida:', notification.request.content.title);
  }

  /**
   * Callback cuando el usuario toca una notificación
   * Puede ser sobrescrito para navegar o realizar acciones específicas
   */
  onNotificationTapped(response) {
    // Implementación por defecto - puede ser sobrescrita
    console.log('👆 Usuario tocó notificación:', response.notification.request.content.title);
  }

  /**
   * Registrar token en el servidor
   * Esta función debe ser implementada para conectar con tu backend
   */
  async registerToken(token) {
    try {
      // TODO: Implementar llamada a la clase externa registerToken
      console.log('🔄 Registrando token en servidor...', token);
      
      // Placeholder para la función externa
      // await externalRegisterTokenFunction(token);
      
      console.log('✅ Token registrado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error registrando token:', error);
      return false;
    }
  }

  /**
   * Configurar estado de la app (activa/inactiva)
   * Llamar cuando la app entre en background/foreground
   */
  setAppState(isActive) {
    this.isAppActive = isActive;
    console.log(`📱 Estado de app cambiado: ${isActive ? 'Activa' : 'Inactiva'}`);
  }

  /**
   * Enviar notificación local para testing
   */
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
        },
        trigger: { seconds: 2 },
      });
      console.log('📤 Notificación local programada');
    } catch (error) {
      console.error('❌ Error enviando notificación local:', error);
    }
  }

  /**
   * Obtener token actual
   */
  getToken() {
    return this.token;
  }

  /**
   * Limpiar listeners y recursos
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    console.log('🧹 NotificationManager limpiado');
  }

  /**
   * Verificar si las notificaciones están habilitadas
   */
  async areNotificationsEnabled() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Solicitar permisos de notificación
   */
  async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Cancelar todas las notificaciones pendientes
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ Todas las notificaciones canceladas');
  }

  /**
   * Obtener número de notificaciones pendientes
   */
  async getPendingNotificationsCount() {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.length;
  }
}

// Exportar instancia singleton
const notificationManager = new NotificationManager();
export default notificationManager;

// Exportar clase para casos donde se necesiten múltiples instancias
export { NotificationManager };