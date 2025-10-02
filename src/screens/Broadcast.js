import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Entypo, AntDesign } from '@expo/vector-icons';
import { tStyles, colors } from '../common/theme';
import { getStyles } from '../styles/broadcast';


const Broadcast = ({ navigation }) => {
    const mode = useColorScheme();
    const [selectedContacts, setSelectedContacts] = React.useState([]);

    const broadcastData = [
        {id: 1, name: 'John Doe', uri: 'http://i.pravatar.cc/300', contact: '+1 2513548562'},
        {id: 2, name: 'Jason Smith', uri: 'http://i.pravatar.cc/301', contact: '+1 2513548152'},
        {id: 3, name: 'Jimmy Nerd', uri: 'http://i.pravatar.cc/302', contact: '+1 1253548562'},
        {id: 4, name: 'Gerald', uri: 'http://i.pravatar.cc/303', contact: '+1 2533548562'},
        {id: 5, name: 'John Snow', uri: 'http://i.pravatar.cc/304', contact: '+1 5120548562'},
        {id: 6, name: 'Denarys', uri: 'http://i.pravatar.cc/305', contact: '+1 1123548562'},
        {id: 7, name: 'Jamie Lannister', uri: 'http://i.pravatar.cc/306', contact: '+1 2513548562'},
        {id: 8, name: 'Jonathan', uri: 'http://i.pravatar.cc/307', contact: '+1 2513548562'},
        {id: 9, name: 'David', uri: 'http://i.pravatar.cc/308', contact: '+1 2513548562'},
        {id: 10, name: 'John Mooris', uri: 'http://i.pravatar.cc/309', contact: '+1 2513548562'},
        {id: 11, name: 'John Doe', uri: 'http://i.pravatar.cc/300', contact: '+1 2513548562'},
        {id: 12, name: 'Jason Smith', uri: 'http://i.pravatar.cc/301', contact: '+1 2513548152'},
        {id: 13, name: 'Jimmy Nerd', uri: 'http://i.pravatar.cc/302', contact: '+1 1253548562'},
        {id: 14, name: 'Gerald', uri: 'http://i.pravatar.cc/303', contact: '+1 2533548562'},
        {id: 15, name: 'John Snow', uri: 'http://i.pravatar.cc/304', contact: '+1 5120548562'},     
    ];

    return(
        <SafeAreaView style={ getStyles(mode).container }>
           {/* Top Bar  */}
            <View style={ getStyles(mode).topBarHolder }>
                <View style={[ tStyles.row ]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="arrowleft" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } />
                    </TouchableOpacity>
                    

                    <View style={{ marginLeft: 15 }}>
                        <Text style={ getStyles(mode).topBarMainText }>New Broadcast</Text>
                        <Text style={ getStyles(mode).topBarSecText }>{ selectedContacts.length } of 150 selected</Text>
                    </View>
                </View>

                <View>
                    <TouchableOpacity>
                        <Entypo name='magnifying-glass' size={ 22 } color={ (mode == 'dark') ? colors.gray30 : null } />
                    </TouchableOpacity>
                </View>
            </View>


            {/* Selected Contacts */}
            <View>
                <FlatList 
                    horizontal={ true }
                    showsHorizontalScrollIndicator={ false }
                    data={ selectedContacts }
                    keyExtractor={ (item) => item.id }
                    renderItem={ ({item}) => <SelectedItem item={item} selectedContacts={ selectedContacts } setSelectedContacts={ setSelectedContacts } /> } 
                    contentContainerStyle={{ paddingHorizontal: 15 }}
                />
            </View>
            


            {/* Contacts Listing */}
            <View style={{ paddingHorizontal: 15 }}>
                <FlatList 
                    showsVerticalScrollIndicator={ false }
                    data={broadcastData}
                    keyExtractor={ (item) => item.id }
                    renderItem={ ({ item }) => <ContactItem item={ item } setSelectedContacts={ setSelectedContacts } /> } 
                    ListHeaderComponent={ <Text style={ getStyles(mode).contactsHeading }>Only contacts with +1 5245128570 in thier address book will receive your broadcast messages.</Text> }
                    contentContainerStyle={{ paddingBottom: 60 }}
                />
            </View>


            {/* Continue Button */}
            <TouchableOpacity
                onPress={ () => navigation.navigate('ChatDetails') }
                style={getStyles(mode).floatingBtn}
            >
                <AntDesign name="check" size={ 20 } />
            </TouchableOpacity>

            


        </SafeAreaView>
        
    )
}


const ContactItem = ({ setSelectedContacts, item }) => {
    const mode = useColorScheme();

    return(
        <TouchableOpacity onPress={ () => setSelectedContacts((prev) => [...prev, item])  } style={getStyles(mode).contactContainer}>
            <Image
                source={{ uri: item.uri }}
                style={ getStyles(mode).contactAvatar }
            />

            <View style={[ tStyles.flex1, { marginLeft: 15 } ]}>
                <Text style={ getStyles(mode).contactUser }>{ item.name }</Text>
                <Text style={ getStyles(mode).contactStatus }>{ item.contact }</Text>
            </View>
        </TouchableOpacity>
    )
}


const SelectedItem = ({ selectedContacts, setSelectedContacts, item }) => {
    const mode = useColorScheme();
    const remove = () => {
        setSelectedContacts((prev) => {
            let arr = [...prev];
            return [...arr.slice(0, selectedContacts.length-1), ...arr.slice(selectedContacts.length)]
        })
    }

    return(
        <TouchableOpacity onPress={ remove } style={getStyles(mode).selectedContact}>
            <View style={ getStyles(mode).linkIconHolder }>
                <Image
                    source={{ uri: item.uri }}
                    style={ getStyles(mode).linkAvatar }
                />
                <View style={getStyles(mode).avatarHolder}>
                    <AntDesign name='closecircle' size={ 16 }  color={ colors.gray30 }  />
                </View>
            </View>

            <Text style={ getStyles(mode).selectedUser }>{ item.name }</Text>
        </TouchableOpacity>
    )
}




export default Broadcast;