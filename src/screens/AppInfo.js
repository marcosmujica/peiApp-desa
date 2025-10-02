import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { AntDesign, Fontisto } from '@expo/vector-icons';
import { colors, tStyles } from '../common/theme';
import { getStyles } from '../styles/appinfo';
import { SafeAreaView } from 'react-native-safe-area-context';



const AppInfo = ({ navigation }) => {
    const mode = useColorScheme();
    

    return(
        <SafeAreaView style={ getStyles(mode).container }>
            {/* Top Bar */}
            <View style={ getStyles(mode).topBarHolder }>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <AntDesign name="arrowleft" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } />
                </TouchableOpacity>
            </View>

            <View style={[ tStyles.flex1, tStyles.centerx, tStyles.centery ]}>
                <Text style={ getStyles(mode).appName }>peiApp</Text>
                <Text style={ getStyles(mode).appVersion }>Version 3.0.0</Text>

                <Fontisto name="hipchat" size={70} color={ colors.primary } />

                <Text style={ [getStyles(mode).appVersion, { marginTop: 35 }] }>© 2025 peiApp</Text>
            </View>

        </SafeAreaView>
    )
}




export default AppInfo;