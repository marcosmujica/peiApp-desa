import React from 'react';
import { View, Text } from 'react-native';

const Hr = ({ size=1, color="#7F7F7F"}) => {
    return(
        <View style={{ width: '100%', height: size, backgroundColor: color }}></View>
    )
}


export default Hr;