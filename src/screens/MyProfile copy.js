import React from 'react';
import { View, Text, Image, TouchableOpacity, useColorScheme, KeyboardAvoidingView, TextInput } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { colors, tStyles } from '../common/theme';
import { getStyles } from '../styles/myprofile';
import Hr from '../components/Hr';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from '../components/Modal';
import LineTextInput from '../components/LineTextInput';


const MyProfile = ({ navigation }) => {
    const mode = useColorScheme();
    const [nameModal, setNameModal] = React.useState(false);
    const [aboutModal, setAboutModal] = React.useState(false);
    

    return(
        <SafeAreaView style={ getStyles(mode).container }>
            {/* Top Bar */}
            <View style={ getStyles(mode).topBarHolder }>
                <View style={[ tStyles.row ]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="arrowleft" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } />
                    </TouchableOpacity>
                    

                    <Text style={ getStyles(mode).topBarMainText }>My Profile</Text>
                </View>
            </View>


           {/* Profile Image */}
            <View style={getStyles(mode).profileImageHolder}>
                <TouchableOpacity style={ getStyles(mode).linkIconHolder }>
                    <Image
                        source={{ uri: 'http://i.pravatar.cc/302' }}
                        style={ getStyles(mode).linkAvatar }
                    />
                    <View style={getStyles(mode).avatarHolder}>
                        <Feather name='camera' size={ 22 } color={ colors.white } />
                    </View>
                </TouchableOpacity>
            </View>



            {/* Profile Details */}
            <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
                <TouchableOpacity onPress={() => setNameModal(true)} style={ getStyles(mode).profileDetail }>
                    <View style={{ width: 40 }}>
                        <Feather name='user' size={ 20 } color={ (mode == 'dark') ? colors.gray30 : colors.gray50 } />
                    </View>

                    <View style={ [tStyles.spacedRow, tStyles.flex1] }>
                        <View style={ getStyles(mode).profileTextHolder }>
                            <Text style={ getStyles(mode).profileSecText }>Name</Text>
                            <Text style={ getStyles(mode).profileMainText }>Geek Sparks</Text>
                        </View>

                        <Feather name='edit-2' size={ 18 } color={ colors.primary } />
                        
                    </View> 
                    
                </TouchableOpacity>

                <Hr color={ (mode == 'dark') ? colors.gray75 : colors.gray5 } size={ 1 } />

                <TouchableOpacity onPress={() => setAboutModal(true)}  style={ getStyles(mode).profileDetail }>
                    <View style={{ width: 40 }}>
                        <Feather name='info' size={ 20 } color={ (mode == 'dark') ? colors.gray30 : colors.gray50 } />
                    </View>

                    <View style={ [tStyles.spacedRow, tStyles.flex1] }>
                        <View style={ getStyles(mode).profileTextHolder }>
                            <Text style={ getStyles(mode).profileSecText }>About</Text>
                            <Text style={ getStyles(mode).profileMainText }>Spark up your development</Text>
                        </View>

                        <Feather name='edit-2' size={ 18 } color={ colors.primary } />
                        
                    </View> 
                    
                </TouchableOpacity>


                <Hr color={ (mode == 'dark') ? colors.gray75 : colors.gray5 } size={ 1 } />

                <View style={ getStyles(mode).profileDetail }>
                    <View style={{ width: 40 }}>
                        <Feather name='phone' size={ 20 } color={ (mode == 'dark') ? colors.gray30 : colors.gray50 } />
                    </View>

                    <View style={ [tStyles.spacedRow, tStyles.flex1] }>
                        <View style={ getStyles(mode).profileTextHolder }>
                            <Text style={ getStyles(mode).profileSecText }>Phone</Text>
                            <Text style={ getStyles(mode).profileMainText }>+91 9568231526</Text>
                        </View>
                    </View> 
                    
                </View>
            </View>

            { nameModal && <NameModal setStatus={ setNameModal } />}
            { aboutModal && <AboutModal setStatus={ setAboutModal } />}
        </SafeAreaView>
    )
}


// Name Modal Component 
const NameModal = ({ setStatus }) => {
    const mode = useColorScheme();

    return(
        <Modal setStatus={ setStatus } height={ 150 }>
            <View style={ getStyles(mode).modalContainer }>
                <Text style={ getStyles(mode).modalHeading }>Enter your name</Text>

                <LineTextInput />


                <View style={[ tStyles.row, tStyles.endx, { marginTop: 15 } ]}>
                    <TouchableOpacity onPress={() => setStatus(false)} style={ [getStyles(mode).modalActionBtn, { marginRight: 20 }] }>
                        <Text style={ getStyles(mode).modalActionBtnText }>Cancel</Text>
                    </TouchableOpacity>


                    <TouchableOpacity style={ getStyles(mode).modalActionBtn }>
                        <Text style={ getStyles(mode).modalActionBtnText }>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal> 
    )   
}


// About Modal Component
const AboutModal = ({ setStatus }) => {
    const mode = useColorScheme();

    return(
        <Modal setStatus={ setStatus } height={ 150 }>
            <View style={ getStyles(mode).modalContainer }>
                <Text style={ getStyles(mode).modalHeading }>Enter your status</Text>

                <LineTextInput />


                <View style={[ tStyles.row, tStyles.endx, { marginTop: 15 } ]}>
                    <TouchableOpacity onPress={() => setStatus(false)} style={ [getStyles(mode).modalActionBtn, { marginRight: 20 }] }>
                        <Text style={ getStyles(mode).modalActionBtnText }>Cancel</Text>
                    </TouchableOpacity>


                    <TouchableOpacity style={ getStyles(mode).modalActionBtn }>
                        <Text style={ getStyles(mode).modalActionBtnText }>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal> 
    )   
}


export default MyProfile;