import React from 'react';
import { View, Text, Image, TouchableOpacity, useColorScheme } from 'react-native';
import { colors } from '../common/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { getStyles } from '../styles/calling';


const Calling = ({ navigation }) => {
    const mode = useColorScheme();

    return(
        <SafeAreaView edges={[ 'top', 'right', 'left' ]} style={getStyles(mode).container}>
            <View style={ getStyles(mode).callDetailsHolder }>
                <Image
                    source={{ uri: 'http://i.pravatar.cc/320' }}
                    style={ getStyles(mode).callAvatar }
                />

                <Text style={ getStyles(mode).callUser }>Meee</Text>
                <Text style={ getStyles(mode).callDetail }>Calling</Text>
            </View>


            {/* Bototm Controls */}
            <View style={getStyles(mode).bottomControls}>
                <TouchableOpacity>
                    <Feather name='volume-2' color={ colors.white } size={ 25 } />
                </TouchableOpacity>


                <TouchableOpacity>
                    <Feather name='video' color={ colors.white } size={ 25 } />
                </TouchableOpacity>


                <TouchableOpacity>
                    <Feather name='mic-off' color={ colors.white } size={ 25 } />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={ getStyles(mode).endBtn }>
                    <MaterialCommunityIcons name='phone-hangup-outline' color={ colors.white } size={ 25 } />
                </TouchableOpacity>    

            </View>
        </SafeAreaView>
    )
}


export default Calling;