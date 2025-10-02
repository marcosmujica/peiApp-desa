import React from "react";
import {
  View,
  Text,
  Modal,
  Button,
  StyleSheet,
  TouchableWithoutFeedback,
  Calendar,
  Animated,
  Pressable,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { colors, fonts, tStyles } from "../common/theme";
import { getStyles } from "../styles/home";
import { FlatList } from "react-native-gesture-handler";
import { formatDateToText } from "../commonApp/functions";
import { Fontisto } from "@expo/vector-icons";
import { displayTime, ellipString } from "../common/helpers";

const DateBtn = ({
  text,
  date = new Date(),
  week = true,
  onDateSelected,
  type = "day",
}) => {
  const mode = useColorScheme();
  const [dateInfo, setDateInfo] = React.useState(date);
  const [visible, setVisible] = React.useState(false);

  function onChange(value) {
    // mm - lo paso primero a una variable porque actualizarlo en setdatinfo no es inmediato y al llamar a la funcion ondateselected mostraria el valor anterior
    let aux;
    if (type === "day") {
      aux = new Date(dateInfo);
      aux.setDate(aux.getDate() + value);
    } else if (type === "month") {
      aux = new Date(dateInfo);
      aux.setMonth(aux.getMonth() + value);
    } else if (type === "year") {
      aux = new Date(dateInfo);
      aux.setFullYear(aux.getFullYear() + value);
    } else {
      aux = new Date(dateInfo);
    }
    onDateChanged (aux)
  }

  function onDateChanged (aux)
  {
      setDateInfo(aux);
      if (typeof onDateSelected === "function") onDateSelected(aux);
  }

  //<View style={{ flexDirection: "row", alignItems: "center", width: "100%", justifyContent: "space-between", marginVertical: 10, backgroundColor: styles.info }}>
  return (
    <View style={[getStyles(mode).dateBtn]}>
      <TouchableOpacity style={[getStyles(mode).dateBtnMove]}
        onPress={() => {
          onChange(-1);
        }}
      >
        <Fontisto name="minus-a" style={{ color: colors.white }} />
      </TouchableOpacity>
      {week && (
        <TouchableOpacity style={[getStyles(mode).dateBtnMove]}
          onPress={() => {
            onChange(-7);
            }}
            >
            <Fontisto name="backward" style={{ color: colors.white }} />
            </TouchableOpacity>
            )}
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", alignSelf: "stretch", width: "100%" }}>
            <TouchableOpacity 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              justifyContent: 'center', // <-- centra el contenido horizontalmente
              paddingHorizontal: 5,
              width: "100%",
            }} 
            onPress={() => {onDateChanged (new Date());/* mm - dia de hoy*/}}
          >
            
            <Text style={[fonts.medium, { textAlign:"center", alignItems:"center",color: colors.white, fontSize: 13, marginLeft: 5 }]}>
            <Fontisto name="clock" size={13} color={colors.white} /> {text}{`\n`}{formatDateToText(dateInfo)}
            </Text>
          </TouchableOpacity>
          </View>
          {week && (
          <TouchableOpacity style={[getStyles(mode).dateBtnMove]}
            onPress={() => {
            onChange(7);
          }}
        >
          <Fontisto name="forward" style={{ color: colors.white }} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[getStyles(mode).dateBtnMove]}
        onPress={() => {
          onChange(1);
        }}
      >
        <Fontisto name="plus-a" size={17} style={{ color: colors.white }} />
      </TouchableOpacity>
    </View>
  );
};
export default DateBtn;
