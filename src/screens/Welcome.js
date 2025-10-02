import React, {useEffect} from 'react';
import { Dimensions, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, tStyles } from '../common/theme';
import  "../commonApp/global"
import {getProfile, initProfile, isLogged} from '../commonApp/profile';
import {recoveryAllContacts} from '../commonApp/contacts';
import { db_userAccess } from '../commonApp/database';
import Loading from "../components/Loading";

const slides = [
  {
    key: '1',
    title: 'Bienvenido a tu comnunidad',
    text: 'Crea tickets y solitá pagos fácilmente.\nOrganizá tus cobros de forma clara y rápida, desde el celular.',
    image: "",//require('../assets/onboarding1.png'),
    backgroundColor: '#fff',
  },
  {
    key: '2',
    title: 'Sincronización en la nube',
    text: 'Tus datos siempre disponibles.',
    image: "",//require('../assets/user.png'),
    backgroundColor: '#febe29',
  },
  {
    key: '3',
    title: 'Comenzá ahora',
    text: 'Registrate y empezá a usar la app.',
    image: "",//require('../assets/user.png'),
    backgroundColor: '#22bcb5',
  },
];

const OnboardingScreen = ({ onDone }) => {
  const renderItem = ({ item }) => (
    <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      <Image source={item.image} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );

  return (
    <AppIntroSlider renderItem={renderItem} data={slides} onDone={onDone} />
  );
};

const Welcome = ({ navigation }) => {

  const [loading, setLoading] = React.useState(false)

   useEffect(() => {

    const checkLogin = async () =>
  {
    setLoading (true)
    let _profile = await initProfile()
    try{
      recoveryAllContacts (_profile.phonePrefix)
    }catch (e){console.log ("error al leer los contactos en welcome: " + JSON.stringify(e))}
    
    setLoading (false)

    if (isLogged())
    {
      navigation.navigate('MainScreen')
    }
    else
    {
    try{navigation.navigate('PreLogin')}catch(e){console.log(e)}
    }
  }
  
  checkLogin()  
      return () => {
          console.log('🧹 Componente desmontado');
          // Esto se ejecuta cuando el componente se va de pantalla
      };
  }, []); // 
      

  
  
  /*  

  const [showRealApp, setShowRealApp] = useState(false);

  if (showRealApp) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Text>Esta es tu app principal</Text>
      </SafeAreaView>
    );
  } else {
    return <OnboardingScreen onDone={() => setShowRealApp(true)} />;
  }*/
return ( 
    <Loading loading={loading} title="" />
)
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  image: {
    width: Dimensions.get('window').width * 0.8,
    height: 250,
    resizeMode: 'contain',
    marginVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#808080',
    textAlign: 'center',
  },
});

export default Welcome;