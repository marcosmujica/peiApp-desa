import React , {useEffect, useState} from 'react';
import { View,Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CountryCodeDropdownPicker from 'react-native-dropdown-country-picker'
import { colors, fonts, tStyles } from '../common/theme';
import  "../commonApp/global"
import { db_setOTP} from '../commonApp/database';
import AppContext from '../context/appContext';
import Loading from '../components/Loading';
import { getStyles } from "../styles/home";
import { setProfile, getProfile } from '../commonApp/profile';
import { getPhoneCodeByCountryId, getCountryCodeByIP } from '../commonApp/functions';

const Login = ({ navigation }) => {

    const mode = useColorScheme();
    const  {showAlertModal} = React.useContext(AppContext);
    const [selected, setSelected] = React.useState('+91');
    const [country, setCountry] = React.useState({});
    const [phone, setPhone] = React.useState('');
    const [loading, setLoading] = React.useState('');

     useEffect(() => {
        solveCountry()
        return () => {
            console.log('🧹 Componente desmontado');
            // Esto se ejecuta cuando el componente se va de pantalla
        };
    }, []); // 

    async function solveCountry()
    {
        setLoading (true)
        let countryCode = await getCountryCodeByIP ()
        let countryInfo = (getPhoneCodeByCountryId (countryCode))
        setSelected (countryInfo.code)
        setCountry ({code: countryCode, flag:countryCode, dial_code: countryInfo.code, name: countryInfo.name })
        setLoading (false)
    }

    async function onNextStep()
    {
        try{
            { 
                const regex = /^[0-9]*$/;
                if (regex.test(phone))
                {  
                    console.log (country.name)
                    if (country.code === undefined)
                    {
                        showAlertModal("Atención", "Por favor selecciona tu país"); 
                        return
                    }
                    setLoading (true)
                    
                    try {
                        let aux = getProfile()

                        aux.phone = phone
                        aux.phonePrefix  = country.dial_code
                        aux.countryCode = country.code
                        aux.countryName = country.name
                        aux.phone = country.dial_code + phone /// saco los 0 de la izquierda

                        await setProfile(aux)
                        await db_setOTP (aux.phone)
                        navigation.navigate('OTPScreen')
                        setLoading (false)
                    }
                    catch (e) {console.log (e)}
                }
                else 
                {
                    showAlertModal("Atención", "Por favor ingresa un número válido"); 
                    return
                }
            }
        }
        catch (e) {console.log (e)}
        
    }

    return(
        <SafeAreaView style={getStyles(mode).container}>
            <Loading loading={loading} title=""/>
            <KeyboardAvoidingView behavior='padding' style={[ tStyles.flex1 ]}>
                <View style={[ tStyles.centery, { paddingVertical: 35 } ]}>
                    <Text style={[getStyles(mode).activeText, {textAlign:"center"}]}>Ingresa tu número de móvil</Text>
                </View>

                <View style={{ paddingHorizontal: 35, marginTop: 20 }}>
                    <Text style={[getStyles(mode).subNormalText, {textAlign:"center"}]}>Necesitamos verificar tu número.</Text>
                </View>

                
                <View style={[ tStyles.flex1, { marginTop: 30, paddingHorizontal: 15 }]}>
                    <Text style={[getStyles(mode).normalText, {textAlign:"center",marginBottom: 10 }]}>{ country.name }</Text>
                    
                    <CountryCodeDropdownPicker 
                        selected={selected} 
                        setSelected={setSelected}
                        setCountryDetails={setCountry} 
                        phone={phone} 
                        setPhone={setPhone} 
                        phoneStyles={[getStyles(mode).searchBarInput, {height:40}]}
                        countryCodeTextStyles={getStyles(mode).subNormalText}
                        dropdownTextStyles={getStyles(mode).subNormalText}
                        
                        
                    />
                </View>
                <View style={{ paddingHorizontal: 15, marginBottom: 15, display: phone.length > 4 ? 'block' : 'none'}}>
                    <TouchableOpacity style={getStyles(mode).agreeBtn} onPress={() => onNextStep()}>
                        <Text style={[ fonts.medium, { color: colors.white, fontSize: 13 }  ]}>Siguiente</Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
            
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

export default Login;