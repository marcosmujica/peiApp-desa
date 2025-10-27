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
import { getFileAndUpload, uploadFileToServer } from "../commonApp/attachFile";
import AttachmentPickerHost, {
  hideAttachmentPicker,
  showAttachmentPicker,
} from "../components/AttachmentPicker";

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

  async function setPhoto(media="") {
    try {
      setLoading(true);
      if (media == "") {
        const res = await showAttachmentPicker();
        if (!res) return;
        media = res.type;
      }
      let uploadedFile = await getFileAndUpload(idUser, true, media);

      if (!uploadedFile) {
        showAlertModal ("Error", "Ocurrió un error al procesar la imagen. Por favor intente nuevamente.")
        return;
      }
    } catch (error) {
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
              <ImgAvatar id={idUser} key={avatarKey} cache={false} detail={false}/>
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
        <AttachmentPickerHost file={false} camera={true} gallery={true} />
      </View>
    </SafeAreaView>
  );
};

export default UserProfile;
