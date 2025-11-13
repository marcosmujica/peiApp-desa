import React, { useEffect, useState } from "react";
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
  Keyboard,
  LayoutAnimation,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProfile } from "../commonApp/profile";
import {
  Entypo,
  AntDesign,
  Ionicons,
  FontAwesome,
  MaterialIcons,
  Feather,
} from "@expo/vector-icons";
import { tStyles, colors } from "../common/theme";
import moment from "moment";
import { getStyles } from "../styles/chatdetails";
import { TICKET_CHAT } from "../commonApp/dataTypes";
import AppContext from "../context/appContext";
import TitleBar from "../components/TitleBar";
import SlideOptions from "../components/SlideOptions";
import { db_getTicketChat, db_getTicketInfo, db_addTicketChat } from "../commonApp/database";
import { getContactName } from "../commonApp/contacts";

const ChatDetails = ({ navigation, route }) => {
  // get ids from route params (if any)
  const idTicket = route?.params?.idTicket || "";
  const [idUserTo, setIdUserTo] = useState ("") // mm - usuario destinatario
  const [chatData, setChatData] = useState([]);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketUsername, setTicketUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");

  const mode = useColorScheme();
  const behavior = Platform.OS === "ios" ? "height" : "padding";
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const CHAT_INPUT_AREA_HEIGHT = 90; // approximate height of input + safe area
  const flatRef = React.useRef(null);
  const contentHeightRef = React.useRef(0);
  const { options, setOptions, showAlertModal } = React.useContext(AppContext);

  let profile = getProfile();
  useEffect(() => {
    loadData();

    return () => {
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []);

  useEffect(() => {
    const onShow = (e) => {
      const h = e.endCoordinates ? e.endCoordinates.height : 0;
      // animate layout shift a bit for smoother UI
      try { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); } catch (e) {}
      setKeyboardHeight(h);
      // autoscroll to bottom when keyboard opens
      try {
        if (flatRef.current) {
          setTimeout(() => {
            try { flatRef.current.scrollToEnd({ animated: true }); } catch(e) {}
          }, 120);
        }
      } catch (e) {}
    };
    const onHide = () => {
      try { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); } catch (e) {}
      setKeyboardHeight(0);
    };

    const subShow = Keyboard.addListener('keyboardDidShow', onShow);
    const subHide = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      let ticket = await db_getTicketInfo (idTicket);
      setTicketTitle (ticket.title)

      let idUserTo = ticket.idUserFrom == profile.idUser ? ticket.idUserTo : ticket.idUserFrom
      setIdUserTo (idUserTo)
      setTicketUsername( getContactName (idUserTo).name)

      let data = await db_getTicketChat(idTicket);
      data.map (item => item.id = item.TSSent + item.idTicket)
      // mm - ordeno los mensajes desc
      data.sort((a, b) => new Date(a.TSSent) - new Date(b.TSSent));

      setChatData(data);
      // scroll to bottom after load
        setTimeout(() => {
          try { if (flatRef.current) flatRef.current.scrollToEnd({ animated: true }); } catch(e) {}
        }, 150);
      
    }
    catch(e) {console.log (e)}
    finally {
      setLoading(false);
    }
  }

  // send message handler: persist to DB, clear input and reload list
  async function handleSendMessage() {
    try {
      const text = (messageText || "").trim();
      if (text.length === 0) return;

      const msg = new TICKET_CHAT();
      msg.message = text;
      msg.idTicket = idTicket;
      msg.idUserFrom = profile.idUser;
      msg.idUserTo = idUserTo;
      msg.TSSent = new Date();

      await db_addTicketChat(msg);

      msg.id = msg.TSSent + msg.idTicket
      
      setMessageText("");
      setChatData(prev => [...prev, msg]);
    } catch (e) {
      console.log('handleSendMessage error', e);
      if (showAlertModal) showAlertModal('Error', 'No se pudo enviar el mensaje');
    }
  }

  
  return (
    <SafeAreaView
      edges={["top", "right", "left"]}
      style={getStyles(mode).container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // use padding on iOS, on Android rely on keyboard listeners to position the input
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <TitleBar title={ticketTitle} subtitle={ticketUsername} goBack={true} idAvatar={idUserTo} />
        {/* Top Bar  */}
        <View style={getStyles(mode).topBar}>
        {/* Chats Listing */}
        <View style={{ flex: 1 }}>
      <FlatList
                showsVerticalScrollIndicator={false}
                bounces={false}
                data={chatData}
                keyExtractor={(item) => item.id}
                ref={flatRef}
                renderItem={({ item }) => <ChatItem chat={item} idUser={idUserTo} />}
        contentContainerStyle={[
          getStyles(mode).chatListing,
          { flexGrow: 1, justifyContent: 'flex-end', paddingBottom: Math.max(20, keyboardHeight + CHAT_INPUT_AREA_HEIGHT) }
        ]}
                onContentSizeChange={(w, h) => { contentHeightRef.current = h }}
            />

          {/* New Chat Input */}
          <View
            style={[getStyles(mode).chatInputHolder, { bottom: keyboardHeight}]}
            pointerEvents="box-none"
            >
            <View style={getStyles(mode).chatInput}>
              <TouchableOpacity>
                <MaterialIcons
                  name="insert-emoticon"
                  size={20}
                  color={mode == "dark" ? colors.gray30 : null}
                  />
              </TouchableOpacity>

              <TextInput
                placeholder="Message"
                style={getStyles(mode).chatInputText}
                placeholderTextColor={mode == "dark" ? colors.gray30 : null}
                value={messageText}
                onChangeText={setMessageText}
                onSubmitEditing={async () => {
                    // send on keyboard submit
                    await handleSendMessage();
                }}
                returnKeyType="send"
                />

              <TouchableOpacity>
                <Feather
                  name="camera"
                  size={20}
                  color={mode == "dark" ? colors.gray30 : null}
                  />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={getStyles(mode).sendBtn} onPress={handleSendMessage}>
              <FontAwesome name="send" size={20} />
            </TouchableOpacity>
          </View>
                  </View>
        </View>
       </KeyboardAvoidingView>
    </SafeAreaView>
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

        {chat.message != "" && chat.type == "status" && (
          <Text style={[getStyles(mode).chatText, { color: colors.primary }]}>
            <FontAwesome name="check" size={12} style={{ paddingRight: 8 }} />
            {chat.message}
          </Text>
        )}
        {chat.message != "" && chat.type == "message" && (
          <Text style={getStyles(mode).chatText}>{chat.message}</Text>
        )}

        <View style={[tStyles.row, tStyles.endx, { marginTop: 3 }]}>
          <Text style={[getStyles(mode).chatTime]}>
            {moment(chat.TSSent).format("D MMM, HH:mm")}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ChatDetails;
