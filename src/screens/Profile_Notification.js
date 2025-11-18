import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  useColorScheme,
  KeyboardAvoidingView,
  Switch,
  TextInput,
  StyleSheet
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import { colors, tStyles } from "../common/theme";
import { getStyles } from "../styles/home";
import Hr from "../components/Hr";
import { SafeAreaView } from "react-native-safe-area-context";
import Modal from "../components/Modal";
import LineTextInput from "../components/LineTextInput";
import TitleBar from "../components/TitleBar";
import AppContext from "../context/appContext";
import Loading from "../components/Loading";
import { isLogged, getProfile, setProfile } from "../commonApp/profile";
import { USER } from "../commonApp/dataTypes";
import { USER_PREFIX_USER } from "../commonApp/constants";
import { db_getUserConfig, db_updateUserConfig } from "../commonApp/database";
import { validateEmail } from "../commonApp/functions";

const Profile_Notification = ({ navigation, route }) => {
  const [isTicketChange, setisTicketChange] = useState(false);
  const [isTicketDueDate, setisTicketDueDate] = useState(false);
  const [isTicketNew, setisTicketNew] = useState(false);

  const [loading, setLoading] = React.useState("");

  const toggleTicketChange = () =>
    setisTicketChange((previousState) => !previousState);
  const toggleTicketDueDate = () =>
    setisTicketDueDate((previousState) => !previousState);
  const toggleTicketNew = () =>
    setisTicketNew((previousState) => !previousState);

  const mode = useColorScheme();

  useEffect(() => {
    loadData();
    return () => {
      console.log("🧹 Componente desmontado");
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); //

  let profile = getProfile(); // mm - obtengo los datos del profile
  // Aquí podés hacer cosas que se ejecutan una vez al cargar el componente

  async function loadData()
  {
    //setLoading(true)
    let aux = getProfile()
    setisTicketNew (aux.config.notifications.ticket_new)
    setisTicketChange (aux.config.notifications.ticket_status_changes)
    setisTicketDueDate (aux.config.notifications.ticket_duedate)
    setLoading(false)

  }
  async function checkInfoAndSave() {

    profile.config.notifications.ticket_status_changes = isTicketChange
    profile.config.notifications.ticket_duedate = isTicketDueDate
    profile.config.notifications.ticket_new = isTicketNew

    setProfile (profile)
    
    navigation.goBack()
  }

  return (
    <SafeAreaView style={getStyles(mode).container}>
      <Loading loading={loading} title="Buscando..." />
      <View>
        {/* Top Bar  */}
        <TitleBar
          title="Notificaciones"
          subTitle=""
          goBack={true}
          onGoBack={checkInfoAndSave}
        ></TitleBar>
        <View style={getStyles(mode).container}>
          <View style={styles.row}>
            <Text style={[getStyles(mode).switchText]}>
              Cambios de estado
            </Text>
            <Switch
              value={isTicketChange}
              onValueChange={toggleTicketChange}
              trackColor={{ false: "#767577", true: "#b3b3b3ff" }}
                thumbColor={isSendMsgToGroup ? "#aafdc2ff" : "#f4f3f4"}
            />
          </View>
          <View style={styles.row}>
            <Text style={getStyles(mode).switchText}>
              Tickets vencidos
            </Text>
            <Switch
              value={isTicketDueDate}
              onValueChange={toggleTicketDueDate}
              trackColor={{ false: "#767577", true: "#b3b3b3ff" }}
                thumbColor={isSendMsgToGroup ? "#aafdc2ff" : "#f4f3f4"}
            />
          </View>
          <View style={styles.row}>
            <Text style={getStyles(mode).switchText}>
              Nuevos tickets
            </Text>
            <Switch
              value={isTicketNew}
              onValueChange={toggleTicketNew}
              trackColor={{ false: "#767577", true: "#b3b3b3ff" }}
                thumbColor={isSendMsgToGroup ? "#aafdc2ff" : "#f4f3f4"}
            />
          </View>
        </View>
      </View>
      {/* COntinue Button */}
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
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 0,
    borderBottomColor: "#ccc",
  },
  label: {
    fontSize: 16,
  },
});

export default Profile_Notification;
