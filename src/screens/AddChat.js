import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Entypo, AntDesign } from '@expo/vector-icons';
import { tStyles, colors } from '../common/theme';
import { useNavigation } from '@react-navigation/native';
import { getStyles } from '../styles/addchat';


const AddChat = ({ navigation }) => {
    const mode = useColorScheme();

    return(
        <SafeAreaView style={ getStyles(mode).container }>
           {/* Top Bar  */}
            <View style={ getStyles(mode).topBarHolder }>
                <View style={[ tStyles.row ]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="arrowleft" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } />
                    </TouchableOpacity>
                    

                    <View style={{ marginLeft: 15 }}>
                        <Text style={ getStyles(mode).topBarMainText }>Select Contact</Text>
                        <Text style={ getStyles(mode).topBarSecText }>50 Contacts</Text>
                    </View>
                </View>

                <View>
                    <TouchableOpacity>
                        <Entypo name='dots-three-vertical' size={ 16 } color={ (mode == 'dark') ? colors.gray30 : null } />
                    </TouchableOpacity>
                </View>
            </View>


            {/* Contacts Listing */}
            <View style={{ paddingHorizontal: 15 }}>
                <FlatList 
                    showsVerticalScrollIndicator={ false }
                    data={[1,2,3,4,5,6,7,8,9,10,11,12]}
                    keyExtractor={ (index) => index }
                    renderItem={ () => <ContactItem /> } 
                    ListHeaderComponent={ <ContactLinks /> }
                    contentContainerStyle={{ paddingBottom: 60 }}
                />
            </View>
            


        </SafeAreaView>
        
    )
}


const ContactLinks = () => {
    const mode = useColorScheme();
    const navigation = useNavigation();

    return(
        <View>
            <View>
                <TouchableOpacity 
                    onPress={ () => navigation.navigate('NewGroup') }
                    style={ getStyles(mode).contactLink }
                >
                    <View style={ getStyles(mode).contactLinkIconHolder }>
                        <AntDesign name='addusergroup' size={ 23 } />
                    </View>
                    <Text style={ getStyles(mode).contactLinkText }>New group</Text>
                </TouchableOpacity>


                <TouchableOpacity style={ getStyles(mode).contactLink }>
                    <View style={ getStyles(mode).contactLinkIconHolder }>
                        <AntDesign name='adduser' size={ 23 } />
                    </View>
                    <Text style={ getStyles(mode).contactLinkText }>New contact</Text>
                </TouchableOpacity>
            
            </View>    

            <Text style={ getStyles(mode).contactsHeading }>Contacts on ChatApp</Text>
        </View>
    )
}


const ContactItem = () => {
    const navigation = useNavigation();
    const mode = useColorScheme();

    return(
        <TouchableOpacity onPress={ () => navigation.navigate('ChatDetails') } style={getStyles(mode).contactContainer}>
            <Image
                source={{ uri: 'http://i.pravatar.cc/320' }}
                style={ getStyles(mode).contactAvatar }
            />

            <View style={[ tStyles.flex1, { marginLeft: 15 } ]}>
                <Text style={ getStyles(mode).contactUser }>Meee</Text>
                <Text style={ getStyles(mode).contactStatus }>Profile Status</Text>
            </View>
        </TouchableOpacity>
    )
}




export default AddChat;