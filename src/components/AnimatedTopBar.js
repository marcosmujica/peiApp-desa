import React from 'react';
import { View, useWindowDimensions, useColorScheme, Platform, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, Extrapolation, interpolate } from 'react-native-reanimated';
import { AntDesign } from '@expo/vector-icons';
import { getStyles } from '../styles/common';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../common/theme';


const AnimatedTopBar = ({ scroll, scrollOffset, uri, name }) => {
    const navigation = useNavigation();
    const mode = useColorScheme();
    const { width } = useWindowDimensions();


    const animatePicture = useAnimatedStyle(() => {
        const yValue = Platform.OS === 'ios' ? (1.4 * 54) : (1.7 * 45);
        const translateY = interpolate(scroll.value, [0, scrollOffset], [0, -yValue], Extrapolation.CLAMP)

        const xValue = width/2 - 30 - 26;
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
            <View style={ getStyles(mode).topBarHolder }>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <AntDesign name="arrowleft" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } />
                </TouchableOpacity>  

                <Animated.Text style={ [getStyles(mode).topBarMainText, animateName] }>{ name }</Animated.Text>   
            </View>
            
            <Animated.Image
                source={{ uri }}
                style={ [getStyles(mode).avatar, animatePicture] }
            />
        </>
    )
}
export default AnimatedTopBar;