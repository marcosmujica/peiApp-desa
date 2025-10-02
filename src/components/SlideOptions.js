import React from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { fonts } from '../common/theme';
import { getStyles } from '../styles/common';

const SlideOptions = ({ links, setOptions }) => {
    const top = React.useRef(new Animated.Value(-100)).current;
    const mode = useColorScheme();
    

    const animate = () => {
        Animated.timing(top, {
            toValue: 2,
            duration: 300,
            useNativeDriver: false
        }).start();
    }


    React.useEffect(() => {
        animate()
    }, []) 


    return(
        <Animated.View style={ [getStyles(mode).slideOptionsContainer, { top }] }>
            {
                links.map((item) => (
                    <TouchableOpacity onPress={ () => {setOptions(false); item.onPress()}} style={ styles.link } key={ item.id }>
                        <Text style={getStyles(mode).slideOptionsText}>{ item.title }</Text>
                    </TouchableOpacity>
                ))
            }
            
        </Animated.View>
    )
}

const styles = StyleSheet.create({
 
    link: {
        paddingVertical: 10
    }
})

export default SlideOptions;