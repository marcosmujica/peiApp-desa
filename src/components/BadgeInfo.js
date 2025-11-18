import React from "react";
import { View, Text, StyleSheet, Animated, Pressable, useColorScheme, TouchableOpacity } from 'react-native';
import { colors, tStyles } from '../common/theme';
import { getStyles } from '../styles/home';
import ImgAvatar from '../components/ImgAvatar';
import { FlatList } from "react-native-gesture-handler";
const BadgeInfo = ({title="", img=""}) => {
    const mode = useColorScheme();

    return (
        <View style={[getStyles(mode).titleBadge, { flexDirection: 'row', margin:5, alignItems: 'center', paddingHorizontal:10 }]}>
            <ImgAvatar id={img} cache={true} size="30" detail={false}/>
            <Text style={[getStyles(mode).subNormalText, {paddingLeft:5, fontWeight: "bold"}]}>{title}</Text>
        </View>
    );
}

export default BadgeInfo;
