import React, { useState } from 'react';
import { View, useWindowDimensions, useColorScheme, Platform, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, Extrapolation, interpolate } from 'react-native-reanimated';
import { AntDesign, Feather, Fontisto } from '@expo/vector-icons';
import { getStyles } from '../styles/common';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../common/theme';

// Crear un TouchableOpacity animado
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const AnimatedTopBar = ({ scroll, scrollOffset, uri, name, onImagePress }) => {
    const navigation = useNavigation();
    const mode = useColorScheme();
    const { width } = useWindowDimensions();
    const [imageError, setImageError] = useState(false);

    // Imagen por defecto
    const defaultImage = require('../assets/avatar/user.png');


    const animatePicture = useAnimatedStyle(() => {
        // Ajuste para alinear la imagen pequeña con el título y botón de back en el topBar
        // Necesitamos que suba desde top:80 hasta la línea del topBar
        const yValue = Platform.OS === 'ios' ? 68 : 62;
        const translateY = interpolate(scroll.value, [0, scrollOffset], [0, -yValue], Extrapolation.CLAMP)

        // Ajustado para mover más a la derecha (aumentando el valor negativo)
        const xValue = width/2 - 30 - 38;
        const translateX = interpolate(scroll.value, [0, scrollOffset], [0, -xValue], Extrapolation.CLAMP)
        
        const scale = interpolate(scroll.value, [0, scrollOffset], [1, 0.3], Extrapolation.CLAMP)
        
        return {
            transform: [{ translateY }, { translateX }, { scale }]
        }
    });

    const animateName = useAnimatedStyle(() => {
        const opacity = interpolate(scroll.value, [0, 100, scrollOffset], [0, 0, 1], Extrapolation.CLAMP)
        const translateX = interpolate(scroll.value, [0, scrollOffset], [-30, 0], Extrapolation.CLAMP);
        const translateY = interpolate(scroll.value, [0, scrollOffset], [30, 0], Extrapolation.CLAMP);

        return {
            opacity, transform: [{ translateX }, { translateY }]
        }
    })

    return(
        <>
            <View style={ [getStyles(mode).topBarHolder, { overflow: 'visible' }] }>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } style={{padding:10}} />
                </TouchableOpacity>  

                <Animated.Text style={ [getStyles(mode).topBarMainText, animateName] }>{ name }</Animated.Text>   
            </View>
            
            <AnimatedTouchable 
                activeOpacity={0.8}
                onPress={() => onImagePress && onImagePress()}
                style={[getStyles(mode).avatar, animatePicture]}
            >
                <Animated.Image
                    source={imageError || !uri ? defaultImage : { uri }}
                    style={{ width: 120, height: 120, borderRadius: 60 }}
                    resizeMode="cover"
                    onError={() => {
                        console.log("❌ Error al cargar imagen, mostrando imagen por defecto");
                        setImageError(true);
                    }}
                />
            </AnimatedTouchable>
        </>
    )
}
export default AnimatedTopBar;