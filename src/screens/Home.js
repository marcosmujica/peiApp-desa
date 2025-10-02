import React, { useState,useEffect } from 'react';
import { onEvent, offEvent, EVENT_NEW_DOC } from '../commonApp/DBEvents';
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
import {db_getAllTickets} from "../commonApp/database"
import ImgAvatar from '../components/ImgAvatar';
import { getProfile } from '../commonApp/profile';

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

    let dataTicketBD = [] // mm - base de datos principales con los tickets

    const [dataListSearch, setDataListSearch] = React.useState ([]) // mm - datos a ser visualizados
    const [dataTicket, setDataTicket] = React.useState ([]) // mm - datos filtrados por los filtros
    
    let profile = getProfile()

     const links = [
        { id:1, title: "New group", onPress: () => navigation.navigate('NewGroup') },
        { id:2, title: "New broadcast", onPress: () => navigation.navigate('Broadcast') },
        { id:3, title: "Starred Messages", onPress: () => {} },
        { id:4, title: "Ajustes", onPress: () => navigation.navigate('UserProfile') },
    ];

    useEffect(() => {
        // subscribe to new-doc events to reload list
        const off = onEvent(EVENT_NEW_DOC, (doc) => {
            loadData();
        });

        // mm - al hacer el focus elimino todas las otras ventanas
         const onFocus = () => {
            loadData();
            try {
                // Prune the navigation state by resetting to the current active route.
                // Use navigation.reset instead of dispatching a raw state updater to avoid
                // emitting low-level actions (like 'tab') that may not be handled.
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
    }, [navigation]);
    

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
    async function loadData()
    {
        setRefreshing (true)
        let dataTicketBD = await db_getAllTickets ()
        setDataTicket (dataTicketBD)
        setDataListSearch( dataTicketBD)
        setRefreshing(false)
    }
    return(
        <View style={ getStyles(colorScheme).container }>

            <View style={{ paddingHorizontal: 15 }}>
                <SearchBar textToSearch={searchText} />
                <BadgeBtn items={[{id: FILTER_TICKETS, title: "Tickets", active: filter == FILTER_TICKETS, onClick: () => setFilter(FILTER_TICKETS)},
                    {id: FILTER_GROUPS, title: "Grupos", active: filter == FILTER_GROUPS, onClick: () => setFilter(FILTER_GROUPS)},]}
                  idActive={FILTER_TICKETS}
                />

                {filter == FILTER_TICKETS && <BadgeBtn items={[{id: FILTER_TICKETS_ALL, title: "Todos", active: filterTicket == FILTER_TICKETS_ALL,onClick: () => setFilterTicket(FILTER_TICKETS_ALL)},
                    {id: FILTER_TICKETS_OPEN,title: "Abiertos",active: filterTicket == FILTER_TICKETS_OPEN,onClick: () => setFilterTicket(FILTER_TICKETS_OPEN),},
                    {id: FILTER_TICKETS_CLOSE,title: "Cerrados",active: filterTicket == FILTER_TICKETS_CLOSE,onClick: () => setFilterTicket(FILTER_TICKETS_CLOSE),},]}
                    idActive={FILTER_TICKETS_ALL}
                    />}
                <FlatList 
                    showsVerticalScrollIndicator={ false }
                    data={ dataListSearch }
                    keyExtractor={ (item) => item.id?.toString() }
                    renderItem={ ({ item }) => <TicketItem item={ item} idUser={profile.idUser } /> } 
                    contentContainerStyle={{ paddingBottom: 200 }} // Ajusta el valor según el espacio necesario
                    refreshControl={
                 <RefreshControl refreshing={refreshing} onRefresh={loadData} />}
                />
            { options && <SlideOptions links={ links } setOptions={ setOptions } />}
            </View>
            <TouchableOpacity
                onPress={() => navigation.navigate("GroupEdit", { isAddGroup: true })}
                style={getStyles(colorScheme).floatingBtn}
            >
                <MaterialCommunityIcons name="message-plus" size={ 20 } />
            </TouchableOpacity>
            {/* Add a button to open SlideOptions */}
            <TouchableOpacity
                onPress={() => setOptions(true)}
                style={[getStyles(colorScheme).floatingBtn, { bottom: 80 }]} // Adjust position as needed
            >
                <Ionicons name="ellipsis-vertical" size={20} />
            </TouchableOpacity>
        </View>
    )
}




const TicketItem = ({ item, idUser }) => {
    const navigation = useNavigation();
    const colorScheme = useColorScheme()
    return(
        <TouchableOpacity 
            onPress={() => navigation.navigate('TicketDetail', {idTicket: item.id, name: item.title})} 
            style={ getStyles(colorScheme).chatContainer }
        >
            <TouchableOpacity
                onPress={() => {
                        navigation.navigate('TicketDetail', {idTicket: item.id, name: item.title})
                }} 
            >
                <ImgAvatar id = {item.idUserFrom == idUser? item.idUserTo : item.idUserFrom} size={40}/>
            </TouchableOpacity>
            <View style={ getStyles(colorScheme).chatMessageHolder }>
                <View style={[ tStyles.flex1 ]}>
                    <Text style={ getStyles(colorScheme).chatUsername }>{ item.title}</Text>
                    <View style={[ tStyles.row ]}>
                        <Ionicons name='checkmark-done-sharp' size={ 14 } color={ colors.gray50 } />
                        <Text style={ getStyles(colorScheme).chatMessage }>{ ellipString("fsdfsdfd", 30) }</Text>
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