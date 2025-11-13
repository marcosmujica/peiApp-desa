import React,{useState, useEffect} from 'react';
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
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FontAwesome,
  MaterialIcons,
  Feather,
  Fontisto,
} from "@expo/vector-icons";
import { tStyles, colors } from "../common/theme";
import { displayTime, ellipString } from "../common/helpers";
import moment from "moment";
import { getStyles } from "../styles/chatdetails";
import AppContext from "../context/appContext";
import SlideOptions from "../components/SlideOptions";
import {
  db_getTicketInfo,
  db_listener_newMsgChat,
  db_addTicketChat,
  db_getTicketChat,
} from "../commonApp/database";
import { TICKET, TICKET_CHAT } from "../commonApp/dataTypes";
import { getProfile } from "../commonApp/profile";
import Loading from "../components/Loading";
import {
  TICKET_TYPE_COLLECT,
  TICKET_TYPE_PAY,
  USER_PREFIX_USER,
} from "../commonApp/constants";
import { formatNumber } from "../commonApp/functions";


const TicketChat = ({idTicket}) => {

  const mode = useColorScheme();
  const behavior = Platform.OS === "ios" ? "height" : "padding";
  const { options, setOptions, showAlertModal } = React.useContext(AppContext);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = React.useState("");
  const [chatData, setChatData] = useState([]);
  
  let listener // mm - no sacar

  useEffect(() => 
    {
    refreshData();
    // OJO!!! hay que cancelar el listener cuando se abandona el componente
    listener = db_listener_newMsgChat(idTicket, newMsgTicket);

    return () => {

      listener.cancel() // mm - no sacar
      console.log("🧹 Componente desmontado");
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)

  profile = getProfile();
  const idUser = profile.idUser;

  function sendMsg() {
    let msg = new TICKET_CHAT();
    msg.message = message;
    msg.idTicket = idTicket;
    msg.fromIdUser = idUser;
    //msg.toIdUser = ""; // -- OJO!!!! falta poner el destinatario
    db_addTicketChat(msg);

    setMessage("");
  }

  function newMsgTicket(isNew, doc) {
    setChatData((prevItems) => {
      const newItems = [...prevItems, doc];
      // Ordenar descendentemente por TSSent porque el FlatList está invertido
      newItems.sort((a, b) => {
        const timeA = new Date(a.TSSent).getTime();
        const timeB = new Date(b.TSSent).getTime();
        return timeB - timeA; // Orden descendente para FlatList invertido
      });
      return newItems;
    });
  }

  // mm  - seteo el listener para los cambios en el chat

  async function refreshData() {
    setLoading(true);
    let data = await db_getTicketChat(idTicket);
    if (data && Array.isArray(data)) {
      // Ordenar descendentemente por TSSent porque el FlatList está invertido
      data.sort((a, b) => {
        const timeA = new Date(a.TSSent).getTime();
        const timeB = new Date(b.TSSent).getTime();
        return timeB - timeA; // Orden descendente para FlatList invertido
      });
      setChatData(data);
    } else {
      setChatData([]);
    }
    setLoading(false);
  }
  return (
<View style={[styles.container, { backgroundColor: colors.dark }]}>
      <View style={[getStyles(mode).row]}>
              <Loading loading={loading} title="" />
        
        {/* Top Bar  */}
    
        {/*{!isToUser && (
          <Text
          style={[
            getStyles(mode).chatUsername,
            { padding: 10, color: colors.gray50 },
          ]}
          >
            Invita a tu contacto para poder conversar
          </Text>
        )}*/}
          <View style={getStyles(mode).container}>
            {/* Chats Listing */}
            <FlatList
              showsVerticalScrollIndicator={false}
              bounces={false}
              data={chatData}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChatItem chat={item} idUser={idUser} />
              )}
              contentContainerStyle={getStyles(mode).chatListing}
              inverted={true}
              />

            {/* New Chat Input */}

            <View style={{  height: 60 }} />
              <View  style={[styles.inputContainer, {position: "absolute", bottom: 0 }]}>
            <View style={[getStyles(mode).chatInputHolder]}>
              <View style={getStyles(mode).chatInput}>
                <TouchableOpacity>
                  <MaterialIcons
                    name="insert-emoticon"
                    size={20}
                    color={mode == "dark" ? colors.gray30 : null}
                    />
                </TouchableOpacity>

                <TextInput
                  placeholder="Mensaje"
                  style={getStyles(mode).chatInputText}
                  placeholderTextColor={mode == "dark" ? colors.gray30 : null}
                  value={message}
                  onChangeText={setMessage}
                  />

                <TouchableOpacity>
                  <Feather
                    name="camera"
                    size={20}
                    color={mode == "dark" ? colors.gray30 : null}
                    />
                </TouchableOpacity>
              </View>

              {message != "" && (
                <TouchableOpacity
                style={getStyles(mode).sendBtn}
                onPress={() => sendMsg()}
                >
                  <FontAwesome name="send" size={20} />
                </TouchableOpacity>
              )}
            </View>
            </View>
          </View>
    </View>
    </View>
  );
};

const ChatItem = ({ chat, idUser }) => {
  const mode = useColorScheme();
  const { width } = useWindowDimensions();
  return (
    <View>
      <View
        style={[
          getStyles(mode).chatBubble,
          chat.fromIdUser == idUser ? getStyles(mode).chatBubbleMe : null,
        ]}
      >
        {chat.uri != "" && (
          <Image
            source={{ uri: chat.uri }}
            style={{ width: 0.6 * width, minHeight: 200, borderRadius: 10 }}
            resizeMode="cover"
          />
        )}

        {chat.message != "" && chat.type=="status" && (
          <Text style={[getStyles(mode).chatText, {color:colors.primary}]}>
            <Fontisto name="check" size="5" style={{paddingRight:10}}/>
            {chat.message}</Text>
        )}
        {chat.message != "" && chat.type=="message" &&(
          <Text style={getStyles(mode).chatText}>
            {chat.message}</Text>
        )}

        <View style={[tStyles.row, tStyles.endx, { marginTop: 3 }]}>
          
          <Text style={[getStyles(mode).chatTime]}>
            {moment(chat.TSSent).format('D MMM, HH:mm')}
          </Text>
        </View>
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
    backgroundColor: '#e0e0e0',
    padding: 10,
    marginBottom: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
    width:"100%"
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  columna: {
    flex: 1, // 🔹 Cada columna ocupa el 50% del ancho
  },
});

export default TicketChat;