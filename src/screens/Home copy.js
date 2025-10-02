import React from 'react';
import { View, Text, TextInput, Image, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { Fontisto, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tStyles } from '../common/theme';
import { getStyles } from '../styles/home';
import { useNavigation } from '@react-navigation/native';
import SlideOptions from '../components/SlideOptions';
import AppContext from '../context/appContext';
import { displayTime, ellipString } from '../common/helpers';

const Home = ({ navigation }) => {
    const colorScheme = useColorScheme();
    const { options, setOptions } = React.useContext(AppContext);

    const chatData = [
        { id: 1, img: 'http://i.pravatar.cc/300', name: 'My Group', lastMsg: 'This is group message', time: '2024-07-25T13:13:13.016Z', seen: true, unread: 0, group: true },
        { id: 2, img: 'http://i.pravatar.cc/301', name: 'Jason Holder', lastMsg: 'Really long message message Really long message message Really long message message', time: '2024-07-23T13:13:13.016Z', seen: false, unread: 10, group: false },
        { id: 3, img: 'http://i.pravatar.cc/302', name: 'John Doe', lastMsg: 'Really long message message Really long message message Really long message message', time: '2024-07-22T13:13:13.016Z', seen: false, unread: 10, group: false },
        { id: 4, img: 'http://i.pravatar.cc/303', name: 'Marie', lastMsg: 'Really long message message Really long message message Really long message message', time: '2024-07-20T13:13:13.016Z', seen: false, unread: 10, group: false },
        { id: 5, img: 'http://i.pravatar.cc/304', name: 'Alexander', lastMsg: 'Really long message message Really long message message Really long message message', time: '2024-07-18T13:13:13.016Z', seen: false, unread: 10, group: false },
        { id: 6, img: 'http://i.pravatar.cc/305', name: 'John Snow', lastMsg: 'Really long message message Really long message message Really long message message', time: '2024-07-15T13:13:13.016Z', seen: false, unread: 10, group: false },
        { id: 7, img: 'http://i.pravatar.cc/306', name: 'Jamie Carter', lastMsg: 'Really long message message Really long message message Really long message message', time: '2024-07-14T13:13:13.016Z', seen: false, unread: 10, group: false },
        { id: 8, img: 'http://i.pravatar.cc/307', name: 'Russel Arnold', lastMsg: 'Really long message message Really long message message Really long message message', time: '2024-07-14T13:13:13.016Z', seen: false, unread: 10, group: false },
        { id: 9, img: 'http://i.pravatar.cc/308', name: 'Robin', lastMsg: 'Really long message message Really long message message Really long message message', time: '2024-07-14T13:13:13.016Z', seen: false, unread: 10, group: false },
    ];
    const links = [
        { id:1, title: "New group", onPress: () => navigation.navigate('NewGroup') },
        { id:2, title: "New broadcast", onPress: () => navigation.navigate('Broadcast') },
        { id:3, title: "Starred Messages", onPress: () => {} },
        { id:4, title: "Ajustes", onPress: () => navigation.navigate('UserProfile') },
    ];

    return(
        <View style={ getStyles(colorScheme).container }>

            {/* Chat List */}
            <View style={{ paddingHorizontal: 15 }}>
                <FlatList 
                    showsVerticalScrollIndicator={ false }
                    data={ chatData }
                    keyExtractor={ (item) => item.id }
                    renderItem={ ({ item }) => <ChatItem item={ item } /> } 
                    ListHeaderComponent={ <SearchBar /> }
                />
                
            </View>


            {/* Chat Add Button */}
            <TouchableOpacity
                onPress={ () => navigation.navigate('AddChat') }
                style={getStyles(colorScheme).floatingBtn}
            >
                <MaterialCommunityIcons name="message-plus" size={ 20 } />
            </TouchableOpacity>


            {/* Slide Options */}
            { options && <SlideOptions links={ links } setOptions={ setOptions } />}

        </View>
    )
}



const SearchBar = () => {
    const colorScheme = useColorScheme();

    return(
        <>
            <View style={ getStyles(colorScheme).searchBar }>
                <Fontisto name='search' color={ colors.gray50 } size={ 15 } />

                <TextInput 
                    placeholder='Search...'
                    placeholderTextColor={ colors.secondary }
                    style={ getStyles(colorScheme).searchBarInput }
                />
            </View>

            <ChatFilter />
        </>
        
    )
}

const ChatItem = ({ item }) => {
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