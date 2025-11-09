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
  const [filterWay, setFilterWay] = useState(TICKET_TYPE_ALL);

  const [dataListSearch, setDataListSearch] = React.useState([]); // mm - datos a ser visualizados
  const [dataTicket, setDataTicket] = React.useState([]); // mm - datos filtrados por los filtros
  const [dataWithDateSeparators, setDataWithDateSeparators] = React.useState([]); // mm - datos con separadores de fecha

  let profile = getProfile();

  // Función para agregar separadores de fecha a la lista
  const prepareDataWithDateSeparators = (tickets) => {
    if (!tickets || tickets.length === 0) return [];

    const result = [];
    let currentDate = null;

    tickets.forEach((ticket, index) => {
      const ticketDate = moment(ticket.ts).format('YYYY-MM-DD');
      
      // Si es un nuevo día, agregar separador de fecha
      if (currentDate !== ticketDate) {
        result.push({
          type: 'date-separator',
          date: ticketDate,
          id: `date-${ticketDate}`,
          displayDate: formatDateLabel(ticketDate)
        });
        currentDate = ticketDate;
      }
      
      // Agregar el ticket
      result.push({
        type: 'ticket',
        ...ticket,
        id: ticket.idTicket || `ticket-${index}`
      });
    });

    return result;
  };

  // Función para formatear el label de fecha
  const formatDateLabel = (dateString) => {
    const date = moment(dateString, 'YYYY-MM-DD');
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');

    if (date.isSame(today, 'day')) {
      return 'Hoy';
    } else if (date.isSame(yesterday, 'day')) {
      return 'Ayer';
    } else {
      return date.format('dddd, D [de] MMMM');
    }
  };

  const links = [
    { id: 1, title: "Nuevo Grupo", onPress: () => navigation.navigate("GroupList", { isAddGroup: true }) },
    { id: 2, title: "Nuevo Ticket", onPress: () => navigation.navigate("MemberList") },
    { id: 4, title: "Ajustes", onPress: () => navigation.navigate("UserProfile") },
  ];

  function filterTicketByWay(filter) {
    try {

      if (filter == TICKET_TYPE_ALL) {
        setDataListSearch(dataTicket);
        setDataWithDateSeparators(prepareDataWithDateSeparators(dataTicket));
        return;
      }

      setRefreshing(true);
      setFilterWay(filter);
      let aux = dataTicket.filter((item) => item.way === filter);
      setDataListSearch(aux);
      setDataWithDateSeparators(prepareDataWithDateSeparators(aux));
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
      setDataListSearch(dataTicket);
    }
    if (filter == FILTER_TICKETS_CLOSE) {
      filteredData = dataTicket.filter((item) => item.isOpen === false);
      setDataListSearch(filteredData);
    }
    if (filter == FILTER_TICKETS_OPEN) {
      filteredData = dataTicket.filter((item) => item.isOpen === true);
      setDataListSearch(filteredData);
    }

    setDataWithDateSeparators(prepareDataWithDateSeparators(filteredData));
    setRefreshing(false);
  }
  async function processEvent(doc) {
    loadData ()
    return
    console.log("🔔 EVENT RECEIVED:", doc.table, doc._id);
    //return
    try {
      if (doc.table == db_TICKET_CHAT) {
        let item = await db_getTicketViewByTicketId(doc.data.idTicket);

        if (item.length == 0) return;

        item.lastMsg = doc.data.message;

        if (doc.data.mediaType == "image") item.lastMsg = ">> Foto";
        if (doc.data.mediaType == "file") item.lastMsg = ">> Archivo";

        let aux2 = TICKET_DETAIL_STATUS.find((aux) => aux.code == doc.data.idStatus);

        item.ts = new Date();
        // mm - si lo envie yo no lo marco
        if (doc.data.idUserFrom != profile.idUser) {
          item.seen = false;
        }

        // mm - NO actualizar la BD aquí, solo actualizar el estado UI
        await db_updateTicketListItem (item.idTicket, item)

        // mm - actualizar solo el item específico en el estado
        updateTicketInList(item.idTicket, item);
      }
      if (doc.table == db_TICKET_LOG_STATUS) {
        let item = await db_getTicketViewByTicketId(doc.data.idTicket);

        if (!item) return;

        item.status = doc.data.idStatus;
        let aux2 = TICKET_DETAIL_STATUS.find((aux) => aux.code == doc.data.idStatus);
        item.statusText = aux2.name;

        // mm - le cambio la fecha de vencimiento
        if (doc.data.idStatus == TICKET_DETAIL_CHANGE_DUE_DATE_STATUS) {
          item.dueDate = doc.data.data.dueDate;
        }

        if (doc.data.idStatus == TICKET_DETAIL_CLOSED_STATUS) {
          item.isOpen = false
        }

        // mm - si lo envie yo no lo marco
        item.ts = new Date();

        if (doc.data.idUserFrom != profile.idUser) {
          item.seen = false;
        }

        // mm - NO actualizar la BD aquí, solo actualizar el estado UI
        await db_updateTicketListItem (item.idTicket, item)

        // mm - actualizar solo el item específico en el estado
        updateTicketInList(item.idTicket, item);
      }
      if (doc.table == db_TICKET) {
        let item = new TICKET_LIST_ITEM();
        let data = doc.data;
        item.idTicket = doc._id;
        item.idGroup = item.idTicketGroup
        item.idGroupBy = item.idTicketGroupBy
        item.idUserTo = data.idUserCreatedBy == profile.idUser ? data.idUserTo : data.idUserFrom;
        item.idUserCreatedBy = data.idUserCreatedBy
        item.currency = doc.data.currency;
        item.title = data.title;
        item.isOpen = data.isOpen;
        item.amount = data.amount;
        item.way = data.way; // mm - por default el way es el del ticket

        // mm - determino que tipo de ticket es
        if (!isMe(data.idUserCreatedBy) && data.way == TICKET_TYPE_PAY) {
          item.way = TICKET_TYPE_COLLECT;
        }
        if (!isMe(data.idUserCreatedBy) && data.way == TICKET_TYPE_COLLECT) {
          item.way = TICKET_TYPE_PAY;
        }

        item.ts = new Date();
        item.dueDate = data.TSDueDate;

        // mm - determino si existe antes por si hubo un error previamente
        let aux = await db_getTicketViewByTicketId(doc._id);

        if (!aux) {
          // mm- agrego si no estaba previamente en ticket_view
          await db_addTicketListItem(item.idTicket, item);
        }

        // mm - actualizar solo el item específico en el estado
        updateTicketInList(item.idTicket, item);
      }
    } catch (e) {
      console.log(e);
      console.log("❌ error processEvent");
    }
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

      // Actualizar también los datos con separadores de fecha
      setDataWithDateSeparators(prepareDataWithDateSeparators(newData));

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
      //checkDB();
      //loadData(); // mm - recargar datos cuando la pantalla recibe focus
      // mm - comentado porque causa bucle infinito
      // La lógica de limpiar el stack de navegación puede causar problemas
      // Si realmente necesitas limpiar el stack, considera hacerlo desde 
      // donde navegas hacia Home, no en el evento focus
      /*
      try {
        const state = navigation.getState();
        
        if (!state || !state.routes || !Array.isArray(state.routes) || state.routes.length === 0) {
          return;
        }
        
        const currentRoute = state.routes[state.index];
        
        if (!currentRoute || state.routes.length === 1) {
          return;
        }
        
        navigation.reset({
          index: 0,
          routes: [{ name: currentRoute.name, params: currentRoute.params }],
        });
      } catch (e) {
        console.warn("Error pruning navigation state on focus", e);
      }
      */
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
    setDataListSearch(filteredTickets);
    setDataWithDateSeparators(prepareDataWithDateSeparators(filteredTickets));
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
      setDataWithDateSeparators(prepareDataWithDateSeparators(newDataListSearch));

      console.log("✅ loadData completado - tickets cargados:", newDataTicket.length);
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
          data={dataWithDateSeparators}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item }) => {
            if (item.type === 'date-separator') {
              return <DateSeparator date={item.displayDate} />;
            } else {
              return <TicketItem item={item} idUser={profile.idUser} onClick={goToTicket} />;
            }
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

const TicketItem = ({ item, idUser, onClick }) => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  
  return (
    <TouchableOpacity onPress={() => onClick(item.idTicket, item.title, item.seen)} style={getStyles(colorScheme).chatContainer}>
      <TouchableOpacity>
        <ImgAvatar id={item.idUserTo} size={45} />
      </TouchableOpacity>
      <View style={{ flex: 1, marginLeft: 13, flexDirection: "column", justifyContent: "center" }}>
        {/* Primera línea: title (izquierda) - ts (derecha) */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Text style={[
            getStyles(colorScheme).listMainText, 
            (!item.seen && item.changeSource === 'ticket') ? {color: colors.lightPrimary} : null
          ]} numberOfLines={1}>
            {ellipString(item.title, 20)}
          </Text>
          <Text style={[getStyles(colorScheme).listSecondText, (!item.seen && item.changeSource === 'log_status') ? {color: colors.lightPrimary} : null]}>
            {item.statusText ? `[${ellipString(item.statusText, 10)}] ` : ""} {formatDateToText(item.dueDate)}
          </Text>
        </View>

        {/* Segunda línea: statusText (izquierda) - seen badge (derecha) */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: 4 }}>
          <Text style={[
            getStyles(colorScheme).listSecondText,
            (!item.seen && item.changeSource === 'chat') ? {color: colors.lightPrimary} : null
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

// Componente para mostrar separadores de fecha
const DateSeparator = ({ date }) => {
  const mode = useColorScheme();
  
  return (
    <View>
              <Text style={getStyles(mode).titleBadge}>
          {date}
        </Text>
    </View>
  );
};

export default Home;
