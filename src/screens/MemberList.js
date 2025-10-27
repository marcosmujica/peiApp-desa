import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  Image,
  FlatList,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fontisto, Entypo, AntDesign, Feather } from "@expo/vector-icons";
import { tStyles, colors } from "../common/theme";
import { displayTime, ellipString } from "../common/helpers";
import { useNavigation } from "@react-navigation/native";
import { getStyles } from "../styles/home";
import {
  db_getGroupInfo,
  db_getUserViewInfo,
} from "../commonApp/database";
import ImgAvatar from "../components/ImgAvatar";
import "../commonApp/global";
import { _maxContactPerGroup, _profile } from "../commonApp/global";
import AppContext from "../context/appContext";
import { USER_PREFIX_PHONE } from "../commonApp/constants";
import { CONTACT, GROUP_TICKETS } from "../commonApp/dataTypes";
import { getProfile } from "../commonApp/profile";
import SearchBar from "../components/SearchBar";
import TitleBar from "../components/TitleBar";
import {checkContactsPermission, getAllContacts, getContactName} from "../commonApp/contacts"
import Loading from "../components/Loading";

const MemberList = ({ navigation, route }) => {

  
  const [usersList, setUsersList] = React.useState([])
  const [loading, setLoading] = React.useState("");
  const [isSearch, setIsSearch] = useState (false)

  let profile = getProfile();

  useEffect(() => {
    
     (async () => {
    try {
      if (! await checkContactsPermission())
      {
        showAlertModal ("Atención", "Por favor, a continuación habilita el acceso a los contactos", {ok:true, cancel:false})
      }
      let aux = getAllContacts()
      setContacts (aux);
      setGroupData(aux);
      setIsSearch (true)

      if (usersList.length >0)
      {
        for (let i=0;i<usersList.length;i++)
        {
          selectedContacts.push ({phone:usersList[i], name:getContactName(usersList[i])})
        }
      }
    } catch (err) {
      console.error("Error obteniendo contactos:", err);
    }
  })();

    return () => {
      console.log("🧹 Componente desmontado");
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); //

  const mode = useColorScheme();
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupData, setGroupData] = React.useState([]);
  const [groupName, setGroupName] = React.useState("");
  const { showAlertModal } = React.useContext(AppContext);
  const [contacts, setContacts] = React.useState ([])

  let lastSearchText = ""; // mm - ultimo texto que se esta buscando
  const colorScheme = useColorScheme();

  // mm - si es una actualizacion cargo la info del grupo pasado por parametro
  const getGroupInfo = async () => {

    setLoading (true)
    let groupList = await db_getGroupInfo(idTicketGroup);

    setGroupName (groupList.name)

    
    for (i=0;i<groupList.groupUsers.length;i++)
    { let element = groupList.groupUsers[i]
      if (element != groupList.idUserOwner) // mm - evito si es el usuario que lo creo
      {
        let aux = await db_getUserViewInfo(element);
        let contact = new CONTACT();
        contact.id = aux.id;
        contact.name = aux.name;
        contact.img = aux.avatar;
        contact.userType = aux.userType;
        
        setSelectedContacts((prevItems) => [...prevItems, contact])
      }
      setLoading (false)
    }
  };

  function checkSave()
  {
    navigation.navigate("NewTicket", { idTicketGroup: "", usersList: selectedContacts.map ((item) => item.phone)}) 
  }

  const confirmModal = async (option) => {
    if (option == "OK")
    { saveGroup () } else {saveUsers()}
  }

  const saveUsers = async () => {
    
  }

  const saveGroup = async () => {
    setLoading(true);
    //mm - agrego al usuario logueado para que despues al buscar en el array lo encuentre
    let groupUsersList = [];
    groupUsersList.push(profile.idUser);

    // mm - busco los usuarios por su numero de telefono
    // lo hago con for porque foreach no me respetaba el foreach
    for (let i = 0; i < selectedContacts.length; i++) {
      groupUsersList.push(selectedContacts[i].phone);
    }
    setLoading(false);
    navigation.navigate("UserGroupInfo", { idTicketGroup: idTicketGroup, isAddGroup: isAddGroup,  isUpdateGroup: isUpdateGroup,
      groupUsers: groupUsersList, groupName: groupName });
  };

  const addContactToList = (contact) => {
    if (selectedContacts.length==0)
    { setGroupName (contact.name)}

    // mm - solo agrego la cantidad maxima de contactos
    if (selectedContacts.length < _maxContactPerGroup) {
      /// mm - si aun no esta en la lista para no agregarlo duplicado que da error
      selectedContacts.findIndex((item) => item.phone == contact.phone) == -1
        ? setSelectedContacts((prevItems) => [...prevItems, contact])
        : false;
    }
  };

  const removeContactFromList = (contact) => {
    /// mm - si aun no esta en la lista para no agregarlo duplicado que da error
    setSelectedContacts((prevItems) =>
      prevItems.filter((item) => item.id !== contact.id)
    );
  };

  const searchText = (textToSearch) => {
    setGroupData(
      textToSearch.length == 0
        ? contacts
        : contacts.filter((obj) =>
            obj.name.toLowerCase().search(textToSearch.toLowerCase()) >= 0
              ? true
              : false
          )
    );
  };

  return (
    <SafeAreaView style={getStyles(mode).container}>
      <View>
        {/* Top Bar  */}
            <TitleBar title="Contactos" subtitle="Max. 50 contactos" goBack={true} options={[{name: "search", onClick: ()=>setIsSearch(!isSearch)}]}/>

            {isSearch && <View style={{ paddingHorizontal: 20 }}>
              <SearchBar textToSearch={searchText} />
            </View>}

            {/* Selected Contacts */}

                <View style={[getStyles(mode).topBarHolder, { borderBottomWidth: 0, minHeight: 80 }]}>
                  <FlatList
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                data={selectedContacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <SelectedItem
                item={item}
                removeContactFromList={removeContactFromList}
                  />
                )}
                contentContainerStyle={{ paddingHorizontal: 15, alignItems: 'center', flexGrow: 1 }}
                  />
                  <TouchableOpacity
                onPress={() => checkSave()}
                style={[getStyles(mode).floatingBtn, { position: 'absolute', right: 15, alignSelf: 'center' }]}
                  >
                <Fontisto name="arrow-right" size={20} />
                  </TouchableOpacity>
                </View>
                {/* Contacts Listing */}
        <View style={{ paddingHorizontal: 15, paddingTop: 15 }}>
          
          <FlatList
            showsVerticalScrollIndicator={false}
            data={groupData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ContactItem item={item} addContactToList={addContactToList} />
            )}
            contentContainerStyle={{ paddingBottom: 60 }}
          />
          {/*{groupData.length == 0 && (
            <Text style={getStyles(mode).chatUsername}>
              No se encontraron resultados.
            </Text>
          )}*/}
        </View>
      </View>
      <Loading loading={loading} title="" />
      {/* COntinue Button */}
    </SafeAreaView>
  );
};

const ContactItem = ({ addContactToList, item }) => {
  const mode = useColorScheme();

  return (
    <TouchableOpacity
      onPress={() => addContactToList(item)}
      style={getStyles(mode).chatContainer}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ImgAvatar id={item.id} nombre={item.name} size={40} />
        <View style={{ flex: 1, marginLeft: 10, justifyContent: "center" }}>
          <Text style={getStyles(mode).normalText}>
            {ellipString(item.name, 30)}
          </Text>
          <Text style={getStyles(mode).subNormalText}>
            {ellipString(item.phone, 30)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SelectedItem = ({ removeContactFromList, item }) => {
  const mode = useColorScheme();

  return (
    <TouchableOpacity
      onPress={() => removeContactFromList(item)}
      style={getStyles(mode).selectedContact}
    >
      <View style={[getStyles(mode).linkIconHolder, { marginRight: 15 }]}>
        <ImgAvatar id={item.id} nombre={item.name} detail={false}/>
        <View style={getStyles(mode).avatarHolder}>
          <Fontisto name="close" size={16} color={colors.gray30} />
        </View>
      </View>

      <Text style={getStyles(mode).chatUsernameSmall}>
        {ellipString(item.name, 8)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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

export default MemberList;
