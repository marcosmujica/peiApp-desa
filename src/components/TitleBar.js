import React from "react";
import { Platform, StyleSheet,View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather } from "@expo/vector-icons";
import { tStyles, colors } from "../common/theme";
import { getStyles } from "../styles/home";
import { _contacts } from "../commonApp/database";
import "../commonApp/global";
import { useNavigation } from "@react-navigation/native";
import { displayTime, ellipString } from '../common/helpers';
import { MaterialCommunityIcons, Fontisto } from "@expo/vector-icons";
import Hr from "../components/Hr"
import ImgAvatar from "./ImgAvatar";

const TitleBar = ({title, subtitle, goBack, onGoBack, options, idAvatar = "" }) => {

  const navigation = useNavigation()
  const mode = useColorScheme();

  if (options==undefined) { options = []}

  return (
    <View style={getStyles(mode).topBarHolder}>
      <View style={[tStyles.row, { alignItems: 'center', flex: 1 }]} >
        {goBack && (
          <TouchableOpacity 
            style={{ alignItems: 'center', justifyContent: 'center' }}
            onPress={() => onGoBack == undefined ? navigation.goBack() : onGoBack ()}>
            <Feather
              name="arrow-left"
              size={20}
              color={mode == "dark" ? colors.gray30 : null}
              style={{padding:10}}
            />
          </TouchableOpacity>
        )}
        {idAvatar != "" && (
          <View style={{marginRight:10}}><ImgAvatar id={idAvatar} size={35}  /></View>
        )}
        <TouchableOpacity 
          style={{ 
            flex: 1, 
            justifyContent: 'center',
            minHeight: 40, // Altura mínima para coincidir con el botón de regreso
            paddingVertical: 5  // Padding para mantener espacio consistente
          }}
          onPress={() => onGoBack == undefined ? navigation.goBack() : onGoBack ()}>
            <View style={{ justifyContent: 'center', height: subtitle ? 'auto' : 40 }}>
              <Text style={[getStyles(mode).topBarMainText, { alignSelf: 'flex-start' }]}>{ellipString (title, 30)}</Text>
              {subtitle != "" && <Text style={[getStyles(mode).topBarSecText, { alignSelf: 'flex-start' }]}>{subtitle == undefined && subtitle != "" ? "" :  ellipString (subtitle, 50)}</Text>}
            </View>
        </TouchableOpacity>
        <View style={[styles.rightButtons, { alignItems: 'center', justifyContent: 'center' }]}>
          <Options optionsList={options}/>
        </View>
      </View>
    </View>
  );
};

const Options = ({ optionsList }) => {
  const colorScheme = useColorScheme();
  if (!optionsList || optionsList.length === 0) return null;
  return (
    <View style={[tStyles.row, { flexDirection: 'row', justifyContent: 'flex-end' }]}>
      {optionsList.map((item, idx) => (
        <TouchableOpacity
          key={item.name || idx}
          onPress={() => item.onClick && item.onClick()}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <Fontisto
            name={item.name}
            size={15}
            color={colors.gray50}
            style={{ padding: 10 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    zIndex: 999,
  },
  backButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40, // Asegura altura mínima consistente
  },
  rightButton: {
    marginLeft: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});

export default TitleBar;
