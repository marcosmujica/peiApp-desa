import React from 'react';
import { View, useColorScheme, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors, fonts,tStyles } from '../common/theme';
import { Fontisto, MaterialIcons, Entypo, AntDesign, Feather } from "@expo/vector-icons";
import { getStyles } from "../styles/home";
import { displayTime, ellipString } from '../common/helpers';

const WrappingFlatList = ({areaWorkList, onDelete}) => {

  // Calculamos el número de columnas basado en el ancho de pantalla
  const itemWidth = 160; // Ancho deseado para cada ítem
  const numColumns = Math.floor(Dimensions.get('window').width / itemWidth);
  const mode = useColorScheme();

  return (
    <View style={styles.container}>
      <FlatList
        data={areaWorkList}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onDelete (item.code)}>
          <View style={[styles.item, { width: itemWidth }]} >
            <Text style={styles.nombre}>{areaWorkList.length>0 ? ellipString (item.name, 15) : ""}</Text>
              <View style={[getStyles(mode).avatarHolder]}>
                <MaterialIcons   name="close"  size={20} color={colors.gray75} />
              </View>
          </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.code} // Usamos el ID único del objeto
        numColumns={numColumns}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  listContent: {
    alignItems: 'flex-start',
  },
  item: {
    backgroundColor: colors.gray50,
    padding: 5,
    borderRadius: 25,
    margin:6,
    alignItems: 'center',
  },
  nombre: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 0,
    textAlign: 'center',
    color: colors.gray10
  },
});

export default WrappingFlatList;