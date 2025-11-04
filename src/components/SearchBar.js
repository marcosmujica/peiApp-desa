import React,{useState, useEffect} from 'react';
import { View, Text, TextInput,TouchableOpacity, useColorScheme,StyleSheet } from 'react-native';
import { getStyles } from '../styles/home';
import { Fontisto, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tStyles, fonts } from '../common/theme';


const SearchBar = ({ textToSearch  = ""}) => {
    const colorScheme = useColorScheme();

    const [texto, setTexto] = React.useState("")
    
    useEffect(() => {
        // Limpiar el texto cuando se monta el componente
        setTexto("");
        return () => {
            console.log('🧹 SearchBar desmontado');
        };
    }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)

    const setText = (key) => {
        setTexto(key);
        // Llamar a la función de callback de forma segura
        if (typeof textToSearch === 'function') {
            textToSearch(key);
        }
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
                {texto!="" && <Fontisto name='close-a' onPress={() => {
                    setText(""); 
                    }}  color={ colors.gray50 } size={ 15 } />}
            </View>
        </>
        
    )
}

export default SearchBar;