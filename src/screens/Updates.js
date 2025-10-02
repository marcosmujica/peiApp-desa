import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { colors, tStyles } from '../common/theme';
import SlideOptions from '../components/SlideOptions';
import AppContext from '../context/appContext';
import StatusDashed from '../components/StatusDashed';
import { getStyles } from '../styles/updates';
import { useNavigation } from '@react-navigation/native';


const Updates = () => {
    const mode = useColorScheme();
    const { options } = React.useContext(AppContext);
    const links = [
        { id:1, title: "Status privacy", onPress: () => {} },
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
                    renderItem={ () => <StatusItem /> } 
                    ListHeaderComponent={ <StatusLink /> }
                />
                
            </View>


            {/* Add Call Button */}
            <TouchableOpacity
                style={ getStyles(mode).floatingBtn }
            >
                <Entypo name="camera" size={ 20 } />
            </TouchableOpacity>


            {/* Slide Options */}
            { options && <SlideOptions links={ links } />}

        </View>
    )
}



const StatusLink = () => {
    const mode = useColorScheme();

    return(
        <>
            <TouchableOpacity style={ getStyles(mode).statusLink }>
                <View style={ getStyles(mode).linkIconHolder }>
                    <Image
                        source={{ uri: 'http://i.pravatar.cc/302' }}
                        style={ getStyles(mode).linkAvatar }
                    />
                    <View style={getStyles(mode).avatarHolder}>
                        <AntDesign name='pluscircle' size={ 18 }  color={ colors.primary }  />
                    </View>
                    
                </View>
                

                <View style={{ marginLeft: 15 }}>
                    <Text style={ getStyles(mode).linkMainText }>My Status</Text>
                    <Text style={ getStyles(mode).linkSecText }>Tap to add status update</Text>
                </View>
            </TouchableOpacity>

            <Text style={ getStyles(mode).statusHeading }>Recent Updates</Text>
        </>
        
    )
}

const StatusItem = () => {
    const mode = useColorScheme();
    const navigation = useNavigation();

    return(
        <TouchableOpacity onPress={() => { navigation.navigate('ViewStory') }} style={getStyles(mode).statusContainer}>
            
            <View>
                <StatusDashed width={55} height={ 55 } number={ 5 } color={ colors.primary } />
                
                <Image
                    source={{ uri: 'http://i.pravatar.cc/308' }}
                    style={ getStyles(mode).statusAvatar }
                />
            </View>
            


            <View style={[ tStyles.flex1, { marginLeft: 15 } ]}>
                <Text style={ getStyles(mode).statusUser }>Meee</Text>
                <Text style={ getStyles(mode).statusTime }>1 minute ago</Text>
            </View>
        </TouchableOpacity>
    )
}



export default Updates;