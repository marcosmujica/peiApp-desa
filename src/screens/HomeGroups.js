import React, { useState, useEffect } from "react";
import { onEvent, offEvent, EVENT_DB_CHANGE } from "../commonApp/DBEvents";
import { View, Text, TextInput, Image, RefreshControl, FlatList, TouchableOpacity, useColorScheme } from "react-native";
import { Fontisto, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, tStyles } from "../common/theme";
import { getStyles } from "../styles/home";
import { useNavigation } from "@react-navigation/native";
import SlideOptions from "../components/SlideOptions";
import AppContext from "../context/appContext";
import SearchBar from "../components/SearchBar";
import {formatDateToText} from "../commonApp/functions"
import {
  db_getAllTicketInfoView,
  db_initListener,
  db_openDB,
  db_getTicketViewByTicketId,
  db_getAllTicketItem,
  db_updateTicketListItem,
  db_addTicketListItem,
  db_TICKET,
  db_getAllTickets,
  db_TICKET_LOG_STATUS,
  db_TICKET_CHAT,
} from "../commonApp/database";
import ImgAvatar from "../components/ImgAvatar";
import { getProfile, isMe } from "../commonApp/profile";
import { TICKET_LIST_ITEM } from "../commonApp/dataTypes";
import { displayTime, ellipString } from "../common/helpers";
import { TICKET_DETAIL_CHANGE_DUE_DATE_STATUS, TICKET_DETAIL_CLOSED_STATUS, TICKET_DETAIL_STATUS, TICKET_TYPE_COLLECT, TICKET_TYPE_PAY } from "../commonApp/constants";
import localData, { EVENT_LOCAL_LISTVIEW_UPDATED } from "../commonApp/localData";
import GroupInfo from "./GroupInfo";

const HomeGroups = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const { options, setOptions } = React.useContext(AppContext);
  const [refreshing, setRefreshing] = useState(false);

  const [dataListSearch, setDataListSearch] = React.useState([]); // mm - datos a ser visualizados
  const [dataTicket, setDataTicket] = React.useState([]); // mm - datos filtrados por los filtros

  let profile = getProfile();

  const links = [
    { id: 1, title: "Nuevo Grupo", onPress: () => navigation.navigate("GroupList", { isAddGroup: true }) },
    { id: 2, title: "Nuevo Ticket", onPress: () => navigation.navigate("MemberList") },
    { id: 4, title: "Ajustes", onPress: () => navigation.navigate("UserProfile") },
  ];

  useEffect(() => {
    const off = localData.onEvent(EVENT_LOCAL_LISTVIEW_UPDATED, (doc) => {
      loadData()
    });
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  function searchText(textToSearch) {
    setDataListSearch(!textToSearch ? dataTicket : dataTicket.filter((obj) => obj.name && obj.name.toLowerCase().includes(textToSearch.toLowerCase())));
  }

  async function getGroupByList(item) {
    navigation.navigate("GroupInfo", {idGroup: item.id})
    return
  }

  async function loadData() {
    try {
      setRefreshing(true);
      // mm - inicializo los datos desde la base de datos
      let aux = await localData.getGroupList();
      setDataTicket([...aux]);
      setDataListSearch([...aux]);

    
    } catch (e) {
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
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => <GroupItem item={item} onClick={getGroupByList} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        />
      </View>

      {/* SlideOptions debe estar fuera del contenedor con padding para posicionamiento absoluto */}
      {options && <SlideOptions links={links} setOptions={setOptions} />}

      <TouchableOpacity onPress={() => navigation.navigate("GroupList")} style={getStyles(colorScheme).floatingBtn}>
        <MaterialCommunityIcons name="account-group" size={20} />
      </TouchableOpacity>
      {/* Add a button to open SlideOptions */}
    </View>
  );
};

const GroupItem = ({ item, onClick }) => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  return (
    <TouchableOpacity onPress={() => onClick(item)} style={getStyles(colorScheme).chatContainer}>
        <ImgAvatar id={item.id} size={50} detail={false}/>
      <View style={{ flex: 1, marginLeft: 13, flexDirection: "column", justifyContent: "center" }}>
        {/* Primera línea: title (izquierda) - fecha y badge (derecha) */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Text style={[getStyles(colorScheme).listMainText, { fontWeight: "500" }]} numberOfLines={1}>
            {ellipString(item.name, 35)}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[getStyles(colorScheme).listSecondText]}>
              {formatDateToText(item.latestTicketDate)}
            </Text>
            
          </View>
        </View>
        {/* Segunda línea: información de contactos y total de tickets */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          {item.groupUsers != undefined && 
            <Text style={[getStyles(colorScheme).listSecondText, { fontWeight: "500" }]} numberOfLines={1}>
            {item.groupUsers.length} Contactos
          </Text>}
          {/* Badge para tickets no vistos */}
            {item.unseenCount > 0 && (
              <View style={getStyles(colorScheme).activeBadge}>
                <Text style={getStyles(colorScheme).badgeText}>
                  {item.unseenCount}
                </Text>
              </View>
            )}
          
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default HomeGroups;
