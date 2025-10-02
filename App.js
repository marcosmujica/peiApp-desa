import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useFonts, Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import PeiApp from './src/peiApp';
import AppState from './src/context/appState';
import Toast from 'react-native-toast-message';


export default function App() {
  // Load fonts
  let [fontsLoaded, fontError] = useFonts({
    Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_900Black
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }


  return (
    <AppState>
      <View style={ styles.container } >
        <PeiApp />
        <StatusBar style="auto" />
        <Toast />
      </View>
    </AppState>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});
