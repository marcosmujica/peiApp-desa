import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  useColorScheme,
  KeyboardAvoidingView,
  TextInput,
  StyleSheet,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import { colors, tStyles, fonts } from "../common/theme";
import { getStyles } from "../styles/home";
import Hr from "../components/Hr";
import { SafeAreaView } from "react-native-safe-area-context";
import Modal from "../components/Modal";
import LineTextInput from "../components/LineTextInput";
import TitleBar from "../components/TitleBar";
import AppContext from "../context/appContext";
import Loading from "../components/Loading";
import { isLogged, getProfile, setProfile } from "../commonApp/profile";
import { HELP_DESK, USER } from "../commonApp/dataTypes";
import { db_addHelpDesk } from "../commonApp/database";

const Profile_Helpdesk = ({ navigation, route }) => {
  const mode = useColorScheme();

  const { showAlertModal } = React.useContext(AppContext);
  const [comment, setComment] = React.useState("");
  const [loading, setLoading] = React.useState("");

  // Aquí podés hacer cosas que se ejecutan una vez al cargar el componente
  useEffect(() => {
    return () => {
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)

  async function checkInfoAndSave() {
    if (comment == "") {
      showAlertModal(
        "Atención",
        "Ingresa el texto en lo que te podemos ayudar",
        {
          ok: true,
          cancel: false,
        }
      );
      return;
    }
    setLoading(true);

    profile = getProfile();
    try {
      let helpdesk = new HELP_DESK();

      helpdesk.idUser = profile.idUser;
      helpdesk.comment = comment;

      let status = await db_addHelpDesk(helpdesk);

      if (status === false) {
        showAlertModal(
          "Atención", "Existio un problema al registrar la información. Por favor reintenta más tarde",
          {
            ok: true,
            cancel: false,
          }
        );
        return;
      }
      showAlertModal(
        "Atención",
        "Hemos registrado tus comentarios, nos pondremos en contacto a la brevedad",
        {
          ok: true,
          cancel: false,
        }
      );
      navigation.goBack();
    } catch (e) {
      showAlertModal(
        "Atención",
        "Existio un problema al registrar la información. Por favor reintenta más tarde",
        {
          ok: true,
          cancel: false,
        }
      );
      console.log(e);
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={getStyles(mode).container}>
      <Loading loading={loading} title="Procesando..." />
      {/* Top Bar  */}
      <TitleBar title="Centro de Ayuda" subTitle="" goBack={true}></TitleBar>
      {/* Setting Links */}
      <View style={{ paddingHorizontal: 15, marginTop: 20 }}>
        <TextInput
          placeholder="contanos en que te podemos ayudar..."
          multiline={true}
          numberOfLines={5}
          onChangeText={setComment}
          style={getStyles(mode).helpTextArea}
          placeholderTextColor={colors.gray30}
        />

        <View style={[tStyles.endy, { marginTop: 30 }]}>
          <TouchableOpacity
            onPress={() => checkInfoAndSave()}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
              backgroundColor: colors.primary,
            }}
          >
            <Text style={[fonts.medium, { fontSize: 13 }]}>
              Enviar comentario
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  agreeBtn: {
    width: "100%",
    backgroundColor: colors.primary,
    ...tStyles.centery,
    paddingVertical: 12,
    borderRadius: 30,
  },
  cancelBtn: {
    width: "100%",
    backgroundColor: colors.cancel,
    ...tStyles.centery,
    paddingVertical: 12,
    borderRadius: 30,
  },
  contenedor: {
    flexDirection: "row", // 📌 Esto alinea horizontalmente
    alignItems: "center", // 📌 Centra verticalmente
  },
  imagen: {
    width: 50,
    height: 50,
    marginRight: 10, // 📌 Espacio entre imagen y texto
    borderRadius: 25, // Para hacerlo redondo si es un avatar
  },
  texto: {
    fontSize: 16,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 0,
    borderBottomColor: "#ccc",
  },
  label: {
    fontSize: 16,
  },
});

export default Profile_Helpdesk;
