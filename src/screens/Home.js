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
import { formatDateToText, formatNumber, deepObjectMerge } from "../commonApp/functions";
import { TICKET_DETAIL_CHANGE_DUE_DATE_STATUS, TICKET_DETAIL_CLOSED_STATUS, TICKET_DETAIL_STATUS, TICKET_TYPE_COLLECT, TICKET_TYPE_PAY } from "../commonApp/constants";
import localData, { EVENT_LOCAL_LISTVIEW_UPDATED } from '../commonApp/localData';
import moment from "moment";
import "moment/locale/es";
moment.locale("es");

const Home = ({ navigation }) => {
  const FILTER_TICKETS = "TICKETS";
  const FILTER_GROUPS = "GROUPS";
  const FILTER_WAY = "PAY";

  const TICKET_TYPE_ALL = "all";

  const FILTER_TICKETS_ALL = "all";
  const FILTER_TICKETS_OPEN = "open";
  const FILTER_TICKETS_CLOSE = "close";
  // const dbEvents = new EventEmitter(); // Use the shared instance instead of creating a new one
  const colorScheme = useColorScheme();
  const { options, setOptions } = React.useContext(AppContext);
  const [filter, setFilter] = React.useState(FILTER_TICKETS);
  const [filterTicket, setFilterTicket] = React.useState(FILTER_TICKETS_ALL);
  const [refreshing, setRefreshing] = useState(false);
  const [filterWay, setFilterWay] = useState(FILTER_TICKETS_CLOSE);

  const [dataListSearch, setDataListSearch] = React.useState([]); // mm - datos a ser visualizados
  const [dataTicket, setDataTicket] = React.useState([]); // mm - datos filtrados por los filtros

  let profile = getProfile();

  const links = [
    { id: 1, title: "Nuevo Grupo", onPress: () => navigation.navigate("GroupList", { isAddGroup: true }) },
    { id: 2, title: "Nuevo Ticket", onPress: () => navigation.navigate("MemberList") },
    { id: 4, title: "Ajustes", onPress: () => navigation.navigate("UserProfile") },
  ];

  function filterTicketByWay(filter) {
    try {

      if (filter == TICKET_TYPE_ALL) {
        setDataListSearch(dataTicket);
        return;
      }

      setRefreshing(true);
      setFilterWay(filter);
      let aux = dataTicket.filter((item) => item.way === filter);
      // Ordenar por timestamp descendente
      aux.sort((a, b) => {
        const dateA = new Date(a.ts).getTime();
        const dateB = new Date(b.ts).getTime();
        return dateB - dateA;
      });
      setDataListSearch(aux);
    } catch (e) {
      console.log("error filterticketbyway");
      console.log(e);
    }
    setRefreshing(false);
  }

  function filterTicketByStatus(filter) {

    
    setFilterTicket(filter);
    setRefreshing(true);
    let filteredData;
    
    if (filter == FILTER_TICKETS_ALL) {
      filteredData = dataTicket;
    } else if (filter == FILTER_TICKETS_CLOSE) {
      filteredData = dataTicket.filter((item) => item.isOpen === false);
    } else if (filter == FILTER_TICKETS_OPEN) {
      filteredData = dataTicket.filter((item) => item.isOpen === true);
    }
    
    // Ordenar por timestamp descendente
    if (filteredData) {
      filteredData.sort((a, b) => {
        const dateA = new Date(a.ts).getTime();
        const dateB = new Date(b.ts).getTime();
        return dateB - dateA;
      });
      setDataListSearch(filteredData);
    }
    setRefreshing(false);
  }
  async function processEvent(doc) {
    loadData ()
  }

  // mm - función para actualizar un ticket específico en la lista sin recargar todo
  function updateTicketInList(idTicket, updatedItem) {
    setDataTicket((prevData) => {
      const index = prevData.findIndex((t) => t.idTicket === idTicket);
      let newData;

      if (index !== -1) {
        // Actualizar ticket existente
        newData = [...prevData];
        newData[index] = { ...newData[index], ...updatedItem };
      } else {
        // Agregar nuevo ticket
        newData = [...prevData, updatedItem];
      }

      // Reordenar por timestamp
      newData.sort((a, b) => {
        const dateA = new Date(a.ts).getTime();
        const dateB = new Date(b.ts).getTime();
        return dateB - dateA;
      });

      return newData;
    });

    // Actualizar también la lista de búsqueda
    setDataListSearch((prevData) => {
      const index = prevData.findIndex((t) => t.idTicket === idTicket);
      let newData;

      if (index !== -1) {
        newData = [...prevData];
        newData[index] = { ...newData[index], ...updatedItem };
      } else {
        newData = [...prevData, updatedItem];
      }

      newData.sort((a, b) => {
        const dateA = new Date(a.ts).getTime();
        const dateB = new Date(b.ts).getTime();
        return dateB - dateA;
      });

      return newData;
    });
  }

  async function checkDB() {
    db_initListener();
  }

  useEffect(() => {
    // subscribe to new-doc events to reload list

    checkDB();
    loadData();

    const off = localData.onEvent(EVENT_LOCAL_LISTVIEW_UPDATED, (doc) => {
      console.log("VOY A PROCESAR EVENTO");
      processEvent(doc);
    });

    // mm - al hacer el focus recargo los datos
    const onFocus = () => {

    };

    const unsubscribe = navigation.addListener("focus", onFocus);

    return () => {
      // cleanup both listeners
      typeof off === "function" && off();
      unsubscribe();
    };
  }, []);

  function searchText(textToSearch) {
    const filteredTickets = !textToSearch ? dataTicket : dataTicket.filter((obj) => obj.title && obj.title.toLowerCase().includes(textToSearch.toLowerCase()));
    // Ordenar por timestamp descendente
    filteredTickets.sort((a, b) => {
      const dateA = new Date(a.ts).getTime();
      const dateB = new Date(b.ts).getTime();
      return dateB - dateA;
    });
    setDataListSearch(filteredTickets);
  }

  async function goToTicket(idTicket, title, isSeen) {
    try {
      if (!isSeen) {
        localData.setTicketSeen (idTicket, true)
      }
      navigation.navigate("TicketDetail", { idTicket: idTicket, name: title });
    } catch (e) {
      console.log("error gototicket");
      console.log(e);
    }
  }

  async function loadData() {
    try {
      setRefreshing(true);
      // mm - inicializo los datos desde la base de datos
      
      let dataTicketBD = await localData.getTicketList();
                              
      // Ordenar los tickets por timestamp (ts) de forma descendente
      dataTicketBD.sort((a, b) => {
        const dateA = new Date(a.ts).getTime();
        const dateB = new Date(b.ts).getTime();
        return dateB - dateA;
      });
      // mm - crear nuevos arrays para forzar re-render
      const newDataTicket = dataTicketBD ? [...dataTicketBD] : [];
      const newDataListSearch = dataTicketBD ? [...dataTicketBD] : [];
      
      setDataTicket(newDataTicket);
      setDataListSearch(newDataListSearch);
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
              <BadgeBtn
                items={[
                  { id: TICKET_TYPE_ALL, title: "Todos", active: filterWay == TICKET_TYPE_ALL, onClick: () => filterTicketByWay(TICKET_TYPE_ALL) },
                  { id: TICKET_TYPE_PAY, title: "Pagar", active: filterWay == TICKET_TYPE_PAY, onClick: () => filterTicketByWay(TICKET_TYPE_PAY) },
                  { id: TICKET_TYPE_COLLECT, title: "Cobrar", active: filterWay == TICKET_TYPE_COLLECT, onClick: () => filterTicketByWay(TICKET_TYPE_COLLECT) },
                ]}
                idActive={filterWay}
              />
              {filter == FILTER_TICKETS && (
                <BadgeBtn
                  items={[
                    { id: FILTER_TICKETS_ALL, title: "Todos", active: filterTicket == FILTER_TICKETS_ALL, onClick: () => filterTicketByStatus(FILTER_TICKETS_ALL) },
                    { id: FILTER_TICKETS_OPEN, title: "Abiertos", active: filterTicket == FILTER_TICKETS_OPEN, onClick: () => filterTicketByStatus(FILTER_TICKETS_OPEN) },
                    { id: FILTER_TICKETS_CLOSE, title: "Cerrados", active: filterTicket == FILTER_TICKETS_CLOSE, onClick: () => filterTicketByStatus(FILTER_TICKETS_CLOSE) },
                  ]}
                  idActive={filterTicket}
                />
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
          data={dataListSearch}
          keyExtractor={(item, index) => item.idTicket || index.toString()}
          renderItem={({ item }) => {
            return <TicketItem item={item} idProfile={profile.idUser} idUser={profile.idUser} onClick={goToTicket} />;
          }}
          contentContainerStyle={{ paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        />
      </View>

      {/* SlideOptions debe estar fuera del contenedor con padding para posicionamiento absoluto */}
      {options && <SlideOptions links={links} setOptions={setOptions} />}

      <TouchableOpacity onPress={() => navigation.navigate("MemberList", )} style={getStyles(colorScheme).floatingBtn}>
        <MaterialCommunityIcons name="message-plus" size={20} />
      </TouchableOpacity>
      {/* Add a button to open SlideOptions */}
    </View>
  );
};

const TicketItem = ({ item, idUser, onClick, idProfile }) => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  
  return (
    <TouchableOpacity onPress={() => onClick(item.idTicket, item.title, item.seen)} style={getStyles(colorScheme).chatContainer}>
      <TouchableOpacity>
        <ImgAvatar id={item.idUserTo == "" ? idProfile : item.idUserTo} size={45} detail={item.idUserTo == "" ? false : true}/>
      </TouchableOpacity>
      <View style={{ flex: 1, marginLeft: 13, flexDirection: "column", justifyContent: "center" }}>
        {/* Primera línea: title (izquierda) - ts (derecha) */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Text style={[
            getStyles(colorScheme).listMainText, 
            (!item.seen && item.changeSource === 'ticket') ? {color: colors.warning} : null
          ]} numberOfLines={1}>
            {ellipString(item.title, 20)}
          </Text>
          <Text style={[getStyles(colorScheme).listSecondText, (!item.seen && item.changeSource === 'log_status') ? {color: colors.warning} : null]}>
            {item.statusText ? `[${ellipString(item.statusText, 10)}] ` : ""} {formatDateToText(item.dueDate)}
          </Text>
        </View>

        {/* Segunda línea: statusText (izquierda) - seen badge (derecha) */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: 4 }}>
          <Text style={[
            getStyles(colorScheme).listSecondText,
            (!item.seen && item.changeSource === 'chat') ? {color: colors.warning} : null
          ]} numberOfLines={1}>
            {item.changesource}
            {item.lastMsg != "" ? ellipString(item.lastMsg, 50) : " "}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            {item.way == TICKET_TYPE_PAY && (
              <>
                <Text style={[getStyles(colorScheme).listSecondText, { color: colors.cancel }]}>
                  - {item.currency} {formatNumber(item.amount)}
                {!item.isOpen && <Fontisto name="locked" size={15} />}
                </Text>
              </>
            )}
            {item.way == TICKET_TYPE_COLLECT && (
              <>
                <Text style={[getStyles(colorScheme).listSecondText]}>
                  {item.currency} {formatNumber(item.amount)}
                {!item.isOpen && <Fontisto name="locked" size={15} />}
                </Text>
              </>
            )}
            {!item.seen && (
              <View style={getStyles(colorScheme).activeBadge}>
                <Text style={[getStyles(colorScheme).badgeText]}></Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};



export default Home;
