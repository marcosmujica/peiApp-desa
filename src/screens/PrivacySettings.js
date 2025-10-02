import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Entypo, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { getStyles } from '../styles/settings';
import { colors, tStyles } from '../common/theme';
import SettingLinkItem from '../components/SettingLinkItem';



const PrivacySettings = ({ navigation }) => {
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
                        <Text style={ getStyles(mode).topBarMainText }>Privacy Settings</Text>
                    </View>
                </View>
            </View>

            {/* Setting Links */}
            <View style={{ paddingHorizontal: 15, marginTop: 5 }}>
                <SettingLinkItem onPress={() => {}} icon="hourglass" title="Last seen" />
                <SettingLinkItem onPress={() => {}} icon="image" title="Profile photo" />
                <SettingLinkItem onPress={() => {}} icon="file-alt" title="About" />
                <SettingLinkItem onPress={() => {}} icon="check-double" title="Status" />
                
            </View>
        
        </SafeAreaView>
    )
}
export default PrivacySettings;