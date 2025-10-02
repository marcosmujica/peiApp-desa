import { View, ActivityIndicator, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStyles } from "../styles/home";
import { colors, fonts, tStyles } from "../common/theme";

export default function LoadingOverlay({ loading, title = ""}) {

  const mode = useColorScheme();

  if (!loading) return null;

  return (
    <View style={[getStyles(mode).loading]}>
      <Text style={[getStyles(mode).normalText, { textAlign: 'center', marginBottom: 16 }]}>{title}</Text>
      <ActivityIndicator size="large" color={colors.primary}/>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  customText: {
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: "center",
    color: 'rgba(19, 255, 31, 1)',           // 🎨 Color del texto
    fontSize: 20,
    fontWeight: 'bold',         // Negrita
  },
});