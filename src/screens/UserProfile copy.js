import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
} from "react-native";
import {
  Entypo,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather
} from "@expo/vector-icons";
import { colors, fonts, tStyles } from "../common/theme";
import SlideOptions from "../components/SlideOptions";
import { getStyles } from "../styles/home";
import React, { useState, useEffect, useCallback} from "react";
import { useFocusEffect } from '@react-navigation/native';
import Hr from "../components/Hr";
import AppContext from "../context/appContext";
import CountryFlag from "react-native-country-flag";
import { getProfile} from "../commonApp/profile";
import TitleBar from "../components/TitleBar";

const UserProfile = ({ navigation, route }) => {
  const mode = useColorScheme();
  const [avatarUri, setAvatarUri] = React.useState("../assets/user.png");
  const { showAlertModal } = React.useContext(AppContext);
  const [myName, setMyName] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState("");
  
  let profile = {}

  function getProfileInfo()
  {
    profile = getProfile(); // mm - obtengo los datos del profile
    setMyName (profile.name)
    setCountryCode (profile.countryCode)
    setPhone (profile.phone)
  }

  // Aquí podés hacer cosas que se ejecutan una vez al cargar el componente
  useEffect(() => {
    
    return () => {
      console.log("🧹 Componente desmontado");
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)

  useFocusEffect(
    useCallback(() => {
      getProfileInfo()
      return () => {
        console.log('El screen se desenfocó');
      };
    }, [])
  );

  function goToProfileInfo()
  {
    navigation.navigate("Profile_Info")
  }

  const mostrarAlerta = (title, msg) => {
    showAlertModal(title, msg);
  };

  return (
    <View style={getStyles(mode).container}>
      <ScrollView showsVerticalScrollIndicator={false}>
      <TitleBar title="Ajustes" subTitle="" goBack={true} onGoBack={() => navigation.navigate("MainScreen")// mm- aseguro que vuelve al menu de perfil por si llegue por el login
      }></TitleBar>
        {/* Profile Details */}
        <View style={getStyles(mode).profileImageHolder}>
                <TouchableOpacity style={getStyles(mode).linkIconHolder}>
                  <Image
                    source={require("../assets/user.png")}
                    style={getStyles(mode).linkAvatar}
                  />
                  <View style={getStyles(mode).avatarHolder}>
                    <Feather name="camera" size={22} color={colors.white} />
                  </View>
                </TouchableOpacity>
              </View>
        <Hr size={1} color={mode == "dark" ? colors.gray75 : colors.gray5} />

        {/* Setting Options */}
        <View style={{ paddingHorizontal: 15 }}>
          <TouchableOpacity
            onPress={() => goToProfileInfo()}
            style={getStyles(mode).settingsLink}
          >
            <View style={{ width: 45 }}>
              <MaterialCommunityIcons
                name="key-outline"
                size={22}
                color={mode == "dark" ? colors.gray30 : colors.gray50}
              />
            </View>

            <View style={getStyles(mode).settingsTextHolder}>
              <Text style={getStyles(mode).settingMainText}>Información</Text>
              <Text style={getStyles(mode).settingSecText}>
                cambiar tu info, PIN
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Profile_PayMethod")}
            style={getStyles(mode).settingsLink}
          >
            <View style={{ width: 45 }}>
              <MaterialCommunityIcons
                name="card"
                size={22}
                color={mode == "dark" ? colors.gray30 : colors.gray50}
              />
            </View>

            <View style={getStyles(mode).settingsTextHolder}>
              <Text style={getStyles(mode).settingMainText}>
                Instrucciones de Pago
              </Text>
              <Text style={getStyles(mode).settingSecText}>
                como hacen para pagarte
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={getStyles(mode).settingsLink} onPress={() => navigation.navigate("Profile_AreaToWork")}>
            <View style={{ width: 45 }}>
              <MaterialCommunityIcons
                name="message-reply-text-outline"
                size={22}
                color={mode == "dark" ? colors.gray30 : colors.gray50}
              />
            </View>

            <View style={getStyles(mode).settingsTextHolder}>
              <Text style={getStyles(mode).settingMainText}>
                Área de Trabajo
              </Text>
              <Text style={getStyles(mode).settingSecText}>
                configura temas sobre tu trabajo
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile_Notification")}
            style={getStyles(mode).settingsLink}
          >
            <View style={{ width: 45 }}>
              <MaterialCommunityIcons
                name="alert"
                size={22}
                color={mode == "dark" ? colors.gray30 : colors.gray50}
              />
            </View>

            <View style={getStyles(mode).settingsTextHolder}>
              <Text style={getStyles(mode).settingMainText}>
                Notificaciones
              </Text>
              <Text style={getStyles(mode).settingSecText}>
                configura las notificaciones del sistema
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile_Helpdesk")}
            style={getStyles(mode).settingsLink}
          >
            <View style={{ width: 45 }}>
              <MaterialCommunityIcons
                name="help-circle-outline"
                size={22}
                color={mode == "dark" ? colors.gray30 : colors.gray50}
              />
            </View>

            <View style={getStyles(mode).settingsTextHolder}>
              <Text style={getStyles(mode).settingMainText}>
                Centro de Ayuda
              </Text>
              <Text style={getStyles(mode).settingSecText}>
                envianos un comentario
              </Text>
            </View>
          </TouchableOpacity>
          

          <TouchableOpacity
            onPress={() => navigation.navigate("Profile_Helpdesk")}
            style={getStyles(mode).settingsLink}
          >
            <View style={{ width: 45 }}>
              <MaterialCommunityIcons
                name="information-outline"
                size={22}
                color={mode == "dark" ? colors.gray30 : colors.gray50}
              />
            </View>

            <View style={getStyles(mode).settingsTextHolder}>
              <Text style={getStyles(mode).settingMainText}>App info</Text>
              <Text style={getStyles(mode).settingSecText}>
                información sobre la app, terminos y condiciones
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("InviteFriend")}
            style={getStyles(mode).settingsLink}
          >
            <View style={{ width: 45 }}>
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={22}
                color={mode == "dark" ? colors.gray30 : colors.gray50}
              />
            </View>

            <View style={getStyles(mode).settingsTextHolder}>
              <Text style={getStyles(mode).settingMainText}>Invitar</Text>
              <Text style={getStyles(mode).settingSecText}>
                invita a un amigo a peiApp
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  );
};

export default UserProfile;
