import React, { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, useColorScheme,View, Text, Pressable, Modal, FlatList, TextInput, StyleSheet } from 'react-native';
import { useFocusEffect } from "@react-navigation/native";
import { getStyles } from "../styles/home";
import { tStyles, colors, fonts } from "../common/theme";

const DropDownList= ({placeholder, data, onSelected, defaultCode}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredAreas, setFilteredAreas] = useState([])
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const hasSetDefault = useRef(false);

  const mode = useColorScheme();

  // Establecer el valor por defecto cuando se monta el componente o cuando cambia defaultCode o data
  useEffect(() => {
    if (defaultCode && data && data.length > 0) {
      const defaultItem = data.find(item => item.code === defaultCode);
      console.log('DefaultCode:', defaultCode);
      console.log('DefaultItem found:', defaultItem);
      
      if (defaultItem) {
        setSelectedItem(defaultItem);
        hasSetDefault.current = true;
      }
    }
  }, [defaultCode, data]);

  function filterText(value) {
    setSearchText(value);
    const t = (value || '').toLowerCase().trim();
    if (!t) {
      setFilteredAreas(data || []);
      return;
    }
    
    // Filtrar por nombre
    const filtered = (data || []).filter((item) => {
      return (item.name || '').toString().toLowerCase().indexOf(t) !== -1;
    });
    
    // Eliminar duplicados basados en el código
    const uniqueFiltered = filtered.reduce((acc, current) => {
      const exists = acc.find(item => item.code === current.code);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    setFilteredAreas(uniqueFiltered);
  }

  // Focus the search input when the modal opens and reset filters
  useEffect(() => {
    if (isOpen) {
      // Resetear el texto de búsqueda y mostrar todas las opciones
      setSearchText('');
      
      // Validar que data sea un array antes de usar reduce
      if (!Array.isArray(data)) {
        setFilteredAreas([]);
        return;
      }
      
      // Eliminar duplicados de data antes de mostrar
      const uniqueData = data.reduce((acc, current) => {
        const exists = acc.find(item => item.code === current.code);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setFilteredAreas(uniqueData);
      
      // Enfocar el input de búsqueda
      if (inputRef && inputRef.current) {
        setTimeout(() => {
          try {
            inputRef.current.focus();
          } catch (e) {
            // ignore
          }
        }, 100);
      }
    }
  }, [isOpen]); // Solo depende de isOpen, no de data

 
  
  function setSelection (item)
  {
    onSelected (item)
  }

  return (
    <View style={[getStyles(mode).container, getStyles(mode).searchBar, {width: '100%'}]} ref={dropdownRef}>
      {/* Botón que abre el dropdown */}
      <TouchableOpacity 
        style={[getStyles(mode).row, {flex: 1, width: '100%'}]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={[getStyles(mode).normalText, {color:colors.secondary, flex: 1}]}>
          {selectedItem ? `${selectedItem.name}` : placeholder}
        </Text>
        <Text style={styles.arrowIcon}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Modal con la lista desplegable */}
      <Modal visible={isOpen} transparent animationType="fade" >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setIsOpen(false);
            setSearchText('');
          }}
        >
          <Pressable 
            style={[{width:"80%", padding:0}]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* SearchBar */}
            <TextInput
              ref={inputRef}
              style={[getStyles(mode).searchBar, getStyles(mode).normalText, {height:50, marginTop: 20}]}
              placeholder="Buscar..."
              value={searchText}
              onChangeText={filterText}
              placeholderTextColor="#999"
              autoFocus={true}
            />

            {/* Lista de resultados */}
            <FlatList
              style={[{backgroundColor:colors.gray5, borderRadius:15}]}
              data={filteredAreas}
              keyExtractor={(item, index) => `${item.code}-${index}`}
              renderItem={({ item }) => {
                const isSelected = selectedItem && selectedItem.code === item.code;
                
                // Debug log
                if (item.code === defaultCode) {
                  console.log('Rendering item with defaultCode:', item.code);
                  console.log('selectedItem:', selectedItem);
                  console.log('isSelected:', isSelected);
                }
                
                return (
                  <Pressable
                    style={[
                      getStyles(mode).normalText, 
                      {
                        color: colors.secondary, 
                        padding: 10,
                        backgroundColor: isSelected 
                          ? (mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 168, 132, 0.15)') 
                          : 'transparent'
                      }
                    ]}
                    onPress={() => {
                      setSelection (item);
                      setSelectedItem(item);
                      setIsOpen(false);
                      setSearchText('');
                    }}
                  >
                    <Text style={[
                      getStyles(mode).normalText, 
                      {
                        color: colors.secondary,
                        fontWeight: isSelected ? '900' : 'normal'
                      }
                    ]}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <Text style={[getStyles(mode).normalText, {color:colors.secondary,padding:10}]}>No se encontraron resultados</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    width: '80%',
    marginVertical: 20,
     flexDirection: "row",         // Coloca los elementos en fila
    justifyContent: "space-between"
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  selectedText: {
    flex: 1,
    fontSize: 16,
  },
  arrowIcon: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'top',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownList: {
    width: '80%',
    maxHeight: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchBar: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 16,
  },
  listItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: colors.gray5,
  },
  itemCode: {
    fontWeight: 'bold',
    width: 40,
    color: '#333',
  },
  itemName: {
    flex: 1,
    color: '#555',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: '#777',
  },
});
export default DropDownList;