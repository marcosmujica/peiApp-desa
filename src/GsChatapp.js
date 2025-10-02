import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {MainStackNavigator} from './navigators/MainStackNavigator';
import AppContext from './context/appContext';
import AlertModal from './components/AlertModal';


const GsChatapp = () => {
    const { alertModal, setAlertModal } = React.useContext(AppContext);

    return(
        <SafeAreaProvider>
            <NavigationContainer>
                <MainStackNavigator />
                
                { alertModal && <AlertModal setModal={setAlertModal} /> }
            </NavigationContainer> 
        </SafeAreaProvider>
            
    )
}
export default GsChatapp;