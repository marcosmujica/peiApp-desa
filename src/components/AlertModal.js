import React from 'react';
import { View, Text, StyleSheet, Animated, Pressable, useColorScheme, TouchableOpacity } from 'react-native';
import { colors, fonts, tStyles } from '../common/theme';
import AppContext from '../context/appContext';

const AlertModal = ({setModal}) => {
    const { alertTitle, alertDesc, alertOptions = {cancel:false, ok:true}, alertCallback } = React.useContext(AppContext);
    
    const scale = React.useRef(new Animated.Value(0)).current;
    const mode = useColorScheme();

    const backgroundColor = (mode == 'dark') ? colors.darkSecondary : colors.white;
    const color = (mode == 'dark') ? colors.white : colors.gray75;
    const colorSec = (mode == 'dark') ? colors.gray30 : colors.gray50;

    const openModal = () => {
        Animated.timing(scale, {
            toValue: 1,
            duration:0,
            useNativeDriver: true
        }).start();
    }

    const closeModal = (option, callback) => {
        Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true
        }).start(() => { 
            setModal(false);
            callback == undefined ? null : callback(option)
        })
    }

    React.useEffect(() => {
        openModal();
    }, [])

    return(
        <Pressable onPress={ closeModal } style={styles.backdrop}>
            <Pressable style={{ width: '100%' }}>
                <Animated.View style={[styles.modal, { backgroundColor }, { transform: [{ scale }] }]}>
                <Text style={[ fonts.medium, { fontSize: 18, color, marginBottom: 10 } ]}>{ alertTitle }</Text>
                    <Text style={[ fonts.regular, { fontSize: 14, color: colorSec, paddingRight: 20 } ]}>{ alertDesc }</Text>
                    <View style={[ tStyles.row, tStyles.endx, { marginTop: 25 } ]}>
                
                    {alertOptions.cancel && 
                        <TouchableOpacity onPress={()=>closeModal("CANCEL", alertCallback)} style={ [styles.modalActionBtn, { marginRight: 20 }] }>
                            <Text style={ styles.modalActionBtnText }>Cancelar</Text>
                        </TouchableOpacity>
                    }
                    
                    {alertOptions.ok && <TouchableOpacity onPress={()=>closeModal("OK", alertCallback) } style={ styles.modalActionBtn }>
                            <Text style={ styles.modalActionBtnText }>OK</Text>
                        </TouchableOpacity>  
                    }
                    </View>
                </Animated.View>
            </Pressable>
        </Pressable>
    )
}
export default AlertModal;


const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        width: '100%',
        height: '100%',
        paddingHorizontal: 30,
        justifyContent: 'center'
    },
    modal: {
        width: '100%',
        borderRadius: 25,
        paddingVertical: 25,
        paddingHorizontal: 20
    },
    modalActionBtn:{
        paddingVertical: 5
    },
    modalActionBtnText: {
        ...fonts.semibold,
        color: colors.primary
    }
})