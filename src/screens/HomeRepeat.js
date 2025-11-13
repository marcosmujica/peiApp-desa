import React, { useState, useEffect } from "react";
import { onEvent, offEvent, EVENT_DB_CHANGE } from "../commonApp/DBEvents";
import { View, Text, TextInput, Image, RefreshControl, FlatList, TouchableOpacity, useColorScheme } from "react-native";
import { Fontisto, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, tStyles } from "../common/theme";
import { getStyles } from "../styles/home";
import { useNavigation } from "@react-navigation/native";
import SlideOptions from "../components/SlideOptions";
import AppContext from "../context/appContext";
import { displayTime, ellipString } from "../common/helpers";
import SearchBar from "../components/SearchBar";
import BadgeBtn from "../components/BadgeBtn";
import {
  db_getAllTicketRepeat
} from "../commonApp/database";
import ImgAvatar from "../components/ImgAvatar";
import { getProfile, isMe } from "../commonApp/profile";
import { TICKET_LIST_ITEM } from "../commonApp/dataTypes";
import { formatDateToText, formatNumber, deepObjectMerge } from "../commonApp/functions";
import { TICKET_DETAIL_CHANGE_DUE_DATE_STATUS, TICKET_DETAIL_CLOSED_STATUS, TICKET_DETAIL_STATUS, TICKET_TYPE_COLLECT, TICKET_TYPE_PAY } from "../commonApp/constants";
import localData, { EVENT_LOCAL_DATA_CHANGE } from '../commonApp/localData';

const HomeRepeat = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const { options, setOptions } = React.useContext(AppContext);
  const [refreshing, setRefreshing] = useState(false);

  const [dataListSearch, setDataListSearch] = React.useState([]); // mm - datos a ser visualizados
  const [dataList, setDataList] = React.useState([]); // mm - datos filtrados por los filtros

  let profile = getProfile();

  const links = [
    { id: 1, title: "Nuevo Grupo", onPress: () => navigation.navigate("GroupList", { isAddGroup: true }) },
    { id: 2, title: "Nuevo Ticket", onPress: () => navigation.navigate("MemberList") },
    { id: 4, title: "Ajustes", onPress: () => navigation.navigate("UserProfile") },
  ];

  useEffect(() => {
    loadData();
  }, []);

  function searchText(textToSearch) {
    setDataListSearch(!textToSearch ? dataList : dataList.filter((obj) => obj.name && obj.name.toLowerCase().includes(textToSearch.toLowerCase())));
  }

  async function goToUser(idUser) {
    try {
      navigation.navigate ("UserInfo", {idUser:idUser})
            
      //navigation.navigate("UserInfo", { idUser: idUser });
    } catch (e) {
      console.log("error gotouser");
      console.log(e);
    }
  }

  async function loadData() {
    try {

      setRefreshing(true);

      debugger
      let repeatList = await db_getAllTicketRepeat() 
      setDataList ([...repeatList]);
      setDataListSearch ([...repeatList])

    } catch (e) {
      console.log("error en loaddata");
      console.log(e);
    }
    setRefreshing(false);
  }
  return (
    <View style={getStyles(colorScheme).container}>
      <View style={{ paddingHorizontal: 15 }}>
        <FlatList
          ListHeaderComponent={
            <View>
              <SearchBar textToSearch={searchText} />
            </View>
          }
          showsVerticalScrollIndicator={false}
          data={dataListSearch}
          keyExtractor={(item, index) => `${item.contactId}-${index}`}
          renderItem={({ item }) => <RepeatItem item={item} idUser={profile.idUser} onClick={goToUser} />}
          contentContainerStyle={{ paddingBottom: 200 }} // Ajusta el valor según el espacio necesario
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        />
      </View>

      {/* SlideOptions debe estar fuera del contenedor con padding para posicionamiento absoluto */}
      {options && <SlideOptions links={links} setOptions={setOptions} />}

      
      {/* Add a button to open SlideOptions */}
    </View>
  );
};

const RepeatItem = ({ item, onClick }) => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  
  return (
        
          <View style={{ flex: 1, paddingTop:20, marginLeft: 13, flexDirection: "column", justifyContent: "center" }}>
            {/* Primera línea: title (izquierda) - fecha y badge (derecha) */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <Text style={[getStyles(colorScheme).listMainText, { fontWeight: "500" }]} numberOfLines={1}>
                {ellipString(item.name, 35)}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[getStyles(colorScheme).listSecondText]}>
                  {formatDateToText(item.TSLastExecution)}
                </Text>
                
              </View>
            </View>
            {/* Segunda línea: información de contactos y total de tickets */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                {item.groupUsers.length >0 && <Text style={[getStyles(colorScheme).listSecondText, { fontWeight: "500" }]} numberOfLines={1}>  
                 {item.groupUsers.length} Contactos
              </Text>}
              {/* Badge para tickets no vistos */}
                  <View >
                    <Text style={[getStyles(colorScheme).sectionTitle, {padding:5}]}>
                      <Fontisto name="pause" size={10}/>
                    </Text>
                  </View>
              
            </View>
          </View>
  );
};

export default HomeRepeat;
