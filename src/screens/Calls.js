import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { Entypo, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, tStyles } from '../common/theme';
import { useNavigation } from '@react-navigation/native';
import SlideOptions from '../components/SlideOptions';
import AppContext from '../context/appContext';
import { getStyles } from '../styles/calls';


const Calls = () => {
    const mode = useColorScheme();
    const { options } = React.useContext(AppContext);
    const links = [
        { id:1, title: "Clear call log", onPress: () => {} },
        { id:2, title: "Settings", onPress: () => {} },
    ];

    return(
        <View style={ getStyles(mode).container }>

            
            {/* Calls Listing */}
            <View style={{ paddingHorizontal: 15 }}>
                <FlatList 
                    showsVerticalScrollIndicator={ false }
                    data={[1,2,3,4,5,6,7,8,9,10]}
                    keyExtractor={ (index) => index }
                    renderItem={ () => <CallItem /> } 
                    ListHeaderComponent={ <CallLink /> }
                />
                
            </View>

            


            {/* Add Call Button */}
            <TouchableOpacity
                style={getStyles(mode).floatingBtn}
            >
                <MaterialIcons name="add-call" size={ 20 } />
            </TouchableOpacity>


            {/* Slide Options */}
            { options && <SlideOptions links={ links } />}

        </View>
    )
}



const CallLink = () => {
    const mode = useColorScheme();

    return(
        <>
            <TouchableOpacity style={ getStyles(mode).callLink }>
                <View style={ getStyles(mode).linkIconHolder }>
                    <Entypo name='link' size={ 25 } />
                </View>
                

                <View style={{ marginLeft: 12 }}>
                    <Text style={ getStyles(mode).linkMainText }>Create meeting link</Text>
                    <Text style={ getStyles(mode).linkSecText }>Share a link for starting a meeting</Text>
                </View>
            </TouchableOpacity>

            <Text style={ getStyles(mode).callHeading }>Recent</Text>
        </>
        
    )
}

const CallItem = () => {
    const mode = useColorScheme();
    const navigation = useNavigation();

    return(
        <TouchableOpacity onPress={() => navigation.navigate('Calling')} style={getStyles(mode).callContainer}>
            <Image
                source={{ uri: 'http://i.pravatar.cc/308' }}
                style={ getStyles(mode).callAvatar }
            />


            <View style={ getStyles(mode).callMainHolder }>
                <View style={[ tStyles.flex1 ]}>
                    <Text style={ getStyles(mode).callUser }>Meee</Text>
                    <View style={[ tStyles.row ]}>
                        <MaterialIcons name='arrow-outward' size={ 18 } color={ colors.primary } />
                        <Text style={ getStyles(mode).callTime }>1 minute ago</Text>
                    </View>
                </View>

                <Ionicons name="call-outline" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } />
            </View>
        </TouchableOpacity>
    )
}


export default Calls;