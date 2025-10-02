import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Alert, Image, StyleSheet, Dimensions, TouchableOpacity, Text, Platform, Linking } from 'react-native';
// Use legacy API for createDownloadResumable to avoid deprecation warnings
import * as FileSystem from 'expo-file-system/legacy';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as IntentLauncher from 'expo-intent-launcher';
import * as WebBrowser from "expo-web-browser";
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function MediaViewer({ url, onClose, headerHeight = 0 }) {
  const [localUri, setLocalUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pathUrl, setPathUrl] = useState (url)
console.log (url)
  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const panRef = useRef({ x: 0, y: 0 });
  const prevLocalRef = useRef(null);

  useEffect(() => {
    let canceled = false;


    const download = async () => {
      try {
        // unmount previous image immediately so the new one will render fresh
        setLocalUri(null);
        setLoading(true);
        const ext = (url.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
        const isPdf = ext === 'pdf' || url.toLowerCase().includes('.pdf');
        // create a unique local filename per download to avoid re-using cached file paths
        const ts = Date.now();
        const local = `${FileSystem.cacheDirectory}viewer_temp_${ts}.${ext}`;

        const downloadResumable = FileSystem.createDownloadResumable(url, local);
        const { uri } = await downloadResumable.downloadAsync();
        if (!canceled) {
          // ensure the file exists on disk (small retry loop) before updating state
          let info = await FileSystem.getInfoAsync(uri);
          let tries = 0;
          while (!info.exists && tries < 5) {
            await new Promise((r) => setTimeout(r, 100));
            info = await FileSystem.getInfoAsync(uri);
            tries += 1;
          }
          // delete previously downloaded temp file (if any) to free space
          try {
            if (prevLocalRef.current && prevLocalRef.current !== uri) {
              await FileSystem.deleteAsync(prevLocalRef.current, { idempotent: true });
            }
          } catch (e) {
            // ignore deletion errors
          }
          prevLocalRef.current = uri;
          // If the file is a PDF, open it in the device's default app and exit the viewer
          if (isPdf) {
            console.log('[MediaViewer] PDF downloaded to', uri, 'platform:', Platform.OS);
            let opened = false;
            try {
              // 1) Try to open directly in the system browser (best-effort)
              try {
                const wb = await WebBrowser.openBrowserAsync(uri);
                opened = true;
              } catch (wbErr) {
                console.warn('[MediaViewer] WebBrowser.openBrowserAsync failed for local uri', wbErr);
                // If WebBrowser fails on Android due to file:// exposure, try the Sharing API which uses ACTION_SEND and works in Expo Go
                if (Platform.OS === 'android') {
                  try {
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
                      opened = true;
                    }
                  } catch (shareErr) {
                    console.warn('[MediaViewer] Sharing.shareAsync failed', shareErr);
                  }
                }
              }

              // 2) If not opened and file is small, try data: URI via WebBrowser
              if (!opened) {
                try {
                  const info = await FileSystem.getInfoAsync(uri);
                  const maxDataSize = 2 * 1024 * 1024; // 2MB
                  if (info && info.exists && info.size && info.size <= maxDataSize) {
                    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                    const dataUrl = `data:application/pdf;base64,${b64}`;
                    try {
                      await WebBrowser.openBrowserAsync(dataUrl);
                      opened = true;
                    } catch (dataErr) {
                      console.warn('[MediaViewer] WebBrowser.openBrowserAsync failed for data URI', dataErr);
                    }
                  }
                } catch (infoErr) {
                  console.warn('[MediaViewer] getInfo/readAsString failed', infoErr);
                }
              }

              // 3) Fallback: open with device default app (Intent/View or Linking)
              if (!opened) {
                try {
                  if (Platform.OS === 'android') {
                    try {
                      const contentUri = await FileSystem.getContentUriAsync(uri);
                      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                        data: contentUri,
                        type: 'application/pdf',
                      });
                    } catch (contentErr) {
                      console.warn('[MediaViewer] getContentUriAsync or VIEW intent failed', contentErr);
                      // Fallback: try Sharing again
                      try {
                        if (await Sharing.isAvailableAsync()) {
                          await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
                          opened = true;
                        }
                      } catch (shareErr) {
                        console.warn('[MediaViewer] fallback Sharing.shareAsync failed', shareErr);
                      }
                    }
                  } else {
                    await Linking.openURL(uri);
                  }
                  opened = true;
                } catch (fallbackErr) {
                  console.warn('[MediaViewer] fallback open failed', fallbackErr);
                }
              }

              if (!opened) {
                Alert.alert('Error', 'No se pudo abrir el PDF en el navegador ni en aplicaciones externas.');
              } else if (typeof onClose === 'function') {
                onClose();
              }
            } catch (openErr) {
              console.warn('[MediaViewer] Error opening PDF', openErr);
              Alert.alert('Error', 'No se pudo abrir el PDF en la aplicación predeterminada.');
            }
            return;
          }

          // Try to read file as base64 and set a data URI to ensure the Image component displays fresh data
          try {
            const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            const dataUri = `data:image/${ext};base64,${b64}`;
            setLocalUri(dataUri);
          } catch (e) {
            // fallback to file uri if reading fails
            setLocalUri(uri);
          }
        }
      } catch (err) {
        console.warn('MediaViewer download error', err);
        Alert.alert('Error', 'No se pudo descargar el archivo.');
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    download();

    return () => {
      canceled = true;
    };
  }, [url]);

  // cleanup last temp file when component unmounts
  useEffect(() => {
    return () => {
      (async () => {
        try {
          if (prevLocalRef.current) {
            await FileSystem.deleteAsync(prevLocalRef.current, { idempotent: true });
          }
        } catch (e) {
          // ignore
        }
      })();
    };
  }, []);

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      // temporary scale = baseScale * gestureScale
      scale.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, baseScale.value * e.scale));
    })
    .onEnd(() => {
      // persist the scale by updating baseScale
      baseScale.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, baseScale.value * (scale.value / baseScale.value)));
      // keep current scale (no reset)
      scale.value = baseScale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = panRef.current.x + e.translationX;
      translateY.value = panRef.current.y + e.translationY;
    })
    .onEnd(() => {
      panRef.current.x = translateX.value;
      panRef.current.y = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#000" />;

  if (!localUri) return (
    <View style={[styles.center, { paddingTop: headerHeight }] }>
      <Text style={{ color: '#fff' }}>No se pudo cargar la imagen.</Text>
      
    </View>
  );

  const viewerHeight = Math.max(0, height - headerHeight);

  return (
    <View style={styles.container}>
      {/* action buttons: share, save, close */}
      <View style={{ position: 'absolute', top: headerHeight + 10, right: 10, zIndex: 50, flexDirection: 'row' }}>
        <TouchableOpacity onPress={async () => {
          try {
            const target = prevLocalRef.current || localUri;
            if (!target) return;
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(target, { mimeType: 'application/pdf' });
            } else {
              Alert.alert('Compartir', 'La función de compartir no está disponible en este dispositivo.');
            }
          } catch (e) {
            console.warn('share error', e);
            Alert.alert('Error', 'No se pudo compartir el archivo.');
          }
        }} style={[styles.iconBtn, { marginRight: 8 }] }>
          <Feather name="share-2" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={async () => {
          try {
            const src = prevLocalRef.current || localUri;
            if (!src) return;
            // determine extension
            const ext = (src.split('.').pop() || 'pdf').split('?')[0];
            const dest = `${FileSystem.documentDirectory}saved_${Date.now()}.${ext}`;
            await FileSystem.copyAsync({ from: src, to: dest });
            
            Alert.alert('Guardado', `Archivo guardado en: ${dest}`);
          } catch (e) {
            console.warn('save error', e);
            Alert.alert('Error', 'No se pudo guardar el archivo.');
          }
        }} style={[styles.iconBtn, { marginRight: 8 }]}>
          <Feather name="download" size={20} color="#fff" />
        </TouchableOpacity>
        
      </View>

      <GestureDetector gesture={composed}>
        <Animated.View key={localUri || 'empty-wrapper'} style={[styles.imageWrapper, { height: viewerHeight, position: 'absolute', top: headerHeight, left: 0, right: 0 }] }>
          <AnimatedImage key={localUri || 'empty-image'} source={{ uri: localUri }} style={[styles.image, animatedStyle]} resizeMode="contain" />
        </Animated.View>
      </GestureDetector>

      
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageWrapper: { width: width, height: height, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  closeBtn: { position: 'absolute', top: 40, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 6 },
  closeText: { color: '#fff' },
  iconBtn: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  pdf: {
    flex: 1,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  }
});

