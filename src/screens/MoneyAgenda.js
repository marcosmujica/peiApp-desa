import React, { useState, useEffect } from "react";
import { onEvent, offEvent, EVENT_DB_CHANGE } from "../commonApp/DBEvents";
import { View, ScrollView, KeyboardAvoidingView, Text, TextInput, Image, RefreshControl, FlatList, SectionList, TouchableOpacity, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fontisto, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, tStyles } from "../common/theme";
import { getStyles } from "../styles/home";
import { useNavigation } from "@react-navigation/native";
import SlideOptions from "../components/SlideOptions";
import AppContext from "../context/appContext";
import { displayTime, ellipString } from "../common/helpers";
import SearchBar from "../components/SearchBar";
import BadgeBtn from "../components/BadgeBtn";
import TitleBar from "../components/TitleBar";
import Loading from "../components/Loading"
import Hr from "../components/Hr"
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
import { formatDateToText, formatNumber, deepObjectMerge, formatDateToStringLong, formatDateToYYYYMMDD } from "../commonApp/functions";
import { TICKET_DETAIL_CHANGE_DUE_DATE_STATUS, TICKET_DETAIL_CLOSED_STATUS, TICKET_DETAIL_STATUS, TICKET_TYPE_COLLECT, TICKET_TYPE_PAY } from "../commonApp/constants";
import localData, { EVENT_LOCAL_LISTVIEW_UPDATED } from '../commonApp/localData';
import moment from "moment";
import "moment/locale/es";
moment.locale("es");

const MoneyAgenda = ({ navigation, route }) => {
  const FILTER_TICKETS = "TICKETS";
  const FILTER_GROUPS = "GROUPS";
  const FILTER_WAY = "PAY";

  const TICKET_TYPE_ALL = "all";

  const FILTER_TICKETS_ALL = "all";
  const FILTER_TICKETS_OPEN = "open";
  const FILTER_TICKETS_CLOSE = "close";

  // Función para agrupar tickets por día con saldo anterior
  const groupTicketsByDay = (tickets, previousBalanceParam = {}) => {
    if (!tickets || tickets.length === 0) return [];

    const grouped = tickets.reduce((acc, ticket) => {
      const dateKey = formatDateToYYYYMMDD(new Date(ticket.dueDate));
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: ticket.dueDate,
          tickets: [],
          totals: {}
        };
      }
      
      acc[dateKey].tickets.push(ticket);
      
      // Calcular totales por moneda
      if (!acc[dateKey].totals[ticket.currency]) {
        acc[dateKey].totals[ticket.currency] = { collect: 0, pay: 0 };
      }
      
      if (ticket.way === TICKET_TYPE_COLLECT) {
        acc[dateKey].totals[ticket.currency].collect += parseFloat(ticket.amount) || 0;
      } else if (ticket.way === TICKET_TYPE_PAY) {
        acc[dateKey].totals[ticket.currency].pay += parseFloat(ticket.amount) || 0;
      }
      
      return acc;
    }, {});

    // Convertir a array y ordenar por fecha
    const sortedGroups = Object.keys(grouped)
      .sort()
      .map(dateKey => grouped[dateKey]);

    // Inicializar acumulados corridos con el saldo anterior
    const runningTotals = {};
    
    // Copiar saldo anterior como base
    Object.keys(previousBalanceParam).forEach(currency => {
      runningTotals[currency] = {
        collect: previousBalanceParam[currency].collect || 0,
        pay: previousBalanceParam[currency].pay || 0
      };
    });
    
    sortedGroups.forEach((group, index) => {
      const cumulativeTotals = {};
      
      // Para cada moneda en el grupo actual
      Object.keys(group.totals).forEach(currency => {
        if (!runningTotals[currency]) {
          runningTotals[currency] = { collect: 0, pay: 0 };
        }
        
        // Sumar los totales del día actual al acumulado
        runningTotals[currency].collect += group.totals[currency].collect;
        runningTotals[currency].pay += group.totals[currency].pay;
        
        // Guardar una copia del acumulado hasta este día
        cumulativeTotals[currency] = { 
          collect: runningTotals[currency].collect,
          pay: runningTotals[currency].pay
        };
      });
      
      // También agregar monedas que ya tenían acumulado pero no tienen movimiento hoy
      Object.keys(runningTotals).forEach(currency => {
        if (!cumulativeTotals[currency]) {
          cumulativeTotals[currency] = {
            collect: runningTotals[currency].collect,
            pay: runningTotals[currency].pay
          };
        }
      });
      
      // Agregar el acumulado corrido al grupo
      group.cumulativeTotals = cumulativeTotals;
    });

    return sortedGroups;
  };

  // Función para calcular totales generales de todo el listado
  const calculateGrandTotals = (tickets) => {
    if (!tickets || tickets.length === 0) return {};
    
    const grandTotals = {};
    
    tickets.forEach(ticket => {
      if (!grandTotals[ticket.currency]) {
        grandTotals[ticket.currency] = { collect: 0, pay: 0 };
      }
      
      if (ticket.way === TICKET_TYPE_COLLECT) {
        grandTotals[ticket.currency].collect += parseFloat(ticket.amount) || 0;
      } else if (ticket.way === TICKET_TYPE_PAY) {
        grandTotals[ticket.currency].pay += parseFloat(ticket.amount) || 0;
      }
    });
    
    return grandTotals;
  };

  // Función para calcular el saldo anterior hasta la primera fecha mostrada
  const calculatePreviousBalance = async (firstDateShown) => {
    try {
      console.log("🔍 calculatePreviousBalance - firstDateShown:", firstDateShown);
      
      // Obtener TODOS los tickets (sin filtrar por isOpen)
      let allTickets = await localData.getTicketList();
      console.log("🔍 Total de tickets en BD:", allTickets ? allTickets.length : 0);
      
      if (!firstDateShown || !allTickets || allTickets.length === 0) {
        console.log("🔍 Sin fecha o sin tickets, retornando objeto vacío");
        return {};
      }

      // Filtrar solo tickets anteriores a la primera fecha mostrada
      const firstDate = new Date(firstDateShown);
      console.log("🔍 Fecha límite:", firstDate);
      
      const previousTickets = allTickets.filter(ticket => {
        const ticketDate = new Date(ticket.dueDate);
        const isEarlier = ticketDate < firstDate;
        return isEarlier;
      });
      
      console.log("🔍 Tickets anteriores encontrados:", previousTickets.length);
      console.log("🔍 Primeros 3 tickets anteriores:", previousTickets.slice(0, 3).map(t => ({
        date: t.dueDate,
        currency: t.currency,
        amount: t.amount,
        way: t.way
      })));

      // Calcular totales del saldo anterior
      const previousBalance = {};
      previousTickets.forEach(ticket => {
        if (!previousBalance[ticket.currency]) {
          previousBalance[ticket.currency] = { collect: 0, pay: 0 };
        }
        
        if (ticket.way === TICKET_TYPE_COLLECT) {
          previousBalance[ticket.currency].collect += parseFloat(ticket.amount) || 0;
        } else if (ticket.way === TICKET_TYPE_PAY) {
          previousBalance[ticket.currency].pay += parseFloat(ticket.amount) || 0;
        }
      });

      console.log("🔍 Saldo anterior final:", previousBalance);
      return previousBalance;
    } catch (error) {
      console.log("❌ Error calculando saldo anterior:", error);
      return {};
    }
  };


  // const dbEvents = new EventEmitter(); // Use the shared instance instead of creating a new one
  const colorScheme = useColorScheme();
  const { options, setOptions } = React.useContext(AppContext);
  const [filter, setFilter] = React.useState(FILTER_TICKETS);
  const [filterTicket, setFilterTicket] = React.useState(FILTER_TICKETS_ALL);
  const [refreshing, setRefreshing] = useState(false);
  const [filterWay, setFilterWay] = useState(TICKET_TYPE_ALL);
  const [loading, setLoading] = useState(false);

  const [dataListSearch, setDataListSearch] = React.useState([]); // mm - datos a ser visualizados
  const [dataTicket, setDataTicket] = React.useState([]); // mm - datos filtrados por los filtros
  const [groupedData, setGroupedData] = React.useState([]); // mm - datos agrupados por día
  const [previousBalance, setPreviousBalance] = React.useState({}); // mm - saldo anterior hasta la primera fecha

  let profile = getProfile();

  const links = [
    { id: 1, title: "Nuevo Grupo", onPress: () => navigation.navigate("GroupList", { isAddGroup: true }) },
    { id: 2, title: "Nuevo Ticket", onPress: () => navigation.navigate("MemberList") },
    { id: 4, title: "Ajustes", onPress: () => navigation.navigate("UserProfile") },
  ];

  function filterTicketByWay(filter) {
    try {
      setRefreshing(true);
      setFilterWay(filter);

      let aux;
      if (filter == TICKET_TYPE_ALL) {
        aux = dataTicket;
      } else {
        aux = dataTicket.filter((item) => item.way === filter);
      }

      setDataListSearch(aux);
      setGroupedData(groupTicketsByDay(aux, previousBalance));
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
    
    setDataListSearch(filteredData);
    setGroupedData(groupTicketsByDay(filteredData, previousBalance));
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
    setGroupedData(groupTicketsByDay(filteredTickets, previousBalance));
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
      
      // mm - solo los abiertos
       dataTicketBD = dataTicketBD.filter ((item)=> item.isOpen)

      // Ordenar los tickets por timestamp (ts) de forma descendente
      dataTicketBD.sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return dateA - dateB;
      });
      
      // mm - crear nuevos arrays para forzar re-render
      const newDataTicket = dataTicketBD ? [...dataTicketBD] : [];
      const newDataListSearch = dataTicketBD ? [...dataTicketBD] : [];
      
      // Calcular saldo anterior hasta la primera fecha mostrada
      const firstDate = newDataListSearch.length > 0 ? newDataListSearch[0].dueDate : null;
      console.log("🔍 Primera fecha encontrada:", firstDate);
      
      const calculatedPreviousBalance = await calculatePreviousBalance(firstDate);
      console.log("🔍 Saldo anterior calculado:", calculatedPreviousBalance);
      console.log("🔍 Claves del saldo anterior:", Object.keys(calculatedPreviousBalance));
      
      setPreviousBalance(calculatedPreviousBalance);
      setDataTicket(newDataTicket);
      setDataListSearch(newDataListSearch);
      setGroupedData(groupTicketsByDay(newDataListSearch, calculatedPreviousBalance));

      console.log("✅ loadData completado - tickets cargados:", newDataTicket.length);
      console.log("✅ Saldo anterior calculado:", calculatedPreviousBalance);
    } catch (e) {
      console.log("error en loaddata");
      console.log(e);
    }
    setRefreshing(false);
  }
  return (
    <SafeAreaView style={getStyles(colorScheme).container}>
      <Loading loading={loading} title="Trabajando, por favor espera..." />
      <TitleBar title="Agenda de Pagos y Cobros" goBack={true}  />
      <KeyboardAvoidingView behavior="padding" style={[tStyles.flex1]}>
        <View style={[getStyles(colorScheme).container, { paddingHorizontal: 15 }]}>
          <SectionList
          ListHeaderComponent={
            <View>
             
              <SearchBar textToSearch={searchText} />
              {/*<BadgeBtn
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
              */}
              {/* Saldo anterior */}
              <PreviousBalanceHeader balance={previousBalance} firstDate={dataListSearch.length > 0 ? dataListSearch[0].dueDate : null} />

              {/* Acumulado General al principio */}
              {dataListSearch.length > 0 && (() => {
                // Calcular fechas mínima y máxima del período usando las fechas directamente
                const dateStrings = dataListSearch.map(ticket => ticket.dueDate);
                dateStrings.sort(); // Ordena alfabéticamente las fechas (YYYY-MM-DD se ordena correctamente)
                const startDate = dateStrings[0]; // Primera fecha (más antigua)
                const endDate = dateStrings[dateStrings.length - 1]; // Última fecha (más nueva)
                
                return (
                  <GrandTotalFooter 
                    totals={calculateGrandTotals(dataListSearch)} 
                    startDate={startDate}
                    endDate={endDate}
                  />
                );
              })()}
            </View>
          }
          showsVerticalScrollIndicator={false}
          sections={groupedData.map(group => {
            const today = new Date();
            const dateToCheck = new Date(group.date);
            const isToday = formatDateToYYYYMMDD(today) === formatDateToYYYYMMDD(dateToCheck);
            
            return {
              title: group.date,
              totals: group.totals,
              cumulativeTotals: group.cumulativeTotals,
              data: group.tickets,
              isToday: isToday
            };
          })}
          keyExtractor={(item, index) => item.idTicket || index.toString()}
          renderItem={({ item, section }) => {
            return <TicketItem item={item} idProfile={profile.idUser} idUser={profile.idUser} onClick={goToTicket} isToday={section.isToday} />;
          }}
          renderSectionHeader={({ section }) => (
            <DateHeader 
              date={section.title} 
              totals={section.totals} 
              cumulativeTotals={section.cumulativeTotals}
            />
          )}
            contentContainerStyle={{ paddingBottom: 80 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const TicketItem = ({ item, idUser, onClick, idProfile, isToday }) => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  
  return (
    <TouchableOpacity onPress={() => onClick(item.idTicket, item.title, item.seen)} style={[
      getStyles(colorScheme).chatContainer,
      isToday && {borderTopColor: colors.gray50, borderTopWidth:1} /*{ backgroundColor: colors.gray75, paddingHorizontal:10, borderRadius:25, margin:5 }*/
    ]}>
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

const DateHeader = ({ date, totals, cumulativeTotals }) => {
  const colorScheme = useColorScheme();
  
  // Verificar si la fecha es hoy
  const today = new Date();
  const dateToCheck = new Date(date);
  const isToday = formatDateToYYYYMMDD(today) === formatDateToYYYYMMDD(dateToCheck);

  return (
    <View style={[
      { 
        marginVertical: 10, 
        marginHorizontal: 5,
        alignItems: 'center'
      },
      isToday 
    ]}>
      <Hr />
      {/* Badge centrado con la fecha larga */}
      <View style={{padding:10}}><View style={getStyles(colorScheme).titleBadge}>
        <Text style={getStyles(colorScheme).chatTime}>
          {formatDateToStringLong(date)}
        </Text>
        </View>
      </View>
      
      {/* Acumulado del día */}
      {Object.keys(totals).length > 0 && (
        <View style={{ alignItems: 'center', marginTop: 5 }}>
          {Object.keys(totals).map(currency => {
            const { collect, pay } = totals[currency];
            const total = collect - pay;
            
            return (
              <View key={currency} style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginVertical: 1
              }}>
                <Text style={[
                  getStyles(colorScheme).listSecondText,
                  { fontSize: 11, fontWeight: 'bold' }
                ]}>
                  {currency}:{' '}
                </Text>
                
                {collect > 0 && (
                  <Text style={[
                    getStyles(colorScheme).listSecondText,
                    { fontSize: 11, color: colors.success || '#28a745' }
                  ]}>
                    +{formatNumber(collect)}
                  </Text>
                )}
                
                {collect > 0 && pay > 0 && (
                  <Text style={[
                    getStyles(colorScheme).listSecondText,
                    { fontSize: 11, marginHorizontal: 3 }
                  ]}>
                    |
                  </Text>
                )}
                
                {pay > 0 && (
                  <Text style={[
                    getStyles(colorScheme).listSecondText,
                    { fontSize: 11, color: colors.cancel || '#dc3545' }
                  ]}>
                    -{formatNumber(pay)}
                  </Text>
                )}
                
                <Text style={[
                  getStyles(colorScheme).listSecondText,
                  { 
                    fontSize: 11, 
                    marginLeft: 8,
                    fontWeight: 'bold',
                    color: total >= 0 ? (colors.success || '#28a745') : (colors.cancel || '#dc3545')
                  }
                ]}>
                  = {total >= 0 ? '+' : ''}{formatNumber(total)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
      {/* Acumulado corrido hasta la fecha */}
      {cumulativeTotals && Object.keys(cumulativeTotals).length > 0 && (
        <View style={{ 
          alignItems: 'center', 
          marginTop: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border || '#ddd',
          borderStyle: 'dashed'
        }}>
          <Text style={[
            getStyles(colorScheme).listSecondText,
            { 
              fontSize: 10, 
              textAlign: 'center',
              fontWeight: 'bold',
              marginBottom: 3,
            }
          ]}>
            Acumulado hasta hoy:
          </Text>
          {Object.keys(cumulativeTotals).map(currency => {
            const { collect, pay } = cumulativeTotals[currency];
            const total = collect - pay;
            
            return (
              <View key={currency} style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginVertical: 1,
                paddingHorizontal: 10,
                paddingVertical: 2,
                backgroundColor: colorScheme === 'dark' ? 'rgba(0,123,255,0.1)' : 'rgba(0,123,255,0.05)',
                borderRadius: 8
              }}>
                <Text style={[
                  getStyles(colorScheme).listSecondText,
                  { fontSize: 10, fontWeight: 'bold' }
                ]}>
                  {currency}:{' '}
                </Text>
                
                {collect > 0 && (
                  <Text style={[
                    getStyles(colorScheme).listSecondText,
                    { fontSize: 10, color: colors.success || '#28a745', fontWeight: '600' }
                  ]}>
                    +{formatNumber(collect)}
                  </Text>
                )}
                
                {collect > 0 && pay > 0 && (
                  <Text style={[
                    getStyles(colorScheme).listSecondText,
                    { fontSize: 10, marginHorizontal: 3,  }
                  ]}>
                    |
                  </Text>
                )}
                
                {pay > 0 && (
                  <Text style={[
                    getStyles(colorScheme).listSecondText,
                    { fontSize: 10, color: colors.cancel || '#dc3545', fontWeight: '600' }
                  ]}>
                    -{formatNumber(pay)}
                  </Text>
                )}
                
                <Text style={[
                  getStyles(colorScheme).listMainText,
                  { 
                    fontSize: 11, 
                    marginLeft: 6,
                    fontWeight: 'bold',
                    color: total >= 0 ? (colors.success || '#28a745') : (colors.cancel || '#dc3545')
                  }
                ]}>
                  = {total >= 0 ? '+' : ''}{formatNumber(total)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const GrandTotalFooter = ({ totals, startDate, endDate }) => {
  const colorScheme = useColorScheme();
  
  if (!totals || Object.keys(totals).length === 0) return null;
  
  return (
    <View style={{ 
      marginTop: 0, 
      marginBottom: 0,
      marginHorizontal: 5,
      alignItems: 'center',
      paddingVertical: 5,
      backgroundColor: colorScheme === 'dark' ? 'rgba(0,123,255,0.05)' : 'rgba(0,123,255,0.02)'
    }}>
      {/* Badge centrado con el título del acumulado general */}
<View style={getStyles(colorScheme).titleBadge}>
        <Text style={getStyles(colorScheme).sectionTitle}>
          Faltan pagar y cobrar
        </Text>
      </View>

      {/* Información del rango de fechas */}
      {startDate && endDate && (
        <Text style={[
          getStyles(colorScheme).listSecondText,
          { 
            fontSize: 11, 
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 8,
            color: colors.secondary || colors.primary
          }
        ]}>
          Desde: {formatDateToText(startDate)} hasta: {formatDateToText(endDate)}
        </Text>
      )}
      
      {/* Totales generales por moneda */}
      <View style={{ alignItems: 'center', marginTop: 5 }}>
        {Object.keys(totals).map(currency => {
          const { collect, pay } = totals[currency];
          const total = collect - pay;
          
          return (
            <View key={currency} style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginVertical: 2,
              paddingHorizontal: 15,
              paddingVertical: 5,
              backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
              borderRadius: 10,
              minWidth: 250
            }}>
              <Text style={[
                getStyles(colorScheme).listMainText,
                { fontSize: 13, fontWeight: 'bold', minWidth: 45 }
              ]}>
                {currency}:{' '}
              </Text>
              
              {collect > 0 && (
                <Text style={[
                  getStyles(colorScheme).listSecondText,
                  { fontSize: 13, color: colors.success || '#28a745', fontWeight: 'bold' }
                ]}>
                  +{formatNumber(collect)}
                </Text>
              )}
              
              {collect > 0 && pay > 0 && (
                <Text style={[
                  getStyles(colorScheme).listSecondText,
                  { fontSize: 13, marginHorizontal: 5, fontWeight: 'bold' }
                ]}>
                  |
                </Text>
              )}
              
              {pay > 0 && (
                <Text style={[
                  getStyles(colorScheme).listSecondText,
                  { fontSize: 13, color: colors.cancel || '#dc3545', fontWeight: 'bold' }
                ]}>
                  -{formatNumber(pay)}
                </Text>
              )}
              
              <Text style={[
                getStyles(colorScheme).listMainText,
                { 
                  fontSize: 14, 
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
        
        {/* Texto informativo */}
        <Text style={[
          getStyles(colorScheme).listSecondText,
          { 
            fontSize: 10, 
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: 10,
            opacity: 0.7
          }
        ]}>
          {/*startDate && endDate ? 
            `Resumen del período: ${formatDateToText(startDate)} - ${formatDateToText(endDate)}` :
            'Resumen total de todo el período mostrado'
          */}
        </Text>
      </View>
    </View>
  );
};

const PreviousBalanceHeader = ({ balance, firstDate }) => {
  const colorScheme = useColorScheme();
  
  console.log("🔍 PreviousBalanceHeader - balance:", balance);
  console.log("🔍 PreviousBalanceHeader - firstDate:", firstDate);
  console.log("🔍 PreviousBalanceHeader - balance keys:", balance ? Object.keys(balance) : "balance es null/undefined");
  
  if (!balance || Object.keys(balance).length === 0) {
    return
    console.log("🔍 PreviousBalanceHeader - No se muestra porque balance está vacío");
    return (
      <View style={{ 
        marginTop: 10, 
        marginBottom: 15,
        marginHorizontal: 5,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border || '#ddd',
        backgroundColor: colorScheme === 'dark' ? 'rgba(128,128,128,0.1)' : 'rgba(128,128,128,0.05)'
      }}>
        <View style={{
          backgroundColor: colors.border || '#888',
          paddingHorizontal: 15,
          paddingVertical: 8,
          borderRadius: 20,
          marginBottom: 8
        }}>
          <Text style={getStyles(colorScheme).sectionTitle}>
            No hay cobrados ni pagados
          </Text>
        </View>
        <Text style={[
          getStyles(colorScheme).listSecondText,
          { 
            fontSize: 10, 
            fontStyle: 'italic',
            textAlign: 'center',
            opacity: 0.6
          }
        ]}>
          No hay movimientos anteriores a la fecha mostrada
        </Text>
      </View>
    );
  }
  
  return (
    <View style={{ 
      marginTop: 10, 
      marginBottom: 15,
      marginHorizontal: 5,
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.warning || '#ffc107',
      backgroundColor: colorScheme === 'dark' ? 'rgba(255,193,7,0.1)' : 'rgba(255,193,7,0.05)'
    }}>
      {/* Badge centrado con el título del saldo anterior */}
      <View style={getStyles(colorScheme).titleBadge}>
        <Text style={getStyles(colorScheme).sectionTitle}>
          Ya cobrados y pagados
        </Text>
      </View>
      
      
      {/* Totales del saldo anterior por moneda */}
      <View style={{ alignItems: 'center' }}>
        {Object.keys(balance).map(currency => {
          const { collect, pay } = balance[currency];
          const total = collect - pay;
          
          return (
            <View key={currency} style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginVertical: 2,
              paddingHorizontal: 12,
              paddingVertical: 4,
              backgroundColor: colorScheme === 'dark' ? 'rgba(255,193,7,0.2)' : 'rgba(255,193,7,0.1)',
              borderRadius: 8,
              minWidth: 200
            }}>
              <Text style={[
                getStyles(colorScheme).listMainText,
                { fontSize: 12, fontWeight: 'bold', minWidth: 40 }
              ]}>
                {currency}:{' '}
              </Text>
              
              {collect > 0 && (
                <Text style={[
                  getStyles(colorScheme).listSecondText,
                  { fontSize: 12, color: colors.success || '#28a745', fontWeight: 'bold' }
                ]}>
                  +{formatNumber(collect)}
                </Text>
              )}
              
              {collect > 0 && pay > 0 && (
                <Text style={[
                  getStyles(colorScheme).listSecondText,
                  { fontSize: 12, marginHorizontal: 4, fontWeight: 'bold' }
                ]}>
                  |
                </Text>
              )}
              
              {pay > 0 && (
                <Text style={[
                  getStyles(colorScheme).listSecondText,
                  { fontSize: 12, color: colors.cancel || '#dc3545', fontWeight: 'bold' }
                ]}>
                  -{formatNumber(pay)}
                </Text>
              )}
              
              <Text style={[
                getStyles(colorScheme).listMainText,
                { 
                  fontSize: 13, 
                  marginLeft: 8,
                  fontWeight: 'bold',
                  color: total >= 0 ? (colors.success || '#28a745') : (colors.cancel || '#dc3545')
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

export default MoneyAgenda;
