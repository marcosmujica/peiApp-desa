import { View, ActivityIndicator, Text, StyleSheet, useColorScheme, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStyles } from "../styles/home";
import { colors, fonts, tStyles } from "../common/theme";
import { useState, useEffect } from 'react';

export default function LoadingOverlay({ loading, title = ""}) {

  const mode = useColorScheme();
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    if (loading) {
      setShowTitle(false);
      const timer = setTimeout(() => {
        setShowTitle(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  return (
    <Modal
      visible={loading}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={getStyles(mode).loading}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary}/>
          {showTitle && title && (
            <Text style={[getStyles(mode).normalText, { textAlign: 'center', marginTop: 16 }]}>{title}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
 
  container: {
    justifyContent: 'center',
    alignItems: 'center',
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