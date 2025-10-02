import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  Platform,
} from "react-native";
import {
  Entypo,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { colors, fonts, tStyles } from "../common/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import SlideOptions from "../components/SlideOptions";
import AppContext from "../context/appContext";
import { getStyles } from "../styles/settings";
import Hr from "../components/Hr";
import TitleBar from "../components/TitleBar";
import { getProfile } from "../commonApp/profile";
import CountryFlag from "react-native-country-flag";
import { useFocusEffect } from "@react-navigation/native";
import ImgAvatar from "../components/ImgAvatar";
import { URL_AVATAR_IMG_UPLOAD } from "../commonApp/constants";
import * as ImagePicker from "expo-image-picker";
import Loading from "../components/Loading";

const UserProfile = ({ navigation }) => {
  const mode = useColorScheme();
  const [myName, setMyName] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [idUser, setIdUser] = React.useState("");
  const [isLoading, setLoading] = React.useState(false);
  const [avatarKey, setAvatarKey] = React.useState(Date.now());
  
  const { showAlertModal } = React.useContext(AppContext);

  let profile = {};

  async function setPhoto() {
    try {
      setLoading(true);
      // Verificar permisos en mobile
      if (Platform.OS !== "web") {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          showAlertModal(
            "Atención",
            "Se necesitan permisos para acceder a la galería"
          );
          return;
        }
      }

      // Seleccionar imagen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        presentationStyle: Platform.OS === "ios" ? 0 : undefined, // optional, for iOS
        // Permite elegir entre cámara y galería en mobile
        // En iOS y Android, esto muestra ambas opciones si true
        allowsMultipleSelection: false,
        selectionLimit: 1,
        // show camera option in picker (solo mobile)
        // expo-image-picker no soporta directamente "camera" en el picker,
        // así que hay que ofrecer ambas opciones manualmente
      });

      // Si el usuario quiere tomar una foto, hay que lanzar la cámara manualmente
      if (
        Platform.OS !== "web" &&
        (result.canceled || !result.assets || result.assets.length === 0)
      ) {
        // Preguntar si quiere tomar una foto
        // Puedes usar un modal o Alert aquí, pero para simplicidad:
        // Lanzar la cámara directamente si no seleccionó nada
        const cameraResult = await ImagePicker.launchCameraAsync({
          mediaTypes: "images",
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });
        if (!cameraResult.canceled && cameraResult.assets && cameraResult.assets.length > 0) {
          result.assets = cameraResult.assets;
          result.canceled = false;
        }
      }

      console.log (result)
      if (result === undefined || result.canceled) {
        setLoading(false)
        return;
      }

      // Obtener el archivo seleccionado
      const file = result.assets[0];
      const formData = new FormData();

      if (Platform.OS === "web") {
        // En web, el resultado es un Blob
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append("image", blob, `${idUser}_${Date.now()}.jpg`);
      } else {
        // En mobile, necesitamos crear un objeto de archivo
        const localUri =
          Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri;
        formData.append("image", {
          uri: localUri,
          type: "image/jpeg",
          name: `${idUser}_${Date.now()}.jpg`,
        });
      }

      // Agregar el ID de usuario
      formData.append("idUser", idUser);

      // Enviar al servidor
      console.log('Enviando imagen a:', URL_AVATAR_IMG_UPLOAD);
      try {
        const response = await fetch(URL_AVATAR_IMG_UPLOAD, {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        });

        const responseData = await response.json();

        if (response.ok) {
          // Actualizar el timestamp para forzar la recarga de la imagen
          setAvatarKey(Date.now());
          //showAlertModal(
          //  "Éxito",
          //  "La imagen se actualizó correctamente"
          //);
        } else {
          showAlertModal(
            "Error",
            responseData.error || "La imagen no se pudo procesar, por favor intenta con otra y comprueba que tienes acceso a internet"
          );
        }
      } catch (e) {
        console.error('Error en la subida:', e);
        showAlertModal(
          "Error",
          "Error de conexión. Por favor verifica tu conexión a internet."
        );
      }

      

      
    } catch (error) {
      console.error("Error al procesar la imagen:", error);
      showAlertModal(
        "Error",
        "Ocurrió un error al procesar la imagen. Por favor intente nuevamente."
      );
    }

    setLoading(false);
  }

  function getProfileInfo() {
    profile = getProfile(); // mm - obtengo los datos del profile
    setMyName(profile.name);
    setCountryCode(profile.countryCode);
    setPhone(profile.phone);
    setIdUser(profile.idUser);
  }

  useFocusEffect(
    useCallback(() => {
      getProfileInfo();
      return () => {
        console.log("El screen se desenfocó");
      };
    }, [])
  );

  return (
    <SafeAreaView style={getStyles(mode).container}>
          <TitleBar
            title="Ajustes"
            subTitle=""
            goBack={true}
            onGoBack={() => navigation.navigate("MainScreen")}
          />
      <Loading loading={isLoading}/>
      <View style={getStyles(mode).container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/*mm- aseguro que vuelve al menu de perfil por si llegue por el login*/}

          <TouchableOpacity
            onPress={() => setPhoto()}
            style={getStyles(mode).profileHolder}
          >
            <View
              style={{
                position: "relative",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ImgAvatar id={idUser} key={avatarKey} cache={false}/>
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor:
                    mode === "dark" ? colors.gray30 : colors.gray50,
                  borderRadius: 20,
                  padding: 4,
                }}
              >
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </View>
            <View style={{ paddingLeft: 20 }}>
              <Text style={getStyles(mode).profileName}>{myName}</Text>
              <Text style={getStyles(mode).profileStatus}>
                <CountryFlag isoCode={countryCode} /> {phone}
              </Text>
            </View>
          </TouchableOpacity>

          <Hr size={1} color={mode == "dark" ? colors.gray75 : colors.gray5} />

          <View style={{ paddingHorizontal: 15 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile_Info")}
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
                  {" "}
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
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile_AreaToWork")}
              style={getStyles(mode).settingsLink}
            >
              <View style={{ width: 45 }}>
                <MaterialCommunityIcons
                  name="pencil-outline"
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
                  name="bell-outline"
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
                  envianos un comentario, queremos escucharte
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("HelpCenter")}
              style={getStyles(mode).settingsLink}
            >
              <View style={{ width: 45 }}>
                <MaterialCommunityIcons
                  name="file-document"
                  size={22}
                  color={mode == "dark" ? colors.gray30 : colors.gray50}
                />
              </View>

              <View style={getStyles(mode).settingsTextHolder}>
                <Text style={getStyles(mode).settingMainText}>
                  Terminos y Condiciones
                </Text>
                <Text style={getStyles(mode).settingSecText}>
                  no te quedes con dudas
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("AppInfo")}
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
                  Information regarding our app
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
                <Text style={getStyles(mode).settingMainText}>Invite</Text>
                <Text style={getStyles(mode).settingSecText}>
                  Invite a friend to ChatApp
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default UserProfile;
