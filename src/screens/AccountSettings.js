import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Entypo, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { getStyles } from '../styles/settings';
import { colors, tStyles } from '../common/theme';
import SettingLinkItem from '../components/SettingLinkItem';



const AccountSettings = ({ navigation }) => {
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
                        <Text style={ getStyles(mode).topBarMainText }>Account Settings</Text>
                    </View>
                </View>
            </View>

            {/* Setting Links */}
            <View style={{ paddingHorizontal: 15, marginTop: 5 }}>
                <SettingLinkItem onPress={() => {}} icon="shield-alt" title="Security notifications" />
                <SettingLinkItem onPress={() => {}} icon="key" title="Passkeys" />
                <SettingLinkItem onPress={() => {}} icon="envelope" title="Email address" />
                <SettingLinkItem onPress={() => {}} icon="user-plus" title="Add Account" />
                
            </View>
        
        </SafeAreaView>
    )
}
export default AccountSettings;