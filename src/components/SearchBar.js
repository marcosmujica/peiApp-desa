import React,{useState, useEffect} from 'react';
import { View, Text, TextInput,TouchableOpacity, useColorScheme,StyleSheet } from 'react-native';
import { getStyles } from '../styles/home';
import { Fontisto, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tStyles, fonts } from '../common/theme';


const SearchBar = ({ textToSearch }) => {
    const colorScheme = useColorScheme();

    const [texto, setTexto] = React.useState ("")
    
    useEffect(() => {
            setTexto (textToSearch)
            return () => {
                console.log('🧹 Componente desmontado');
                // Esto se ejecuta cuando el componente se va de pantalla
            };
        }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)

        const setText =  (key) => {
            setTexto (key)
            textToSearch (key)
         }

    return(
        <>
            <View style={ getStyles(colorScheme).searchBar} /*style={ getStyles(colorScheme).searchBar }*/>
                <Fontisto name='search' color={ colors.gray50 } size={ 15 } style={{paddingRight:10}} />

                <TextInput 
                    placeholder='Buscar...'
      //              value={searchText}
                    placeholderTextColor={ colors.secondary }
                    style={ getStyles(colorScheme).searchBarInput }
                    value={texto}
                    onChangeText={ (key) => setText(key)}
                />
                <Fontisto name='close-a' onPress={() => {
                    setText(""); 
                    }}  color={ colors.gray50 } size={ 15 } />
            </View>
        </>
        
    )
}

export default SearchBar;