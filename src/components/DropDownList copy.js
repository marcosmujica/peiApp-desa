import React, { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, useColorScheme,View, Text, Pressable, Modal, FlatList, TextInput, StyleSheet } from 'react-native';
import { useFocusEffect } from "@react-navigation/native";
import { getStyles } from "../styles/home";
import { tStyles, colors, fonts } from "../common/theme";

const DropDownList= ({placeholder, data, onSelected}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredAreas, setFilteredAreas] = useState(data || [])
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const mode = useColorScheme();


  function filterText(value) {
    setSearchText(value);
    const t = (value || '').toLowerCase();
    if (!t) {
      setFilteredAreas(data || []);
      return;
    }
    const filtered = (data || []).filter((item) => {
      return (item.name || '').toString().toLowerCase().indexOf(t) !== -1;
    });
    setFilteredAreas(filtered);
  }

  // keep filteredAreas in sync when data changes
  useEffect(() => {
    setFilteredAreas(data || []);
  }, [data]);

  // Focus the search input when the modal opens
  useEffect(() => {
    if (isOpen && inputRef && inputRef.current) {
      try {
        inputRef.current.focus();
      } catch (e) {
        // ignore
      }
    }
  }, [isOpen]);

 
  
  function setSelection (item)
  {
    onSelected (item)
  }

  return (
    <View style={[getStyles(mode).container, getStyles(mode).searchBar ]} ref={dropdownRef}>
      {/* Botón que abre el dropdown */}
      <TouchableOpacity style={[ getStyles(mode).row]}
              onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[getStyles(mode).normalText, {color:colors.secondary}]}>
          {selectedItem ? `${selectedItem.name}` : placeholder}
        </Text>
        <Text style={styles.arrowIcon}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Modal con la lista desplegable */}
      <Modal visible={isOpen} transparent animationType="fade" >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <View style={[{width:"80%", padding:0}]}>
            {/* SearchBar */}
            <TextInput
              ref={inputRef}
              style={[getStyles(mode).searchBar, getStyles(mode).normalText, {height:50}]}
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
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[getStyles(mode).normalText, {color:colors.secondary, padding:10}]}
                  onPress={() => {
                    setSelection (item);
                    setSelectedItem(item);
                    setIsOpen(false);
                    setSearchText('');
                  }}
                >
                  <Text style={[getStyles(mode).normalText, {color:colors.secondary}]}>{item.name}</Text>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <Text style={[getStyles(mode).normalText, {color:colors.secondary,padding:10}]}>No se encontraron resultados</Text>
              }
            />
          </View>
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