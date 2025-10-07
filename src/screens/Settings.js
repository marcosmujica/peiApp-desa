import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, useColorScheme, ScrollView } from 'react-native';
import { Entypo, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, tStyles } from '../common/theme';
import { useNavigation } from '@react-navigation/native';
import SlideOptions from '../components/SlideOptions';
import AppContext from '../context/appContext';
import { getStyles } from '../styles/settings';
import Hr from '../components/Hr';


const Settings = ({ navigation }) => {
    const mode = useColorScheme();
    const { options, setOptions, showAlertModal } = React.useContext(AppContext);
    const links = [
        { id:1, title: "Clear call log", onPress: () => {} },
        { id:2, title: "Settings", onPress: () => {} },
    ];

    return(
        <View style={ getStyles(mode).container }>
            <ScrollView 
                showsVerticalScrollIndicator={ false }
            >
                {/* Profile Details */}
                <TouchableOpacity onPress={() => navigation.navigate('MyProfile')} style={ getStyles(mode).profileHolder }>

                    <Image
                        source={{ uri: 'http://i.pravatar.cc/320' }}
                        style={ getStyles(mode).profileAvatar }
                    />

                    <View>
                        <Text style={ getStyles(mode).profileName }>Geek Sparks</Text>
                        <Text style={ getStyles(mode).profileStatus }>Spark up your development</Text>
                    </View>
                </TouchableOpacity>

                <Hr size={ 1 } color={ (mode == 'dark') ? colors.gray75 : colors.gray5 } />


                {/* Setting Options */}
                <View style={{ paddingHorizontal: 15 }}>

                    <TouchableOpacity onPress={() => navigation.navigate('AccountSettings')} style={ getStyles(mode).settingsLink }>
                        <View style={{ width: 45 }}>
                            <MaterialCommunityIcons name='key-outline' size={ 22 } color={ (mode == 'dark') ? colors.gray30 : colors.gray50 } />
                        </View>

                        <View style={ getStyles(mode).settingsTextHolder }>
                            <Text style={ getStyles(mode).settingMainText }>Account</Text>
                            <Text style={ getStyles(mode).settingSecText }>Security notifications, change number</Text>
                        </View>
                    </TouchableOpacity>


                    <TouchableOpacity onPress={() => navigation.navigate('PrivacySettings')} style={ getStyles(mode).settingsLink }>
                        <View style={{ width: 45 }}>
                            <MaterialCommunityIcons name='lock-outline' size={ 22 } color={ (mode == 'dark') ? colors.gray30 : colors.gray50 } />
                        </View>

                        <View style={ getStyles(mode).settingsTextHolder }>
                            <Text style={ getStyles(mode).settingMainText }>Privacy</Text>
                            <Text style={ getStyles(mode).settingSecText }>Block contacts, privacy</Text>
                        </View>
                    </TouchableOpacity>  


                    <TouchableOpacity style={ getStyles(mode).settingsLink }>
                        <View style={{ width: 45 }}>
                            <MaterialCommunityIcons name='message-reply-text-outline' size={ 22 } color={ (mode == 'dark') ? colors.gray30 : colors.gray50 } />
                        </View>

                        <View style={ getStyles(mode).settingsTextHolder }>
                            <Text style={ getStyles(mode).settingMainText }>Chats</Text>
                            <Text style={ getStyles(mode).settingSecText }>Theme, wallpapaers, chat history</Text>
                        </View>
                    </TouchableOpacity> 


                    <TouchableOpacity style={ getStyles(mode).settingsLink }>
                        <View style={{ width: 45 }}>
                            <MaterialCommunityIcons name='bell-outline' size={ 22 } color={ (mode == 'dark') ? colors.gray30 : colors.gray50 } />
                        </View>

                        <View style={ getStyles(mode).settingsTextHolder }>
                            <Text style={ getStyles(mode).settingMainText }>Notifications</Text>
                            <Text style={ getStyles(mode).settingSecText }>Message, group and call tones</Text>
                        </View>
                    </TouchableOpacity>


                    <TouchableOpacity onPress={() => navigation.navigate('Information')} style={ getStyles(mode).settingsLink }>
                        <View style={{ width: 45 }}>
                            <MaterialCommunityIcons name='file-document-outline' size={ 22 } color={ (mode == 'dark') ? colors.gray30 : colors.gray50 } />
                        </View>

                        <View style={ getStyles(mode).settingsTextHolder }>
                            <Text style={ getStyles(mode).settingMainText }>Terms of Service</Text>
                            <Text style={ getStyles(mode).settingSecText }>Our terms of service details</Text>
                        </View>
                    </TouchableOpacity>  


                    <TouchableOpacity onPress={() => navigation.navigate('HelpCenter')} style={ getStyles(mode).settingsLink }>
                        <View style={{ width: 45 }}>
                            <MaterialCommunityIcons name='help-circle-outline' size={ 22 } color={ (mode == 'dark') ? colors.gray30 : colors.gray50 } />
                        </View>

                        <View style={ getStyles(mode).settingsTextHolder }>
                            <Text style={ getStyles(mode).settingMainText }>Help center</Text>
                            <Text style={ getStyles(mode).settingSecText }>Raise a ticket here</Text>
                        </View>
                    </TouchableOpacity>    


                     <TouchableOpacity onPress={() => navigation.navigate('AppInfo')} style={ getStyles(mode).settingsLink }>
                        <View style={{ width: 45 }}>
                            <MaterialCommunityIcons name='information-outline' size={ 22 } color={ (mode == 'dark') ? colors.gray30 : colors.gray50 } />
                        </View>

                        <View style={ getStyles(mode).settingsTextHolder }>
                            <Text style={ getStyles(mode).settingMainText }>App info</Text>
                            <Text style={ getStyles(mode).settingSecText }>Information regarding our app</Text>
                        </View>
                    </TouchableOpacity> 


                    <TouchableOpacity onPress={() => navigation.navigate('InviteFriend')} style={ getStyles(mode).settingsLink }>
                        <View style={{ width: 45 }}>
                            <MaterialCommunityIcons name='share-variant-outline' size={ 22 } color={ (mode == 'dark') ? colors.gray30 : colors.gray50 } />
                        </View>

                        <View style={ getStyles(mode).settingsTextHolder }>
                            <Text style={ getStyles(mode).settingMainText }>Invite</Text>
                            <Text style={ getStyles(mode).settingSecText }>Invite a friend to ChatApp</Text>
                        </View>
                    </TouchableOpacity>      

                </View>


            </ScrollView>

            {/* Slide Options */}
            { options && <SlideOptions links={ links } setOptions={ setOptions } />}

        </View>
    )
}



export default Settings;