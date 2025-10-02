import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fontisto, Entypo, AntDesign, Feather } from "@expo/vector-icons";
import { fonts, tStyles, colors } from "../common/theme";
import Hr from "../components/Hr";
import { displayTime, ellipString } from "../common/helpers";
import { useNavigation } from "@react-navigation/native";
import { getStyles } from "../styles/home";
import {
  _contacts,
  db_updateGroupUsers,
  db_addGroupUsers,
  db_getUserIdByPhone,
} from "../commonApp/database";
import ImgAvatar from "../components/ImgAvatar";
import "../commonApp/global";
import { _maxContactPerGroup, _profile } from "../commonApp/global";
import AppContext from "../context/appContext";
import {
  USER_PREFIX_GROUP,
  USER_PREFIX_PHONE,
  USER_PREFIX_USER,
} from "../commonApp/constants";
import { GROUP_TICKETS } from "../commonApp/dataTypes";
import { getProfile } from "../commonApp/profile";
import TitleBar from "../components/TitleBar";
import Loading from "../components/Loading";
import { v4 as uuidv4 } from "uuid";

const UserGroupInfo = ({ navigation, route }) => {
  const [usersListGroup, setUserListGroup] = React.useState(
    route.params["groupUsers"]
  );

  const [groupName, setGroupName] = React.useState(route.params["groupName"]);
  const [isAddGroup] = React.useState(route.params["isAddGroup"]);
  const [isUpdateGroup] = React.useState(route.params["isUpdateGroup"]);
  const [idTicketGroup] = React.useState(route.params["idTicketGroup"]);
  const [isSendMsgToGroup, setisSendMsgToGroup] = useState(false);
  const [isViewTicketList, setisViewTicketList] = useState(false);
  const [isUserAddTicket, setisUserAddTicket] = useState(false);
  const [isViewMember, setisViewMember] = useState(false);

  const [loading, setLoading] = React.useState("");

  const toggleSendMsgToGroup = () =>
    setisSendMsgToGroup((previousState) => !previousState);
  const toggleViewTicketList = () =>
    setisViewTicketList((previousState) => !previousState);
  const toggleUserAddTicket = () =>
    setisUserAddTicket((previousState) => !previousState);
  const toggleViewMember = () =>
    setisViewMember((previousState) => !previousState);

  useEffect(() => {
    return () => {
      console.log("🧹 Componente desmontado");
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); //

  const mode = useColorScheme();
  const [selectedContacts, setSelectedContacts] = useState([]);
  const { showAlertModal } = React.useContext(AppContext);

  let lastSearchText = ""; // mm - ultimo texto que se esta buscando
  const colorScheme = useColorScheme();

  const checkInfoAndSave = async () => {
    if (groupName == "") {
      showAlertModal("Atención", "Por favor ingresa el nombre del grupo");
      return;
    }

    setLoading(true);
    // mm - creo el grupo

    let ticketGroup = new GROUP_TICKETS();

    let profile = getProfile();

    // mm- seteo los usuarios
    ticketGroup.name = groupName;
    ticketGroup.idUserCreatedBy = profile.idUser;
    ticketGroup.idUserOwner = profile.idUser;
    ticketGroup.isSendMsgToGroup = isSendMsgToGroup;
    ticketGroup.isUserAddTicket = isUserAddTicket;
    ticketGroup.isViewMember = isViewMember;
    ticketGroup.isViewTicketList = isViewTicketList;
    ticketGroup.groupUsers = usersListGroup;

    let result;
    if (isAddGroup) {
      console.log("entro");
      result = await db_addGroupUsers(
        USER_PREFIX_GROUP + uuidv4(),
        ticketGroup
      );
      result
        ? navigation.navigate("NewTicket", { idTicketGroup: result})
        : showAlertModal(
            "Error",
            "Error al crear el grupo, por favor verifica"
          );
    }

    if (isUpdateGroup) {
      let result = await db_updateGroupUsers(idTicketGroup, ticketGroup);
      result
        ? navigation.navigate("MainScreen")
        : showAlertModal(
            "Error",
            "Error al actualizar el grupo, por favor verifica"
          );
    }

    setLoading(false);
  };

  const mostrarAlerta = (title, msg) => {
    showAlertModal(title, msg);
  };

  const addContactToList = (contact) => {
    // mm - si no hay contactos seleccionados y no se agreo un nombre al grupo
    if (selectedContacts.length == 0 && groupName.length == 0) {
      setGroupName(contact.name);
    }

    // mm - solo agrego la cantidad maxima de contactos
    if (selectedContacts.length < _maxContactPerGroup) {
      /// mm - si aun no esta en la lista para no agregarlo duplicado que da error
      selectedContacts.findIndex((item) => item.id == contact.id) == -1
        ? setSelectedContacts((prevItems) => [...prevItems, contact])
        : false;
    }
  };

  const removeContactFromList = (contact) => {
    /// mm - si aun no esta en la lista para no agregarlo duplicado que da error
    setSelectedContacts((prevItems) =>
      prevItems.filter((item) => item.id !== contact.id)
    );
    selectedContacts.length == 1 ? setGroupName("") : false; // mm - si saco el ultimo contacto seleccionado borro el nombre del grupo
  };

  return (
    <SafeAreaView style={getStyles(mode).container}>
      <Loading loading={loading} title="Procesando..." />
      <TitleBar title="Información" subtitle="" goBack={true} />
      <View>
        <View style={{ padding: 20 }}>
          <Text style={getStyles(colorScheme).sectionTitle}>Nombre</Text>
          <View style={getStyles(mode).searchBar}>
            <TextInput
              placeholder="nombre del grupo..."
              placeholderTextColor={colors.secondary}
              style={getStyles(mode).searchBarInput}
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>

          <View style={{ paddingTop: 20 }}>
            <Text style={getStyles(colorScheme).sectionTitle}>Permisos</Text>
          </View>
          <View style={styles.row}>
            <Text style={getStyles(colorScheme).switchText}>
              Enviar mensajes al grupo
            </Text>
            <Switch
              value={isSendMsgToGroup}
              onValueChange={toggleSendMsgToGroup}
              trackColor={{ false: "#767577", true: "#b3b3b3ff" }}
              thumbColor={isSendMsgToGroup ? "#aafdc2ff" : "#f4f3f4"}
            />
          </View>
          <View style={styles.row}>
            <Text style={getStyles(colorScheme).switchText}>Crear tickets</Text>
            <Switch
              value={isUserAddTicket}
              onValueChange={toggleUserAddTicket}
              trackColor={{ false: "#767577", true: "#b3b3b3ff" }}
              thumbColor={isSendMsgToGroup ? "#aafdc2ff" : "#f4f3f4"}
            />
          </View>
          <View style={styles.row}>
            <Text style={getStyles(colorScheme).switchText}>Ver miembros </Text>
            <Switch
              value={isViewMember}
              onValueChange={toggleViewMember}
              trackColor={{ false: "#767577", true: "#b3b3b3ff" }}
              thumbColor={isSendMsgToGroup ? "#aafdc2ff" : "#f4f3f4"}
            />
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 15, marginBottom: 15 }}>
        <TouchableOpacity
          style={styles.agreeBtn}
          onPress={() => checkInfoAndSave()}
        >
          <Text style={[fonts.medium, { color: colors.white, fontSize: 13 }]}>
            Siguiente
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 16,
  },
});

export default UserGroupInfo;
