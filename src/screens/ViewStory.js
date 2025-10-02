import React from 'react';
import { View, Text, Animated, Easing, ImageBackground, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { colors, tStyles, fonts } from '../common/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const ViewStory = ({ navigation }) => {
    const images = [
        'https://siteimages.simplified.com/blog/image-1-1-56.png?auto=compress&fm=png', 
        'https://siteimages.simplified.com/blog/image4-1-9.png?auto=compress&fm=png', 
        'https://siteimages.simplified.com/blog/image2-1-7.png?auto=compress&fm=png'
    ];

    const [current, setCurrent] = React.useState(0);

    React.useEffect(() => {
        let int = setInterval(() => {
            setCurrent((prev) => prev+1)
        }, 5000)

        return () => {
            clearInterval(int)
        }
    }, [])

    React.useEffect(() => {
        if(current == images.length) navigation.goBack();
    }, [current])

    return(
        <SafeAreaView style={ styles.container }>
            
            <ImageBackground
                source={{ uri: images[current] }}
                style={{ width: '100%', height: '100%' }}
                resizeMode='contain'
            >
                {/* Status Progress Bars */}
                <View style={[ tStyles.row, tStyles.starty ]}>
                    {
                        images.map((image, index) =>(
                            <Progress index={ index } current={ current } key={ index } />
                        ))
                    }
                </View>

                {/* User Details */}
                <View style={[ tStyles.row, { paddingHorizontal: 15, paddingVertical: 20 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="arrowleft" size={ 20 } color={ colors.white } />
                    </TouchableOpacity>

                    <Image
                        source={{ uri: 'http://i.pravatar.cc/302' }}
                        style={ styles.avatar }
                    />

                    <View style={{ marginLeft: 15 }}>
                        <Text style={[ fonts.medium, { color: colors.white, fontSize: 16 } ]}>Mee</Text>
                        <Text style={[ fonts.regular, { color: colors.white, fontSize: 12 } ]}>Yesterday, 4:30 pm</Text>
                    </View>
                </View>
                
            </ImageBackground>
            
        </SafeAreaView>
        
    )
}

const Progress = ({ index, current }) => {
    const width = React.useRef(new Animated.Value(0)).current;

    const animate = () => {
        width.setValue(0)

        Animated.timing(width, {
            toValue: 1,
            duration: 5000,
            easing: Easing.ease,
            useNativeDriver: false
        }).start();
    }

    React.useEffect(() => {
        animate()
    }, [current])

    return(
        <View style={ styles.progressContainer }>
            {
                (index == current)
                ?
                    <Animated.View 
                        style={[
                            styles.progress,
                            {
                                width: width.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%']
                                }) 
                            }
                        ]} 
                    />
                :
                    (index < current)
                    &&
                    <View style={[styles.progress, { width: '100%' }]} />
            }
            
            
        </View>
        
    )
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.dark,
        ...tStyles.flex1
    },
    progressContainer: {
        height:3, 
        flex:1, 
        marginRight: 3, 
        borderRadius: 5, 
        backgroundColor: colors.gray50
    },
    progress: {
        height: '100%', 
        backgroundColor:'white', 
        borderRadius: 5 
    },
    avatar: {
        width: 45, 
        height: 45, 
        borderRadius: 25,
        marginLeft: 10
    }
})

export default ViewStory;