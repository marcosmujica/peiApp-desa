import React from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, useColorScheme } from 'react-native';
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
        <TouchableWithoutFeedback onPress={() => setOptions(false)}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback>
                    <Animated.View style={ [getStyles(mode).slideOptionsContainer, { top }] }>
                        {
                            links.map((item) => (
                                <TouchableOpacity onPress={ () => {setOptions(false); item.onPress()}} style={ styles.link } key={ item.id }>
                                    <Text style={getStyles(mode).slideOptionsText}>{ item.title }</Text>
                                </TouchableOpacity>
                            ))
                        }
                        
                    </Animated.View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
    )
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999
    },
    link: {
        paddingVertical: 10
    }
})

export default SlideOptions;