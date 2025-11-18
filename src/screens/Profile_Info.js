import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  useColorScheme,
  KeyboardAvoidingView,
  TextInput,
} from "react-native";
import { colors, tStyles } from "../common/theme";
import { getStyles } from "../styles/home";
import { SafeAreaView } from "react-native-safe-area-context";
import TitleBar from "../components/TitleBar";
import AppContext from "../context/appContext";
import Loading from "../components/Loading";
import {
  setInitGroupBy,
  isLogged,
  getProfile,
  setProfile,
} from "../commonApp/profile";
import { USER, USER_CONFIG } from "../commonApp/dataTypes";
import {
  SEX_DEFAULT,
  SEX_LIST,
  USER_PREFIX_USER,
} from "../commonApp/constants";
import { db_setNewUser, db_addUserConfig } from "../commonApp/database";
import { validateEmail } from "../commonApp/functions";
import DropDownList from "../components/DropDownList";

const Profile_Info = ({ navigation, route }) => {
  const mode = useColorScheme();

  const { showAlertModal } = React.useContext(AppContext);
  const [about, setAbout] = React.useState("");
  const [myName, setMyName] = React.useState("");
  const [email, setemail] = React.useState("");
  const [web, setWeb] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [loading, setLoading] = React.useState("");
  const [sex, setSex] = React.useState(SEX_DEFAULT);
  const [countryName, setCountryName] = React.useState("");
  const [profile, setProfileInfo] = React.useState ({})

  
  // Aquí podés hacer cosas que se ejecutan una vez al cargar el componente
  useEffect(() => {
    setProfileInfo (getProfile())
    setMyName(profile.name);
    setAbout(profile.about);
    setemail(profile.email);
    setSex(profile.sex);
    setCountryName(profile.countryName);

    return () => {
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, [profile]); // <- array vacío = solo se ejecuta una vez (cuando se monta)

  async function checkInfoAndSave() {
    try {
      if (myName.length == 0) {
        showAlertModal("Nombre", "Por favor ingresa tu nombre en Información", {
          ok: true,
          cancel: false,
        });
        return;
      }
      if (email.length > 0 && !validateEmail(email)) {
        showAlertModal(
          "eMail",
          "Tu email no parece valido, por favor verificalo",
          {
            ok: true,
            cancel: false,
          }
        );
        return;
      }

      setLoading(true);

      try {
        profile.name = myName;
        profile.idUser = profile.phone;
        profile.isActive = true;
        profile.isLogged = true;
        profile.about = about;
        profile.email = email;
        profile.sex = sex;
        await setProfile(profile);

        navigation.navigate("UserProfile");
      
      } catch (e) {
        showAlertModal(
          "Atención",
          "Existio un error al crear el usuario, por favor intentar en unos minutos",
          {
            ok: true,
            cancel: false,
          }
        );
        console.log(e);
      }

      setLoading(false);
    } catch (e) {
      console.log(e);
    }
  }

  function setSexInfo(sex) {
    setSex(sex.codigo);
  }
  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  return (
    <SafeAreaView style={getStyles(mode).container}>
      <Loading loading={loading} title="Procesando..." />
      <View>
        {/* Top Bar  */}
        <TitleBar
          title="Información"
          subTitle=""
          goBack={true}
          onGoBack={checkInfoAndSave}
        ></TitleBar>
        <View style={{ padding: 10 }}>
        <View style={{ padding: 10 }}>
          <Text style={getStyles(mode).sectionTitle}>Nombre</Text>
          <View style={getStyles(mode).searchBar}>
            <TextInput
              placeholder="tu nombre..."
              placeholderTextColor={colors.secondary}
              style={getStyles(mode).textInput}
              value={myName}
              onChangeText={setMyName}
            />
          </View>
        </View>
        <View style={{ padding: 10 }}>
          <Text style={getStyles(mode).sectionTitle}>Sobre ti</Text>
          <View style={getStyles(mode).searchBar}>
            <TextInput
              placeholder="cuenta algo de ti..."
              placeholderTextColor={colors.secondary}
              style={getStyles(mode).textInput}
              value={about}
              multiline={true}
              numberOfLines={5}
              onChangeText={setAbout}
            />
          </View>
      </View>
      <View style={{ padding: 10 }}>
        <Text style={getStyles(mode).sectionTitle}>Género</Text>
        <Text>
        <DropDownList
          placeholder="mi género es..."
          data={SEX_LIST}
          onSelected={setSexInfo}
        />
        </Text>
      </View>
      <View style={{ padding: 10 }}>
        <Text style={getStyles(mode).sectionTitle}>País: {countryName}</Text>
      </View>

      <View style={{ padding: 10 }}>
        <Text style={getStyles(mode).sectionTitle}>eMail</Text>
        <View style={getStyles(mode).searchBar}>
          <TextInput
            placeholder="tu dirección de eMail..."
            placeholderTextColor={colors.secondary}
            style={getStyles(mode).textInput}
            value={email}
            onChangeText={setemail}
          />
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <Text style={getStyles(mode).sectionTitle}>Instagram</Text>
        <View style={getStyles(mode).searchBar}>
          <TextInput
            placeholder="cuenta de instagram..."
            placeholderTextColor={colors.secondary}
            style={getStyles(mode).textInput}
            value={instagram}
            onChangeText={setInstagram}
          />
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <Text style={getStyles(mode).sectionTitle}>Sitio web</Text>
        <View style={getStyles(mode).searchBar}>
          <TextInput
            placeholder="la direccion de tu sitio web..."
            placeholderTextColor={colors.secondary}
            style={getStyles(mode).textInput}
            value={web}
            onChangeText={setWeb}
          />
        </View>
      </View>
      </View>
      </View>
    </SafeAreaView>
  );
};
export default Profile_Info;
