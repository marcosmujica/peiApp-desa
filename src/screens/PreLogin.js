import React, { useEffect, useState} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, tStyles } from '../common/theme';
import { getStyles } from "../styles/home";
import  "../commonApp/global"

const PreLogin = ({ navigation }) => {
    const mode = useColorScheme();
    const [loading, setLoading] = React.useState (false)

    return(
        <SafeAreaView style={getStyles(mode).container}>

      {/* Componente de overlay */}
      
     <View style={[ tStyles.centery, { marginTop: 30 } ]}>
                {/*<LottieView 
                    source={ require('../assets/animations/prelogin.json') }
                    style={{ width: '100%', height: 300 }}
                    autoPlay={ false }
                />*/}
            </View>



            <View style={[ tStyles.centery, tStyles.flex1, { paddingHorizontal: 15 } ]}>
                <Text style={[getStyles(mode).screenTitle ]}>Bienvenido a peiApp</Text>
                <Text style={[getStyles(mode).subNormalText, {textAlign:"center"}]}>
                    {`\n`}{`\n`}
                    Lee nuestra <Text style={{ color: '#0096FF' }}>Política de privacidad de datos.</Text> 
                    {`\n`}
                    {`\n`}
                    {`\n`}Al presionar "De acuerdo y continuar" estas aceptando nuestros   
                    <Text style={{ color: '#0096FF' }}> Términos y condiciones del servicio.</Text>
                </Text>
            </View>


            {/* Agree Button */}
            <View style={{ paddingHorizontal: 15, marginBottom: 15 }}>
                <TouchableOpacity style={getStyles(mode).agreeBtn} onPress={() => navigation.navigate('Login')} >
                    <Text style={[ fonts.medium, { color: colors.white, fontSize: 13 }  ]}>De acuerdo y continuar</Text>
                </TouchableOpacity>
            </View>
            
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    agreeBtn: {
        width: '100%',
        backgroundColor: colors.primary,
        ...tStyles.centery,
        paddingVertical: 12,
        borderRadius: 30
    }
})

export default PreLogin;