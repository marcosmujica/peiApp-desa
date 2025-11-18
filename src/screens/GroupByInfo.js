import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, RefreshControl, useColorScheme, Image, useWindowDimensions, Platform, FlatList } from "react-native";
import { AntDesign, Entypo, Feather, Fontisto, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import Animated, { RotateInUpLeft, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { colors, tStyles } from "../common/theme";
import { getStyles } from "../styles/home";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedTopBar from "../components/AnimatedTopBar";
import ImgAvatar from "../components/ImgAvatar";
import { getContactName } from "../commonApp/contacts";
import { URL_FILE_DOWNLOAD, URL_FILE_AVATAR_PREFIX, URL_FILE_SMALL_PREFIX, TICKET_TYPE_PAY, TICKET_TYPE_COLLECT, TICKET_INFO_TYPE_PAY_IMPULSIVED } from "../commonApp/constants";
import { db_getGroupByInfo, db_getTicketsIdGroupBy, db_getGroupInfo } from "../commonApp/database";
import { formatDateToText, formatNumber } from "../commonApp/functions";
import { getProfile } from "../commonApp/profile";
import { ellipString } from "../common/helpers";
import { GROUP_BY_TICKETS } from "../commonApp/dataTypes";
import SearchBar from "../components/SearchBar";
import { getFileAndUpload } from "../commonApp/attachFile";
import { showAttachmentPicker } from "../components/AttachmentPicker";
import AttachmentPickerHost from "../components/AttachmentPicker";
import Loading from "../components/Loading";
import AppContext from "../context/appContext";
import localData, { EVENT_LOCAL_LISTVIEW_UPDATED } from "../commonApp/localData";
import BadgeBtn from "../components/BadgeBtn";

// Función para agrupar tickets por fecha
const groupTicketsByDate = (tickets) => {
  const groups = {};

  tickets.forEach((ticket) => {
    const date = new Date(ticket.dueDate);
    const dateKey = date.toDateString(); // "Mon Nov 05 2025"

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        dateFormatted: formatDateGroup(date),
        tickets: [],
      };
    }

    groups[dateKey].tickets.push(ticket);
  });

  // Convertir objeto a array y ordenar por fecha (más reciente primero)
  return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Función para formatear la fecha del grupo
const formatDateGroup = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const inputDate = new Date(date);

  if (inputDate.toDateString() === today.toDateString()) {
    return "Hoy";
  } else if (inputDate.toDateString() === yesterday.toDateString()) {
    return "Ayer";
  } else {
    return inputDate.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

// Componente para el badge de fecha
const DateBadge = ({ dateText }) => {
  const mode = useColorScheme();

  return (
    <View style={[tStyles.centerx, { marginVertical: 15 }]}>
      <View>
        <Text style={[getStyles(mode).titleBadge]}>{dateText}</Text>
      </View>
    </View>
  );
};

const GroupByInfo = ({ navigation, route }) => {
  const [idGroup] = useState(route.params["idGroup"]);
  const [idGroupBy] = useState(route.params["idGroupBy"]);
  const [groupByInfo, setGroupByInfo] = useState(new GROUP_BY_TICKETS()); // mm - lo iinicializo para que me de error cuando muestro la primera vez
  const [groupUsersList, setGroupUsersList] = useState([]);
  const [avatarURL, setAvatarURL] = useState("");
  const [dataList, setDataList] = useState([]);
  const [dataListSearch, setDataListSearch] = useState([]);
  const [groupedTickets, setGroupedTickets] = useState([]);
  const [groupedTicketsSearch, setGroupedTicketsSearch] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const mode = useColorScheme();
  const scrollOffset = 150;
  const profile = getProfile();
  const { showAlertModal } = React.useContext(AppContext);
  const [isSearch, setIsSearch] = useState(false);
  
  const FILTER_TICKETS_ALL = "all";
  const FILTER_TICKETS_OPEN = "open";
  const FILTER_TICKETS_CLOSE = "close";
  const [filterTicket, setFilterTicket] =useState("all");

  const scroll = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scroll.value = e.contentOffset.y;
    },
  });
  const openViewer = (filename, mediaType) => {
    navigation.navigate("Viewer", { filename: filename, mediaType: mediaType });
  };

  const handleImagePress = () => {
    openViewer(avatarURL, "image/jpeg");
  };

  async function changeAvatar(media = "") {
    try {
      if (media == "") {
        const res = await showAttachmentPicker();
        if (!res) {
          return;
        }
        media = res.type;
      }

      setIsLoading(true);
      let uploadedFile = await getFileAndUpload(idGroupBy, true, media);

      if (!uploadedFile) {
        showAlertModal("Error", "Ocurrió un error al procesar la imagen. Por favor intente nuevamente.");
        setIsLoading(false);
        return;
      }

      // Actualizar el avatar con un nuevo key para forzar la recarga
      setAvatarKey(Date.now());
      setAvatarURL(idGroupBy + ".jpg?t=" +Date.now());
      setIsLoading(false);
    } catch (error) {
      showAlertModal("Error", "Ocurrió un error al procesar la imagen. Por favor intente nuevamente.");
      setIsLoading(false);
    }
  }

  function filterTicketByStatus(idFilter) {
    setFilterTicket(idFilter);
    // El useEffect se encargará de aplicar el filtro automáticamente
  }
  useEffect(() => {
    setAvatarURL(idGroupBy + ".jpg?t=" +Date.now());

    const off = localData.onEvent(EVENT_LOCAL_LISTVIEW_UPDATED, (doc) => {
      loadData()
    });
    const onFocus = () => {
      loadData();
    };

    const unsubscribe = navigation.addListener("focus", onFocus);

    return () => {
      console.log("🧹 Componente desmontado");
      typeof off === "function" && off();
      unsubscribe();
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []);

  // useEffect para aplicar el filtro cuando cambia filterTicket
  useEffect(() => {
    if (dataList.length > 0) {
      applyCurrentFilter();
    }
  }, [filterTicket]);

  // Función para aplicar el filtro actual sin recargar datos
  const applyCurrentFilter = () => {
    let filteredData;
    
    if (filterTicket === FILTER_TICKETS_ALL) {
      filteredData = dataList;
    } else if (filterTicket === FILTER_TICKETS_OPEN) {
      filteredData = dataList.filter((item) => item.isOpen === true);
    } else if (filterTicket === FILTER_TICKETS_CLOSE) {
      filteredData = dataList.filter((item) => item.isOpen === false);
    } else {
      filteredData = dataList;
    }
    
    // Ordenar por timestamp descendente
    filteredData.sort((a, b) => {
      const dateA = new Date(a.ts).getTime();
      const dateB = new Date(b.ts).getTime();
      return dateB - dateA;
    });
    
    // Actualizar las listas filtradas
    setDataListSearch(filteredData);
    
    // Actualizar también los grupos filtrados
    const filteredGrouped = groupTicketsByDate(filteredData);
    setGroupedTicketsSearch(filteredGrouped);
  };

  async function loadData() {
    setRefreshing(true);

    let aux = await db_getGroupByInfo(idGroupBy);
    setGroupByInfo(aux);

    let userList = aux.groupUsers.map((item) => ({ id: item, name: getContactName(item) }));
    setGroupUsersList(userList);
    let dataTicketBD = await localData.getTicketList();

    dataTicketBD = dataTicketBD.filter((ticket) => ticket.idGroupBy == idGroupBy);

    // Ordenar los tickets por timestamp (ts) de forma descendente
    dataTicketBD.sort((a, b) => {
      const dateA = new Date(a.ts).getTime();
      const dateB = new Date(b.ts).getTime();
      return dateB - dateA;
    });

    // Establecer la lista completa de datos
    setDataList(dataTicketBD);

    // Aplicar el filtro actual a los datos cargados
    let filteredData;
    if (filterTicket === FILTER_TICKETS_ALL) {
      filteredData = dataTicketBD;
    } else if (filterTicket === FILTER_TICKETS_OPEN) {
      filteredData = dataTicketBD.filter((item) => item.isOpen === true);
    } else if (filterTicket === FILTER_TICKETS_CLOSE) {
      filteredData = dataTicketBD.filter((item) => item.isOpen === false);
    } else {
      filteredData = dataTicketBD;
    }

    // Establecer la lista filtrada
    setDataListSearch(filteredData);

    // Agrupar tickets por fecha con los datos filtrados
    const grouped = groupTicketsByDate(filteredData);
    setGroupedTickets(grouped);
    setGroupedTicketsSearch(grouped);

    setRefreshing(false);
  }

  function searchText(textToSearch) {
    const filteredList = !textToSearch ? dataList : dataList.filter((obj) => obj.title && obj.title.toLowerCase().includes(textToSearch.toLowerCase()));
    setDataListSearch(filteredList);

    // También actualizar los grupos filtrados
    const filteredGrouped = groupTicketsByDate(filteredList);
    setGroupedTicketsSearch(filteredGrouped);
  }

  function goToTicketDetail(idTicket, isSeen) {
    try {
      if (!isSeen) {
        localData.setTicketSeen (idTicket, true)
      }
      navigation.navigate("TicketDetail", { idTicket: idTicket });
    } catch (error) {
      console.error("❌ Error al navegar:", error);
    }
  }

  return (
    <SafeAreaView edges={["right", "left", "bottom"]} style={[getStyles(mode).container, { overflow: "visible" }]}>
      <Loading loading={isLoading} />
      <AttachmentPickerHost camera={true} gallery={true} file={false} />

      {/* Top Bar */}
      <AnimatedTopBar
        scroll={scroll}
        scrollOffset={scrollOffset}
        uri={URL_FILE_DOWNLOAD + URL_FILE_SMALL_PREFIX + avatarURL}
        name={groupByInfo.name}
        onImagePress={handleImagePress}
        onCameraPress={changeAvatar}
        avatarKey={avatarKey}
      />
      <Animated.ScrollView
        scrollEventThrottle={1}
        bounces={false}
        showsVerticalScrollIndicator={false}
        style={{ height: "100%" }}
        contentContainerStyle={{ paddingTop: 0 }}
        onScroll={scrollHandler}
        keyboardShouldPersistTaps="handled">
        <View style={[tStyles.centery, getStyles(mode).info, { marginTop: -40 }]}>
          <Text style={getStyles(mode).sectionTitle}>{groupByInfo.name}</Text>
        </View>
        <View style={[getStyles(mode).bgStrip, { paddingHorizontal: 20 }]}>
          <Text style={[getStyles(mode).sectionTitle, { paddingBottom: 20 }]}>{groupByInfo.groupUsers.length} Contactos</Text>
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            data={groupUsersList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <UserItem item={item} profile={profile} />}
            contentContainerStyle={{ paddingHorizontal: 0 }}
            keyboardShouldPersistTaps="handled"
          />
        </View>
        
        {/* Totales por moneda */}
        
        
        <View style={[{ borderBottomWidth:0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical:20 }]}>
          {!isSearch && <Text style={[getStyles(mode).sectionTitle]}>Tickets ordenados por Vencimiento</Text>}
          {isSearch ? (
            <SearchBar textToSearch={searchText} />
          ) : (
            <TouchableOpacity onPress={() => setIsSearch(!isSearch)} style={{ padding: 0 }}>
              <Feather name="search" size={24} color={colors.gray50} />
            </TouchableOpacity>
          )}
        </View>
        <View style={{paddingHorizontal: 20}}>
        <BadgeBtn
                  items={[
                    { id: FILTER_TICKETS_ALL, title: "Todos", active: filterTicket == FILTER_TICKETS_ALL, onClick: () => filterTicketByStatus(FILTER_TICKETS_ALL) },
                    { id: FILTER_TICKETS_OPEN, title: "Pendientes", active: filterTicket == FILTER_TICKETS_OPEN, onClick: () => filterTicketByStatus(FILTER_TICKETS_OPEN) },
                    { id: FILTER_TICKETS_CLOSE, title: "Cumplidos", active: filterTicket == FILTER_TICKETS_CLOSE, onClick: () => filterTicketByStatus(FILTER_TICKETS_CLOSE) },
                  ]}
                  idActive={filterTicket}
                />
                </View>
        <TotalesPorMoneda tickets={dataListSearch} mode={mode} idfilter={filterTicket} />
        <View style={[{ padding: 10 }]}>
          {groupedTicketsSearch.map((group, groupIndex) => (
            <View key={group.date}>
              <DateBadge dateText={group.dateFormatted} />
              <FlatList
                scrollEnabled={false}
                horizontal={false}
                showsHorizontalScrollIndicator={false}
                data={group.tickets}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={({ item }) => <TicketItem item={item} onClick={goToTicketDetail}  />}
                contentContainerStyle={{ paddingHorizontal: 0 }}
                keyboardShouldPersistTaps="handled"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
              />
            </View>
          ))}
        </View>
      </Animated.ScrollView>
      <TouchableOpacity
        onPress={() => navigation.navigate("NewTicket", { usersList: groupByInfo.groupUsers, idTicketGroup: idGroup, idTicketGroupBy: idGroupBy })}
        style={[
          getStyles(mode).floatingBtn,
          {
            position: "absolute",
            bottom: 80,
            right: 20,
            zIndex: 1000,
            elevation: 8,
          },
        ]}>
        <MaterialCommunityIcons name="message-plus" size={20} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const TicketItem = ({ item, onClick }) => {
  const mode = useColorScheme();
  console.log (item)
  return (
    <TouchableOpacity onPress={() => onClick(item.idTicket, item.seen)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6 }}>
      <ImgAvatar id={item.id} detail={false} size={50} />
      <View style={{ flex: 1, marginLeft: 13, flexDirection: "column", justifyContent: "center" }}>
        {/* Primera línea: title (izquierda) - ts (derecha) */}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Text style={[getStyles(mode).listMainText, { flexShrink: 1, marginRight: 10 }]} numberOfLines={1}>
            {ellipString(item.title, 25)}
          </Text>
          <Text style={[getStyles(mode).listSecondText, (!item.seen && item.changeSource === 'log_status') ? {color: colors.warning} : null]}>
                      {item.statusText ? `[${ellipString(item.statusText, 10)}] ` : ""} {formatDateToText(item.dueDate)}
                    </Text>
        </View>
        {/* Segunda línea: statusText (izquierda) - seen badge (derecha) */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: 4 }}>
          <Text style={[getStyles(mode).listSecondText, !item.seen && item.changeSource === "chat" ? { color: colors.warning } : null]} numberOfLines={1}>
            {item.changesource}
            {item.lastMsg != "" ? ellipString(item.lastMsg, 50) : " "}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            {item.way == TICKET_TYPE_PAY && (
              <Text style={[getStyles(mode).listSecondText, { color: colors.cancel }]}>
                - {item.currency} {formatNumber(item.amount)} {!item.isOpen && <Fontisto name="locked" size={15} />}
              </Text>
            )}
            {item.way == TICKET_TYPE_COLLECT && (
              <Text style={[getStyles(mode).listSecondText]}>
                {item.currency} {formatNumber(item.amount)} {!item.isOpen && <Fontisto name="locked" size={15} />}
              </Text>
            )}
            <Text></Text>
            {!item.seen && (
                    <View style={getStyles(mode).activeBadge}>
                      <Text style={getStyles(mode).badgeText}>{` `}</Text>
                    </View>
                  )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const UserItem = ({ item, profile }) => {
  const mode = useColorScheme();

  return (
    <View>
      {item.contact != profile.idUser && (
        <TouchableOpacity>
          <View style={[getStyles(mode).linkIconHolder, { marginRight: 15 }]}>
            <ImgAvatar id={item.id} detail={true} size={40} />
          </View>

          <Text style={getStyles(mode).smallText}>{ellipString(item.name, 8)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Componente para mostrar totales de ingresos y egresos por moneda
const TotalesPorMoneda = ({ tickets, mode, idfilter }) => {
  // Calcular totales por moneda usando la misma estructura que MoneyAgenda
  const calcularTotales = () => {
    const totales = {};

    tickets.forEach(ticket => {
      // Usar directamente los tickets que se pasan (ya vienen filtrados desde dataListSearch)
      if (!ticket.currency || ticket.amount === undefined) return;

      const currency = ticket.currency;
      if (!totales[currency]) {
        totales[currency] = {
          collect: 0,
          pay: 0
        };
      }

      const amount = parseFloat(ticket.amount) || 0;

      if (ticket.way === TICKET_TYPE_COLLECT) {
        totales[currency].collect += amount;
      } else if (ticket.way === TICKET_TYPE_PAY) {
        totales[currency].pay += amount;
      }
    });

    return totales;
  };

  const totales = calcularTotales();
  const currencies = Object.keys(totales);

  // Determinar el título según el filtro
  
  if (currencies.length === 0) {
    return null; // No mostrar si no hay datos
  }

  return (
    <View style={[ { paddingHorizontal: 20, marginVertical: 10 }]}>
      {/* Totales por moneda usando el formato de MoneyAgenda */}
      <View style={{ alignItems: 'center' }}>
        <Text style={getStyles(mode).subNormalText}>
            Resumen de Tickets
          </Text>
        {currencies.map(currency => {
          const { collect, pay } = totales[currency];
          const total = collect - pay;
          
          return (
            <View key={currency} style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginVertical: 3,
              paddingHorizontal: 15,
              paddingVertical: 8,
              backgroundColor: mode === 'dark' ? '#333' : '#f5f5f5',
              borderRadius: 10,
              minWidth: 280
            }}>
              <Text style={[
                getStyles(mode).listMainText,
                { fontSize: 14, fontWeight: 'bold', minWidth: 50 }
              ]}>
                {currency}:{' '}
              </Text>
              
              {collect > 0 && (
                <Text style={[
                  getStyles(mode).listSecondText,
                  { fontSize: 13, color: colors.success || '#28a745', fontWeight: 'bold' }
                ]}>
                  +{formatNumber(collect)}
                </Text>
              )}
              
              {collect > 0 && pay > 0 && (
                <Text style={[
                  getStyles(mode).listSecondText,
                  { fontSize: 13, marginHorizontal: 6, fontWeight: 'bold' }
                ]}>
                  |
                </Text>
              )}
              
              {pay > 0 && (
                <Text style={[
                  getStyles(mode).listSecondText,
                  { fontSize: 13, color: colors.cancel || '#dc3545', fontWeight: 'bold' }
                ]}>
                  -{formatNumber(pay)}
                </Text>
              )}
              
              <Text style={[
                getStyles(mode).listMainText,
                { 
                  fontSize: 15, 
                  marginLeft: 10,
                  fontWeight: 'bold',
                  color: total >= 0 ? (colors.success || '#28a745') : (colors.cancel || '#dc3545'),
                  textDecorationLine: 'underline'
                }
              ]}>
                = {total >= 0 ? '+' : ''}{formatNumber(total)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default GroupByInfo;
