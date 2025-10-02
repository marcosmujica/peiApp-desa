import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../common/theme';
import { getStyles } from '../styles/settings';


const SettingLinkItem = ({ icon, title, onPress }) => {
    const mode = useColorScheme();

    return(
        <TouchableOpacity onPress={onPress} style={ getStyles(mode).settingsLink }>
            <View style={{ width: 42 }}>
                <FontAwesome5 name={ icon } size={ 19 } color={ (mode == 'dark') ? colors.gray30 : colors.gray50 } />
            </View>

            <View style={ getStyles(mode).settingsTextHolder }>
                <Text style={ getStyles(mode).settingMainText }>{ title }</Text>
            </View>
        </TouchableOpacity>
    )
}
export default SettingLinkItem;