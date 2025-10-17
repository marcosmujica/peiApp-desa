import React, { useState,useEffect } from 'react';
import { onEvent, offEvent, EVENT_DB_CHANGE } from '../commonApp/DBEvents';
import { View, Text, TextInput, Image,RefreshControl, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { Fontisto, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tStyles } from '../common/theme';
import { getStyles } from '../styles/home';
import { useNavigation } from '@react-navigation/native';
import SlideOptions from '../components/SlideOptions';
import AppContext from '../context/appContext';
import { displayTime, ellipString } from '../common/helpers';
import SearchBar  from '../components/SearchBar';
import BadgeBtn from "../components/BadgeBtn"
import {db_getAllTicketInfoView, db_initListener, db_openDB, db_getTicketViewByTicketId, db_getAllTicketItem, db_updateTicketListItem, db_addTicketListItem, db_TICKET, db_getAllTickets, db_TICKET_LOG_STATUS, db_TICKET_CHAT} from "../commonApp/database"
import ImgAvatar from '../components/ImgAvatar';
import { getProfile } from '../commonApp/profile';
import { TICKET_LIST_ITEM } from '../commonApp/dataTypes';
import { formatNumber, deepObjectMerge } from '../commonApp/functions';
import {TICKET_DETAIL_STATUS,  TICKET_TYPE_COLLECT,TICKET_TYPE_PAY} from "../commonApp/constants"

const Home = ({ navigation }) => {

    const FILTER_TICKETS = "TICKETS"
    const FILTER_GROUPS = "GROUPS"

    const FILTER_TICKETS_ALL = "all"
    const FILTER_TICKETS_OPEN = "open"
    const FILTER_TICKETS_CLOSE = "close"
    // const dbEvents = new EventEmitter(); // Use the shared instance instead of creating a new one
    const colorScheme = useColorScheme();
    const { options, setOptions } = React.useContext(AppContext);
    const [filter, setFilter] = React.useState(FILTER_TICKETS)
    const [filterTicket, setFilterTicket] = React.useState(FILTER_TICKETS_ALL)
    const [refreshing, setRefreshing] = useState(false);

    const [dataListSearch, setDataListSearch] = React.useState ([]) // mm - datos a ser visualizados
    const [dataTicket, setDataTicket] = React.useState ([]) // mm - datos filtrados por los filtros
    
    let profile = getProfile()

     const links = [
        { id:1, title: "New group", onPress: () => navigation.navigate('NewGroup') },
        { id:2, title: "New broadcast", onPress: () => navigation.navigate('Broadcast') },
        { id:3, title: "Starred Messages", onPress: () => {} },
        { id:4, title: "Ajustes", onPress: () => navigation.navigate('UserProfile') },
    ];

    function filterTicketByStatus (filter)
    {
        setFilterTicket (filter)
        setRefreshing (true)
        if (filter == FILTER_TICKETS_ALL) 
        {
            setDataListSearch( dataTicket)
        }
        if (filter == FILTER_TICKETS_CLOSE) 
        {
            let aux = dataTicket.filter ((item) => item.isOpen === false)
            setDataListSearch( aux)
        }
        if (filter == FILTER_TICKETS_OPEN) 
        {
            let aux = dataTicket.filter ((item) => item.isOpen === true)
            setDataListSearch( aux)
        }

        setRefreshing (false)
    }
    async function processEvent (doc)
    {
        console.log ("🔔 EVENT RECEIVED:", doc.table, doc._id)
        //return
        try {
            if (doc.table == db_TICKET_CHAT)
            {
                let item = await db_getTicketViewByTicketId (doc.data.idTicket)

                if (item.length == 0) return
                
                item.lastMsg = doc.data.message
                
                if (doc.data.mediaType == "image") item.lastMsg = ">> Foto"
                if (doc.data.mediaType == "file") item.lastMsg = ">> Archivo"

                let aux2 = TICKET_DETAIL_STATUS.find ((aux)=> aux.code == doc.data.idStatus)

                // mm - si lo envie yo no lo marco
                if (doc.data.idUserFrom != profile.idUser)
                {
                    item.ts = new Date()
                    item.seen = false
                }

                // mm - NO actualizar la BD aquí, solo actualizar el estado UI
                // await db_updateTicketListItem (item.idTicket, item)

                // mm - actualizar solo el item específico en el estado
                updateTicketInList(item.idTicket, item)
            }
            if (doc.table == db_TICKET_LOG_STATUS)
            {
                let item = await db_getTicketViewByTicketId (doc.data.idTicket)

                if (item.length == 0) return
                
                item.status = doc.data.idStatus
                let aux2 = TICKET_DETAIL_STATUS.find ((aux)=> aux.code == doc.data.idStatus)
                item.statusText = aux2.name

                 // mm - si lo envie yo no lo marco
                if (doc.data.idUserFrom != profile.idUser)
                {
                    item.ts = new Date()
                    item.seen = false
                }
                
                // mm - NO actualizar la BD aquí, solo actualizar el estado UI
                // await db_updateTicketListItem (item.idTicket, item)

                // mm - actualizar solo el item específico en el estado
                updateTicketInList(item.idTicket, item)
            }
            if (doc.table == db_TICKET)
            {
                let item = new TICKET_LIST_ITEM ()
                let data = doc.data
                item.idTicket = doc._id
                item.avatar = data.idUserCreatedBy == profile.idUser ? data.idUserTo : data.idUserFrom
                item.currency = doc.data.currency
                item.title = data.title
                item.isOpen = data.isOpen
                item.amount = data.amount
                item.way = data.way
                item.ts = new Date()

                
                // mm - determino si existe antes por si hubo un error previamente
                let aux = await db_getTicketViewByTicketId (doc._id)

                if (!aux){
                    // mm- agrego si no estaba previamente en ticket_view
                    await db_addTicketListItem (item.idTicket, item)
                }
                
                // mm - actualizar solo el item específico en el estado
                updateTicketInList(item.idTicket, item)
            }
        }
        catch(e) { console.log (e); console.log ("❌ error processEvent")}
    }

    // mm - función para actualizar un ticket específico en la lista sin recargar todo
    function updateTicketInList(idTicket, updatedItem) {
        setDataTicket(prevData => {
            const index = prevData.findIndex(t => t.idTicket === idTicket)
            let newData
            
            if (index !== -1) {
                // Actualizar ticket existente
                newData = [...prevData]
                newData[index] = { ...newData[index], ...updatedItem }
            } else {
                // Agregar nuevo ticket
                newData = [...prevData, updatedItem]
            }
            
            // Reordenar por timestamp
            newData.sort((a, b) => {
                const dateA = new Date(a.ts).getTime()
                const dateB = new Date(b.ts).getTime()
                return dateB - dateA
            })
            
            return newData
        })
        
        // Actualizar también la lista de búsqueda
        setDataListSearch(prevData => {
            const index = prevData.findIndex(t => t.idTicket === idTicket)
            let newData
            
            if (index !== -1) {
                newData = [...prevData]
                newData[index] = { ...newData[index], ...updatedItem }
            } else {
                newData = [...prevData, updatedItem]
            }
            
            newData.sort((a, b) => {
                const dateA = new Date(a.ts).getTime()
                const dateB = new Date(b.ts).getTime()
                return dateB - dateA
            })
            
            return newData
        })
    }

    async function checkDB ()
    {
        //await db_openDB ("ticket")
        //await db_openDB ("ticket_log_status")
        //await db_openDB ("ticket_chat")

        db_initListener()
    }

    useEffect(() => {
        // subscribe to new-doc events to reload list

        checkDB ()
        loadData()

        const off = onEvent(EVENT_DB_CHANGE, (doc) => {
            console.log ("VOY A PROCESAR EVENTO")
            processEvent (doc)
        });

        // mm - al hacer el focus elimino todas las otras ventanas
         const onFocus = () => {
        
            checkDB()

            //loadData();
            try {
                navigation.reset((state) => {
                    const active = state.routes[state.index];
                    if (!active || state.routes.length === 1) return state;
                    return {
                        index: 0,
                        routes: [ { name: active.name, params: active.params } ],
                    };
                });
            } catch (e) {
                console.warn('Error pruning navigation state on focus', e);
            }
        };

        const unsubscribe = navigation.addListener('focus', onFocus);

        return () => {
            // cleanup both listeners
            (typeof off === 'function') && off();
            unsubscribe();
        };
    }, []);
    

    function searchText (textToSearch)
    {
    setDataListSearch(
        !textToSearch
            ? dataTicket
            : dataTicket.filter(obj =>
                obj.title && obj.title.toLowerCase().includes(textToSearch.toLowerCase())
            )
    );
    }

    async function goToTicket (idTicket, title, isSeen)
    {
        navigation.navigate('TicketDetail', {idTicket: idTicket, name:title})
        if (!isSeen){
            let item = await db_getTicketViewByTicketId (idTicket)
            if (!item) return
            item.seen= true
            await db_updateTicketListItem (idTicket, item)
        }

    }
    
    async function loadData()
    {
        try{
            //mm - busco desde la bd de tickets y hago join con ticketitem por si no se sicronizo bien y existen tickets en ticket y no se muestran
            //setRefreshing (true)
            const ticketList = await db_getAllTickets ()
            const ticketView = await db_getAllTicketItem ()
            const ticketViewList = new Map(ticketView.map(u => [u.id, u]));

            let dataTicketBD = []

            for (let i=0;i<ticketList.length;i++)
            {
                let aux = new TICKET_LIST_ITEM()
                let ticket = ticketList[i]
                aux.amount = ticket.amount
                aux.avatar = ticket.idUserCreatedBy == profile.idUser ? ticket.idUserTo : ticket.idUserFrom
                aux.currency = ticket.currency
                aux.idTicket = ticket.id
                aux.isOpen = ticket.isOpen
                aux.title = ticket.title
                
                
                // mm - busco el detalle del listview para el ticket
                let item = ticketViewList.get (ticket.id)
                if (item!= undefined)
                {
                    aux.lastMsg = item.lastMsg
                    aux.seen = item.seen
                    aux.status = item.status
                    aux.statusText = item.statusText
                    aux.ts = item.ts
                    aux.unread = item.unread
                }
                dataTicketBD.push (aux)
            }            
            try{
                // mm - ordeno descendentemente por ts (más reciente primero)
                dataTicketBD = dataTicketBD.sort((a, b) => {
                    const dateA = new Date(a.ts).getTime();
                    const dateB = new Date(b.ts).getTime();
                    return dateB - dateA;
                });
            }
            catch (e) {console.log (e); console.log ("Error en loaddata en sort")}
            setDataTicket (dataTicketBD)
            setDataListSearch( dataTicketBD)
            setRefreshing(false)
        }
        catch (e) {console.log ("error en loaddata");console.log (e)}
    }
    return(
        <View style={ getStyles(colorScheme).container }>

            <View style={{ paddingHorizontal: 15 }}>
                <SearchBar textToSearch={searchText} />
                <BadgeBtn items={[{id: FILTER_TICKETS, title: "Tickets", active: filter == FILTER_TICKETS, onClick: () => setFilter(FILTER_TICKETS)},
                    {id: FILTER_GROUPS, title: "Grupos", active: filter == FILTER_GROUPS, onClick: () => setFilter(FILTER_GROUPS)},]}
                  idActive={FILTER_TICKETS}
                />

                {filter == FILTER_TICKETS && <BadgeBtn items={[{id: FILTER_TICKETS_ALL, title: "Todos", active: filterTicket == FILTER_TICKETS_ALL,onClick: () => filterTicketByStatus(FILTER_TICKETS_ALL)},
                    {id: FILTER_TICKETS_OPEN,title: "Abiertos",active: filterTicket == FILTER_TICKETS_OPEN,onClick: () => filterTicketByStatus(FILTER_TICKETS_OPEN),},
                    {id: FILTER_TICKETS_CLOSE,title: "Cerrados",active: filterTicket == FILTER_TICKETS_CLOSE,onClick: () => filterTicketByStatus(FILTER_TICKETS_CLOSE),},]}
                    idActive={filterTicket}
                    />}
                <FlatList 
                    showsVerticalScrollIndicator={ false }
                    data={ dataListSearch }
                    keyExtractor={ (item) => item.idTicket?.toString() }
                    renderItem={ ({ item }) => <TicketItem item={ item} idUser={profile.idUser } onClick={goToTicket} /> } 
                    contentContainerStyle={{ paddingBottom: 200 }} // Ajusta el valor según el espacio necesario
                    refreshControl={
                 <RefreshControl refreshing={refreshing} onRefresh={loadData} />}
                />
            </View>
            
            {/* SlideOptions debe estar fuera del contenedor con padding para posicionamiento absoluto */}
            { options && <SlideOptions links={ links } setOptions={ setOptions } />}
            
            <TouchableOpacity
                onPress={() => navigation.navigate("GroupEdit", { isAddGroup: true })}
                style={getStyles(colorScheme).floatingBtn}
            >
                <MaterialCommunityIcons name="message-plus" size={ 20 } />
            </TouchableOpacity>
            {/* Add a button to open SlideOptions */}
            
        </View>
    )
}

const TicketItem = ({ item, idUser, onClick }) => {
    const navigation = useNavigation();
    const colorScheme = useColorScheme()
    return(
        <TouchableOpacity 
            onPress={() => onClick(item.idTicket, item.title, item.seen)} 
            style={ getStyles(colorScheme).chatContainer }
        >
            <TouchableOpacity>
                <ImgAvatar id = {item.avatar} size={40}/>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 13, flexDirection: 'column', justifyContent: 'center' }}>
                {/* Primera línea: title (izquierda) - ts (derecha) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Text style={ getStyles(colorScheme).chatUsername } numberOfLines={1}>
                        { ellipString(item.title, 20) }
                    </Text>
                    <Text style={ [ getStyles(colorScheme).chatTime, (!item.seen) ? getStyles(colorScheme).activeText : null ] }>
                        { item.statusText ? `[${ellipString(item.statusText, 15)}] ` : '' }
                    </Text>
                </View>
                
                {/* Segunda línea: statusText (izquierda) - seen badge (derecha) */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 4 }}>
                    <Text style={ getStyles(colorScheme).chatMessage } numberOfLines={1}>
                        { item.lastMsg ? ellipString(item.lastMsg, 50) : ' ' }
                    </Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        {item.way == TICKET_TYPE_PAY &&<Text style={ [getStyles(colorScheme).chatTime, {color:"#c53131ff"} ]}>
                            - {item.currency} {formatNumber(item.amount)} {!item.isOpen && <Fontisto name="locked" size={15}/>}
                        </Text>}
                        {item.way == TICKET_TYPE_COLLECT && <Text style={ [getStyles(colorScheme).chatTime,  ]}>
                            {item.currency} {formatNumber(item.amount)} {!item.isOpen && <Fontisto name="locked" size={15}/>}
                        </Text>}
                        {
                            (!item.seen)
                            &&
                            <View style={ getStyles(colorScheme).activeBadge }>
                                <Text style={ getStyles(colorScheme).badgeText }></Text>
                            </View>
                        }
                    </View>
                </View>

            </View>
        </TouchableOpacity>
    )
}

const ListTicket = ({ item }) => {
    const navigation = useNavigation();
    const colorScheme = useColorScheme()

    return(
        <TouchableOpacity 
            onPress={() => navigation.navigate('ChatDetails')} 
            style={ getStyles(colorScheme).chatContainer }
        >
            <TouchableOpacity
                onPress={() => {
                    if(item.group){
                        navigation.navigate('Group')
                    }else{
                        navigation.navigate('Profile')
                    }
                }} 
            >
                <Image
                    source={{ uri: item.img }}
                    style={ getStyles(colorScheme).chatAvatar }
                />
            </TouchableOpacity>
            


            <View style={ getStyles(colorScheme).chatMessageHolder }>
                <View style={[ tStyles.flex1 ]}>
                    <Text style={ getStyles(colorScheme).chatUsername }>{ item.name }</Text>
                    <View style={[ tStyles.row ]}>
                        <Ionicons name='checkmark-done-sharp' size={ 14 } color={ colors.gray50 } />
                        <Text style={ getStyles(colorScheme).chatMessage }>{ ellipString(item.lastMsg, 30) }</Text>
                    </View>
                </View>

                <View style={[ tStyles.endy ]}>
                    <Text style={ [ getStyles(colorScheme).chatTime, (!item.seen) ? getStyles(colorScheme).activeText : null ] }>{ displayTime(item.time) }</Text>
                    {
                        (!item.seen)
                        &&
                        <View style={ getStyles(colorScheme).activeBadge }>
                            <Text style={ getStyles(colorScheme).badgeText }>{ item.unread }</Text>
                        </View>
                    }
                    
                </View>
            </View>
        </TouchableOpacity>
    )
}

const ChatFilter = () => {
    const colorScheme = useColorScheme();

    const filterItems = [
        { id: 1, title: "All", active: true },
        { id: 2, title: "Unread", active: false },
        { id: 3, title: "Groups", active: false },
    ];

    return(
        <View style={[ tStyles.row, { marginVertical: 10 } ]}>
            {
                filterItems.map(item => (
                    <TouchableOpacity style={[ getStyles(colorScheme).chatFilter, (item.active) ? getStyles(colorScheme).activeChatFilter : null ]} key={ item.id }>
                        <Text style={ [getStyles(colorScheme).chatFilterText, (item.active) ? getStyles(colorScheme).activeChatFilterText : null ] }>{ item.title }</Text>
                    </TouchableOpacity>
                ))
            }
            
        </View>
        
    )
}



export default Home;