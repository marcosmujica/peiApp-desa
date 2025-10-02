import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import { getStyles } from '../styles/settings';
import { colors, tStyles, fonts } from '../common/theme';
import SettingLinkItem from '../components/SettingLinkItem';



const HelpCenter = ({ navigation }) => {
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
                        <Text style={ getStyles(mode).topBarMainText }>Contact Us</Text>
                    </View>
                </View>
            </View>

            {/* Setting Links */}
            <View style={{ paddingHorizontal: 15, marginTop: 20 }}>
                <TextInput
                    placeholder='Tell us how we can help'
                    multiline={ true }
                    style={ getStyles(mode).helpTextArea }
                    placeholderTextColor={ colors.gray30 }
                />

                <Text style={ getStyles(mode).helpInfoText }>
                    By clicking next, you acknowledge ChatApp may review
                    diagnostic and performance information and metadata associated
                    with your account to try to troubleshoot and solve your
                    reported issue.
                </Text>


                <View style={[ tStyles.endy, { marginTop: 30 } ]}>
                    <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.primary }}>
                        <Text style={[ fonts.medium, { fontSize: 13} ]}>Submit</Text>
                    </TouchableOpacity>
                </View>
            </View>
        
        </SafeAreaView>
    )
}
export default HelpCenter;