import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Entypo, AntDesign } from '@expo/vector-icons';
import { tStyles, colors, fonts } from '../common/theme';
import { useNavigation } from '@react-navigation/native';
import { getStyles } from '../styles/addchat';


const InviteFriend = ({ navigation }) => {
    const mode = useColorScheme();

    return(
        <SafeAreaView style={ getStyles(mode).container }>
           {/* Top Bar  */}
            <View style={ getStyles(mode).topBarHolder }>
                <View style={[ tStyles.row ]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="arrowleft" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } />
                    </TouchableOpacity>
                    

                    <View style={{ marginLeft: 15, paddingVertical: 10 }}>
                        <Text style={ getStyles(mode).topBarMainText }>Invite a Friend</Text>
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
            <TouchableOpacity 
                onPress={ () => navigation.navigate('NewGroup') }
                style={ getStyles(mode).contactLink }
            >
                <View style={ getStyles(mode).contactLinkIconHolder }>
                    <AntDesign name='sharealt' size={ 23 } />
                </View>
                <Text style={ getStyles(mode).contactLinkText }>Share Link</Text>
            </TouchableOpacity>    

            <Text style={ getStyles(mode).contactsHeading }>Phone Contacts</Text>
        </View>
    )
}


const ContactItem = () => {
    const navigation = useNavigation();
    const mode = useColorScheme();

    return(
        <TouchableOpacity style={getStyles(mode).contactContainer}>
            <Image
                source={{ uri: 'http://i.pravatar.cc/320' }}
                style={ getStyles(mode).contactAvatar }
            />

            <View style={[ tStyles.spacedRow, tStyles.flex1 ]}>
                <View style={[ tStyles.flex1, { marginLeft: 15 } ]}>
                    <Text style={ getStyles(mode).contactUser }>Meee</Text>
                    <Text style={ getStyles(mode).contactStatus }>+91 9562315265</Text>
                </View>

                <TouchableOpacity style={{ padding: 10}}>
                    <Text style={[ fonts.semibold, { color: colors.primary } ]}>Invite</Text>
                </TouchableOpacity>
            </View>
            
        </TouchableOpacity>
    )
}




export default InviteFriend;