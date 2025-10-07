import React, { useState, useRef, useEffect } from 'react';
import {  View,  Text,  Pressable,  Modal,  FlatList,  StyleSheet,  TouchableOpacity, useColorScheme} from 'react-native';
import CountryFlag from "react-native-country-flag";
import { currencyList } from '../commonApp/currency';
import { getStyles } from "../styles/home";
import { colors, fonts,tStyles } from '../common/theme';

const CurrencyDropDown= ({defaultCurrency, defaultCountry, onSelected} ) => {

  // mm - lista de monedas
  let monedasLatam = currencyList

  // mm - si no viene con la moneda viene con el pais
  if (defaultCurrency == undefined)
  {
    let aux = monedasLatam.find((m) => m.country_code === defaultCountry);
    defaultCurrency = aux == undefined ? "USD" : aux.currency_code
  }

  const [isVisible, setIsVisible] = useState(false);
  const [selectedMoneda, setSelectedMoneda] = useState(defaultCurrency);
  const dropdownRef = useRef(null);

  // mm - actualizar cuando cambie defaultCurrency
  useEffect(() => {
    if (defaultCurrency && defaultCurrency !== selectedMoneda) {
      setSelectedMoneda(defaultCurrency);
    }
  }, [defaultCurrency]);
  
  const mode = useColorScheme();
  
  const renderItem = ({ item }) => 
    
    (
    <TouchableOpacity
      style={[
        styles.item,
        selectedMoneda === item.currency_code && styles.selectedItem,
      ]}
      onPress={() => {
        setSelectedMoneda(item.currency_code);
        setIsVisible(false);
        onSelected (item.currency_code)
      }}
    >
      <Text style={styles.bandera}><CountryFlag isoCode={item.country_code} size={15} /></Text>
      <Text style={getStyles(mode).normalText}>{item.name} </Text>
      <Text style={getStyles(mode).normalText}> ({item.currency_code})</Text>
    </TouchableOpacity>
  );

  const selectedItem = monedasLatam.find((m) => m.currency_code == selectedMoneda);
  // mm  - si viene con una moneda de default
  if (defaultCurrency != undefined)
  {
    try{
      let list = [] // mm - no sacar
      list.push(monedasLatam.find((m) => m.currency_code == defaultCurrency ? true : false)); // mm - agrego el primer elemento el pais de default
      monedasLatam.forEach ((item) => { if (item.currency_code != defaultCurrency) list.push (item)})
      monedasLatam = list
    }catch (e){console.log (e)}
  }


  return (
    <View style={[getStyles(mode).dropDownList, { maxWidth: 50 }]} ref={dropdownRef}>
      {/* Botón que abre el dropdown */}
      <Pressable
        style={styles.dropdownButton}
        onPress={() => setIsVisible(!isVisible)}
      >
        <View style={styles.selectedContent}>
          <Text style={styles.bandera}><CountryFlag isoCode={selectedItem?.country_code} size={15} /></Text>
          {/*<Text style={[styles.selectedText, {color:colors.gray50}]}>
            {selectedItem?.name} ({selectedItem?.currency_code})
          </Text>*/}
        </View>
        <Text style={styles.arrowIcon}> {isVisible ? '▲' : '▼'}</Text>
      </Pressable>

      {/* Modal con la lista de monedas */}
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsVisible(false)}
        >
          <View style={[styles.dropdownList, {backgroundColor:colors.gray50}]}>
            <FlatList
              data={monedasLatam}
              renderItem={renderItem}
              keyExtractor={(item) => item.country_code}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    width: '100%'
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bandera: {
    fontSize: 14,
    marginRight: 10,
  },
  selectedText: {
    
  },
  arrowIcon: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownList: {
    width: '80%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 25,
    elevation: 5,
    paddingVertical: 20
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  selectedItem: {
    backgroundColor: colors.gray40,
  },
  nombreMoneda: {
    flex: 1,
    fontSize: 14,
  },
  codigoMoneda: {
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
});

export default CurrencyDropDown;