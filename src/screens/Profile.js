import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, Image, useWindowDimensions, Platform, FlatList } from 'react-native';
import { AntDesign, Entypo, Feather, Fontisto, Ionicons, MaterialIcons } from '@expo/vector-icons';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { colors, tStyles } from '../common/theme';
import { getStyles } from '../styles/profile';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedTopBar from '../components/AnimatedTopBar';



const Profile = ({ navigation }) => {
    const mode = useColorScheme();
    const scrollOffset = 150;
   
    const scroll = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (e) => {
            scroll.value = e.contentOffset.y
        }
    })

    const mediaData = [
        {id: 1, uri: 'https://picsum.photos/id/280/200/300'},
        {id: 2, uri: 'https://picsum.photos/id/210/200/300'},
        {id: 3, uri: 'https://picsum.photos/id/220/200/300'},
        {id: 4, uri: 'https://picsum.photos/id/305/200/300'},
        {id: 5, uri: 'https://picsum.photos/id/310/200/300'},
        {id: 6, uri: 'https://picsum.photos/id/215/200/300'},
        {id: 7, uri: 'https://picsum.photos/id/330/200/300'},
    ];


    return(
        <SafeAreaView edges={[ 'right', 'left' ]} style={ getStyles(mode).container }>
            {/* Top Bar */}
            <AnimatedTopBar 
                scroll={ scroll } 
                scrollOffset={ scrollOffset } 
                uri="http://i.pravatar.cc/320"
                name="Jason Holder"
            />

            <Animated.ScrollView
                scrollEventThrottle={1}
                bounces={ false }
                showsVerticalScrollIndicator={ false }
                style={{ height: '100%' }}
                onScroll={ scrollHandler }
            >

                {/* Group Info */}
                <View style={[ tStyles.centery, getStyles(mode).info ]}>
                    
                    <Text style={ getStyles(mode).titleText }>Jason Holder</Text>
                    <Text style={ getStyles(mode).subtitleText }>+1 521362 9875</Text>


                    {/* Action Buttons */}
                    <View style={[ tStyles.spacedRow, { marginTop: 15 } ]}>
                        <TouchableOpacity style={[getStyles(mode).actionBtn, { marginRight: 8 }]}>
                            <Ionicons name="call-outline" size={ 23 } color={ colors.primary } />
                            <Text style={ getStyles(mode).actionBtnText }>Call</Text>
                        </TouchableOpacity>


                        <TouchableOpacity style={[getStyles(mode).actionBtn, { marginRight: 8 }]}>
                            <Ionicons name="videocam-outline" size={ 23 } color={ colors.primary } />
                            <Text style={ getStyles(mode).actionBtnText }>Video</Text>
                        </TouchableOpacity>


                        <TouchableOpacity style={[getStyles(mode).actionBtn, { marginRight: 8 }]}>
                            <AntDesign name="adduser" size={ 23 } color={ colors.primary } />
                            <Text style={ getStyles(mode).actionBtnText }>Add</Text>
                        </TouchableOpacity>


                        <TouchableOpacity style={[getStyles(mode).actionBtn]}>
                            <Fontisto name="search" size={ 23 } color={ colors.primary } />
                            <Text style={ getStyles(mode).actionBtnText }>Search</Text>
                        </TouchableOpacity>
                    </View>
                </View>



                {/* Media, Link & Docs */}
                <View style={ [getStyles(mode).bgStrip, {paddingHorizontal: 0}] }>
                    <Text style={ [getStyles(mode).membersHeading, { marginHorizontal: 15 }] }>Media, links and docs</Text>
                    <FlatList
                        horizontal={ true }
                        data={ mediaData }
                        keyExtractor={(item) => item.id}
                        renderItem={({item}) => <MediaItem item={ item } />}
                        contentContainerStyle={{ paddingHorizontal: 15 }}
                        showsHorizontalScrollIndicator={ false }
                        bounces={ false }
                    />
                </View>


                {/* Contact Options */}
                <View style={ [getStyles(mode).bgStrip, { paddingVertical: 10 }] }>
                    <TouchableOpacity style={ getStyles(mode).optionBtn }> 
                        <View style={{ width: 40 }}>
                            <Feather name="bell" color={ colors.gray50 } size={ 20 } />
                        </View>
                        
                        <Text style={ getStyles(mode).optionBtnText }>Notifications</Text>
                    </TouchableOpacity>


                    <TouchableOpacity style={ getStyles(mode).optionBtn }> 
                        <View style={{ width: 40 }}>
                            <MaterialIcons name="perm-media" color={ colors.gray50 } size={ 20 } />
                        </View>
                        
                        <Text style={ getStyles(mode).optionBtnText }>Media Visibility</Text>
                    </TouchableOpacity>


                    <TouchableOpacity style={ getStyles(mode).optionBtn }> 
                        <View style={{ width: 40 }}>
                            <Feather name="heart" color={ colors.gray50 } size={ 20 } />
                        </View>
                        
                        <Text style={ getStyles(mode).optionBtnText }>Add to favourites</Text>
                    </TouchableOpacity>
                </View>


                {/* Contact Settings */}
                <View style={ [getStyles(mode).bgStrip, { paddingVertical: 10 }] }>
                    <TouchableOpacity style={ getStyles(mode).optionBtn }> 
                        <View style={{ width: 40 }}>
                            <Feather name="lock" color={ colors.gray50 } size={ 20 } />
                        </View>
                        
                        <View style={{ maxWidth: '75%' }}>
                            <Text style={ getStyles(mode).optionBtnText }>Encryption</Text>
                            <Text style={ getStyles(mode).optionBtnSecText }>Messages and calls are end-to-end encrypted. Tap to verify.</Text>
                        </View>
                        
                    </TouchableOpacity>

                    <TouchableOpacity style={ getStyles(mode).optionBtn }> 
                        <View style={{ width: 40 }}>
                            <MaterialIcons name="av-timer" color={ colors.gray50 } size={ 20 } />
                        </View>
                        
                        <View style={{ maxWidth: '75%' }}>
                            <Text style={ getStyles(mode).optionBtnText }>Disappearing mesages</Text>
                            <Text style={ getStyles(mode).optionBtnSecText }>Off</Text>
                        </View>
                        
                    </TouchableOpacity>

                    <TouchableOpacity style={ getStyles(mode).optionBtn }> 
                        <View style={{ width: 40 }}>
                            <MaterialIcons name="mail-lock" color={ colors.gray50 } size={ 20 } />
                        </View>
                        
                        <View style={{ maxWidth: '75%' }}>
                            <Text style={ getStyles(mode).optionBtnText }>Chat Lock</Text>
                            <Text style={ getStyles(mode).optionBtnSecText }>Lock and hide chats on this device.</Text>
                        </View>
                        
                    </TouchableOpacity>
                    
                </View>


                {/* Add to Group */}
                <View style={ getStyles(mode).bgStrip }>
                    <Text style={ getStyles(mode).membersHeading }>No groups in common</Text>

                    {/* Create group Button */}
                    <TouchableOpacity 
                        onPress={ () => navigation.navigate('NewGroup') }
                        style={ getStyles(mode).memberLink }
                    >
                        <View style={ getStyles(mode).memberLinkIconHolder }>
                            <AntDesign name='adduser' size={ 23 } />
                        </View>
                        <Text style={ getStyles(mode).memberLinkText }>Create group with Jason Holder</Text>
                    </TouchableOpacity>

                </View>


                {/* Contact Actions */}
                <View style={ [getStyles(mode).bgStrip, { paddingBottom: 25, marginBottom: 20 }] }>
                    <TouchableOpacity style={ [tStyles.row, tStyles.flex1, { paddingVertical: 10 } ] }> 
                        <Entypo name='block' color={ 'red' } size={ 23 } />

                        <Text style={ getStyles(mode).actionText }>Block Jason Holder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={ [tStyles.row, tStyles.flex1.flex, { paddingVertical: 10 } ] }> 
                        <AntDesign name='dislike2' color={ 'red' } size={ 23 } />

                        <Text style={ getStyles(mode).actionText }>Report Jason Holder</Text>
                    </TouchableOpacity>
                </View>


            </Animated.ScrollView>
        </SafeAreaView>
    )
}


const MemberItem = () => {
    // const navigation = useNavigation();
    const mode = useColorScheme();

    return(
        <TouchableOpacity style={getStyles(mode).memberContainer}>
            <Image
                source={{ uri: 'http://i.pravatar.cc/320' }}
                style={ getStyles(mode).memberAvatar }
            />

            <View style={[ tStyles.spacedRow, tStyles.flex1 ]}>
                <View style={[ tStyles.flex1, { marginLeft: 15 } ]}>
                    <Text style={ getStyles(mode).memberUser }>Meee</Text>
                    <Text style={ getStyles(mode).memberStatus }>Profile Status</Text>
                </View>

                <Text style={ getStyles(mode).adminBadge }>Group Admin</Text>
            </View>
        </TouchableOpacity>
    )
}


const MediaItem = ({ item }) => {
    return(
        <TouchableOpacity>
            <Image
                source={{ uri: item.uri }}
                style={{ width: 90, height: 80, marginRight: 8, borderRadius: 10 }}
                resizeMode='cover'
            />
        </TouchableOpacity>
    )
}


export default Profile;