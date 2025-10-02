import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Fontisto,
  FontAwesome,
  MaterialIcons,
  Feather,
} from "@expo/vector-icons";
import { tStyles, colors } from "../common/theme";
import { displayTime, ellipString } from "../common/helpers";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import { getStyles } from "../styles/chatdetails";
import AppContext from "../context/appContext";
import SlideOptions from "./SlideOptions";
import { db_getAllTickets, db_getTicketLog } from "../commonApp/database";
import { TICKET, TICKET_CHAT } from "../commonApp/dataTypes";
import { getProfile } from "../commonApp/profile";
import Loading from "./Loading";
import { TICKET_DETAIL_PAY_STATUS, TICKET_DETAIL_STATUS } from "../commonApp/constants";
import { formatNumber } from "../commonApp/functions";
import ImgAvatar from "./ImgAvatar";

const TicketLog = ({ idTicket }) => {
  const mode = useColorScheme();
  const behavior = Platform.OS === "ios" ? "height" : "padding";
  const { options, setOptions, showAlertModal } = React.useContext(AppContext);
  const navigation = useNavigation();
  const [loading, setLoading] = React.useState("");
  const [logData, setLogData] = useState([]);

  const openViewer = (filename) => {
    console.log (filename)
    navigation.navigate("Viewer", { filename: filename });
  };

  useEffect(() => {
    refreshData();

    return () => {
      console.log("🧹 Componente TicketLog desmontado");
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)

  let profile = getProfile();
  const idUser = profile.idUser;

  async function refreshData() {
    setLoading(true);

    let data = await db_getTicketLog(idTicket);
    //let data = await db_getTicketLog(idTicket);

    if (data != []) {
      let dataAux = [];
      // mm - me quedo solo con los elementos segun si son privados o no
      data.forEach((element) => {
        if (element.isPrivate && profile.idUser == element.idUser) {
          dataAux.push(element);
        } else {
          if (!element.isPrivate) dataAux.push(element);
        }
      });
      dataAux.sort((a, b) => (a.TS < b.TS ? -1 : 1));
      setLogData(dataAux);
    }
    setLoading(false);
  }
  return (
    <View>
      <Loading loading={loading} title="" />

      <View style={{ paddingBottom: 130 }}>
        <FlatList
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          data={logData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LogItem onOpen={openViewer} chat={item} idUser={idUser} />}
          contentContainerStyle={getStyles(mode).chatListing}
        />
      </View>
    </View>
  );
};

const LogItem = ({ chat, idUser, onOpen }) => {
  const mode = useColorScheme();
  const { width } = useWindowDimensions();

  let aux = TICKET_DETAIL_STATUS.find((item) => item.code == chat.idStatus);
  let text = aux == undefined ? "CAMBIO DE DATOS" : aux.name.toUpperCase();
  let text2 = chat.message;
  let text3 =
    chat.amount > 0
      ? "Importe: " + chat.currency + "  " + formatNumber(chat.amount)
      : "";
  let text4 = chat.note != "" ? '=> " ' + chat.note + ' "' : "";

  return (
    <View
      style={[
        getStyles(mode).chatBubble,
        chat.IdUser == idUser ? getStyles(mode).chatBubbleMe : null,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ImgAvatar id={chat.idUser} size={15} />
        <Text
          style={[
            getStyles(mode).chatText,
            { fontWeight: "bold", color: colors.primary, marginLeft: 8 },
          ]}
        >
          {text}
        </Text>
      </View>

      <Text style={getStyles(mode).chatText}>{text2}</Text>
      {text3 != "" && <Text style={getStyles(mode).chatText}>{text3}</Text>}
      {text4 != "" && <Text style={getStyles(mode).chatText}>{text4}</Text>}

      {chat.idStatus == TICKET_DETAIL_PAY_STATUS && chat.data.uri != ""  && (
        <TouchableOpacity
                        onPress={()=>onOpen(chat.data.uri)}
                        style={[
                          getStyles(mode).simpleBtn,
                          { alignContent: "center", borderRadius:25, padding:5, paddingLeft:10, paddingRight:10, margin:10, borderWidth:1, backgroundColor: colors.gray50, borderColor: colors.white,alignSelf: "center" }, // <-- ancho completo
                        ]}
                      >
                        <Text
                          style={[getStyles(mode).simpleBtn, { color: colors.white, fontSize: 13 }]}
                        >
                          <Fontisto name="paperclip" size={15}></Fontisto>{"  "}
                          Ver comprobante de pago
                        </Text>
                      </TouchableOpacity>
      )}
      <View style={[tStyles.row, tStyles.endx, { marginTop: 3 }]}>
        <Text style={[getStyles(mode).chatTime]}>
          {moment(chat.TS).format("D MMM, HH:mm")}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    padding: 10,
    paddingBottom: 70, // dejar espacio para el input
  },
  messageBubble: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    marginBottom: 5,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    alignItems: "center",
    width: "100%",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 20,
  },
  sendText: {
    color: "#fff",
    fontWeight: "bold",
  },
  columna: {
    flex: 1, // 🔹 Cada columna ocupa el 50% del ancho
  },
});

export default TicketLog;
