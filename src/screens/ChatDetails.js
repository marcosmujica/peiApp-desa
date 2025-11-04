import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  Keyboard,
  LayoutAnimation,
  TouchableOpacity,
  Image,
  SectionList,
  TextInput,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Text,
  InteractionManager,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { v4 as uuidv4 } from "uuid";
import { getFileAndUpload, uploadFileToServer } from "../commonApp/attachFile";
import { displayTime, ellipString } from "../common/helpers";

import {
  Fontisto,
  Entypo,
  AntDesign,
  Ionicons,
  FontAwesome,
  MaterialIcons,
  Feather,
} from "@expo/vector-icons";
import { tStyles, colors } from "../common/theme";
import moment from "moment";
import "moment/locale/es";
moment.locale("es");
import { getStyles } from "../styles/chatdetails";
import AppContext from "../context/appContext";
import { getProfile, isMe } from "../commonApp/profile";
import SlideOptions from "../components/SlideOptions";
import { TICKET_CHAT } from "../commonApp/dataTypes";
import {
  db_addTicketChat,
  db_getTicket,
  db_getTicketChat,
  db_TICKET_CHAT
} from "../commonApp/database";
import TitleBar from "../components/TitleBar";
import { getContactName } from "../commonApp/contacts";
import {
  URL_FILE_DOWNLOAD,
  URL_FILE_NORMAL_PREFIX,
  URL_FILE_SMALL_PREFIX,
  URL_FILE_UPLOAD,
} from "../commonApp/constants";
import { MediaPicker } from "../commonApp/mediaPicker";
import AttachmentPickerHost, {
  hideAttachmentPicker,
  showAttachmentPicker,
} from "../components/AttachmentPicker";
import Loading from "../components/Loading";
import MediaViewer from "../components/MediaViewer";
import { onEvent, offEvent, EVENT_DB_CHANGE } from '../commonApp/DBEvents';

const ChatDetails = ({ navigation, route }) => {
  const idTicket = route?.params?.idTicket || "";
  const [idUserTo, setIdUserTo] = useState(""); // mm - usuario destinatario
  const [chatData, setChatData] = useState([]);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketUsername, setTicketUsername] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);
  const [viewerMediaType, setViewerMediaType] = useState(null);

  const openViewer = (filename, mediaType) => {
    navigation.navigate("Viewer", { filename: filename, mediaType: mediaType });
  };

  // send message handler: persist to DB, clear input and reload list
  async function sendMsg() {
    try {
      const text = (messageText || "").trim();
      if (text.length === 0) return;

      const msg = new TICKET_CHAT();
      msg.message = text;
      msg.idTicket = idTicket;
      msg.idUserFrom = profile.idUser;
      msg.idUserTo = idUserTo;
      msg.TSSent = new Date();

      setMessageText("");
      
      // mm - guardar en la base de datos, el evento EVENT_NEW_DOC lo agregará a la lista
      await db_addTicketChat(msg);
    } catch (e) {
      console.log("handleSendMessage error", e);
      if (showAlertModal)
        showAlertModal("Error", "No se pudo enviar el mensaje");
    }
  }

  const mode = useColorScheme();
  // use 'position' on iOS so absolute-positioned input moves with KeyboardAvoidingView
  const behavior = Platform.OS === "ios" ? "position" : "padding";
  // offset so KeyboardAvoidingView accounts for title bar / header height
  const keyboardVerticalOffset = Platform.OS === "ios" ? 80 : 0;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const CHAT_INPUT_AREA_HEIGHT = 90; // approximate height of input + safe area
  // footer height: on Android we need to add keyboardHeight because input is relative;
  // on iOS KeyboardAvoidingView moves the absolute input, so don't double-add.
  const footerHeight =
    Platform.OS === "android"
      ? CHAT_INPUT_AREA_HEIGHT 
      : CHAT_INPUT_AREA_HEIGHT;
  const sectionListRef = React.useRef(null);
  const [sections, setSections] = useState([]);
  const contentHeightRef = React.useRef(0);
  const textInputRef = React.useRef(null);
  const idTicketRef = React.useRef(idTicket); // mm - ref para mantener el idTicket actual
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojis = [
    "😀",
    "😂",
    "😍",
    "👍",
    "🎉",
    "😢",
    "😮",
    "🙏",
    "😅",
    "😉",
    "🤔",
    "😎",
    "😄",
    "😁",
    "😆",
    "",
    "🙂",
    "🙃",
    "😋",
    "😛",
    "😜",
    "🤪",
    "🤩",
    "😇",
    "🥰",
    "😤",
    "😠",
    "",
    "😴",
    "🤤",
    "😬",
    "🤥",
    "😬",
    "😶",
    "🙈",
    "🙉",
    "🙊",
    "💪",
    "",
    "🤝",
    "👌",
    "✌️",
    "🤟",
    "🖐️",
    "👋",
    "🔥",
  ];
  const { options, setOptions, showAlertModal } = React.useContext(AppContext);

  let profile = getProfile();
  
 
  useEffect(() => {
    idTicketRef.current = idTicket;

    loadData();
    const onShow = (e) => {
      const h = e.endCoordinates ? e.endCoordinates.height : 0;
      // animate layout shift a bit for smoother UI
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch (e) {}
      setKeyboardHeight(h);
      // autoscroll to bottom when keyboard opens
      try {
        if (sectionListRef.current) {
          setTimeout(() => {
            try {
              scrollToBottom();
            } catch (e) {}
          }, 120);
        }
      } catch (e) {}
    };
    const onHide = () => {
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch (e) {}
      setKeyboardHeight(0);
    };
    
    const off = onEvent(EVENT_DB_CHANGE, (doc) => {
      try {
        // mm - validar que el documento sea del tipo correcto y para este chat
        console.log ("entro un cambio")
        console.log (doc )
        if (doc?.table !== db_TICKET_CHAT || doc?.data?.idTicket !== idTicketRef.current) {
          return;
        }

        // mm - agregar el mensaje si no existe ya
        setChatData((prev) => {
          // Verificar si ya existe en el array actual por id
          const exists = prev.some((item) => item.id === doc.data.id);
          
          if (exists) {
            console.log(`Mensaje duplicado evitado: ${doc.data.id}`);
            return prev;
          }

          // mm - marcar si el mensaje es del usuario actual
          const newMessage = { ...doc.data, me: isMe(doc.data.idUserFrom) };
          console.log(`Nuevo mensaje agregado: ${newMessage.id}`);


          // mm - si el chat no lo envie yo lo guardo asi no espera a la sincro
          if (!isMe(doc.data.idUserFrom)) saveMsg (doc)

          // mm- lo hago aca para hacer el await
          async function saveMsg (doc) {await db_addTicketChat (doc)} 

          return [...prev, newMessage];
        });
      } catch (e) {
        console.log("error onevent chat:", e);
      }
    });

    const subShow = Keyboard.addListener("keyboardDidShow", onShow);
    const subHide = Keyboard.addListener("keyboardDidHide", onHide);

    return () => {
      if (off) off(); // mm - desuscribirse del evento
      subShow.remove();
      subHide.remove();
    };
  }, []); // mm - sin dependencias para que solo se suscriba UNA vez

  // recompute sections whenever chatData changes
  useEffect(() => {
    const grouped = {};
    chatData.forEach((item) => {
      const key = moment(item.TSSent).format("YYYY-MM-DD");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    const keys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
    const secs = keys.map((k) => ({ title: k, data: grouped[k] }));
    setSections(secs);
  }, [chatData]);

  // scroll to bottom whenever sections update
  useEffect(() => {
    if (!sectionListRef.current || sections.length === 0) return;
    // ensure layout/interactions finished then scroll
    InteractionManager.runAfterInteractions(() => {
      try {
        scrollToBottom();
      } catch (e) {}
    });
  }, [sections.length]);

  // mm - scroll al final cuando se carga el componente por primera vez
  useEffect(() => {
    if (chatData.length > 0 && sections.length > 0) {
      // Esperar un poco más para que el SectionList renderice completamente
      setTimeout(() => {
        try {
          scrollToBottom();
        } catch (e) {}
      }, 300);
    }
  }, [chatData.length > 0 && sections.length > 0]);

  const scrollToBottom = () => {
    try {
      const secCount = sections.length;
      if (!sectionListRef.current || secCount === 0) return;
      const lastSection = secCount - 1;
      const lastItemIndex = Math.max(
        0,
        (sections[lastSection].data || []).length - 1
      );
      // ensure layout finished
      InteractionManager.runAfterInteractions(() => {
        try {
          sectionListRef.current.scrollToLocation({
            sectionIndex: lastSection,
            itemIndex: lastItemIndex + 1,
            viewPosition: 1,
            animated: true,
          });
        } catch (e) {
          // fallback: try again after a short delay
          setTimeout(() => {
            try {
              sectionListRef.current.scrollToLocation({
                sectionIndex: lastSection,
                itemIndex: lastItemIndex,
                viewPosition: 1,
                animated: true,
              });
            } catch (e) {}
          }, 120);
        }
      });
    } catch (e) {}
  };

  async function loadData() {
    try {
      setLoading(true);
      let ticket = await db_getTicket(idTicket);
      setTicketTitle(ticket.title);

      let idUserTo = isMe(ticket.idUserFrom)
        ? ticket.idUserTo
        : ticket.idUserFrom;
      setIdUserTo(idUserTo);
      setTicketUsername(getContactName(idUserTo).name);

      let data = await db_getTicketChat(idTicket);
      data.map((item) => {
        item.me = isMe(item.idUserFrom);
      });

      // mm - ordeno ascendentemente por TSSent (más viejos primero)
      data = data.sort((a, b) => { 
        const dateA = new Date(a.TSSent).getTime();
        const dateB = new Date(b.TSSent).getTime();
        return dateA - dateB; // Orden ascendente (más viejos primero)
      });

      // mm - elimino duplicados por id
      const uniqueData = data.filter((item, index, self) => 
        index === self.findIndex((t) => t.id === item.id)
      );

      // set loaded chat data so UI can render
      setChatData(uniqueData || []);
      
      // mm - hacer scroll al final después de cargar datos
      setTimeout(() => {
        try {
          scrollToBottom();
        } catch (e) {
          console.log("Error scrollToBottom en loadData:", e);
        }
      }, 500);
    } catch (e) {
      console.log("loadData " + JSON.stringify(e));
    }
    setLoading(false);
  }
  // Unified handler: gallery / camera / file
  async function handleFile(media = "") {
    try {
      setLoading(true);

      if (media == "") {
        const res = await showAttachmentPicker();
        if (!res) return;
        media = res.type;
      }
      let uploadedFile = await getFileAndUpload(profile.idUser, false, media);

      if (!uploadedFile) {
        return;
      }

      const msg = new TICKET_CHAT();
      msg.type = "file";
      msg.message = "";
      msg.localUri = uploadedFile.fileName;
      msg.filename = uploadedFile.remotefilename;
      msg.TSSent = new Date();
      msg.idTicket = idTicket;
      msg.idUserFrom = profile.idUser;
      msg.idUserTo = idUserTo;
      msg.size = uploadedFile.size;
      msg.mediaType =
        uploadedFile.type ||
        (requested === "file" ? "application/pdf" : "image/jpeg");

      // mm - guardar en la base de datos, el evento EVENT_NEW_DOC lo agregará a la lista
      await db_addTicketChat(msg);
      
      setLoading(false);
    } catch (err) {
      console.log("handleFile error", err);
      if (showAlertModal)
        showAlertModal(
          "Error",
          "No se pudo agregar el archivo, por favor comprueba la conexion a Internet e intenta más tarde"
        );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      edges={["top", "right", "left", "bottom"]}
      style={getStyles(mode).container}
    >
      <KeyboardAvoidingView
        behavior={behavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={[tStyles.flex1]}
      >
        <TitleBar
          goBack={true}
          title={ellipString(ticketTitle, 20)}
          subtitle={getContactName (idUserTo)}
          idAvatar={idUserTo}
        />
        {/* debug view removed */}
        <Loading loading={isLoading} />

        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item, index) => item.id || `msg-${index}-${item.TSSent}`}
          showsVerticalScrollIndicator={false}
          // keep taps working on TextInput while keyboard is open
          keyboardShouldPersistTaps="handled"
          // allow interactive dismissal on iOS / smooth dismissal on drag
          keyboardDismissMode="interactive"
          stickySectionHeadersEnabled={true}
          onContentSizeChange={() => {
            try {
              scrollToBottom();
            } catch (e) {}
          }}
          renderSectionHeader={({ section }) => {
            // format title: Hoy / Ayer / full date
            const dateKey = section.title; // YYYY-MM-DD
            const m = moment(dateKey, "YYYY-MM-DD");
            const today = moment().startOf("day");
            let label = m.format("LL");
            if (m.isSame(today, "day")) label = "Hoy";
            else if (m.isSame(moment().subtract(1, "day"), "day"))
              label = "Ayer";
            return (
              <View style={{ alignItems: "center", paddingVertical: 6 }}>
                <View
                  style={{
                    backgroundColor: mode == "dark" ? "#2b2b2b" : "#eee",
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{
                      color: mode == "dark" ? "#fff" : "#333",
                      fontSize: 12,
                    }}
                  >
                    {label}
                  </Text>
                </View>
              </View>
            );
          }}
          renderItem={({ item, index, section }) => {
            const m = moment(section.title, "YYYY-MM-DD");
            const today = moment().startOf("day");
            let label = m.format("LL");
            if (m.isSame(today, "day")) label = "Hoy";
            else if (m.isSame(moment().subtract(1, "day"), "day"))
              label = "Ayer";
            // we don't show the per-item date for the first item to avoid duplicating the sticky header
            const showDate = false;
            const isLastSection =
              sections && sections.length
                ? section.title === sections[sections.length - 1].title
                : false;
            const isLast = isLastSection && index === section.data.length - 1;
            return (
              <ChatItem
                chat={item}
                onOpen={openViewer}
                showDate={showDate}
                dateLabel={label}
                isLast={isLast}
                onLastLayout={() => {
                  try {
                    scrollToBottom();
                  } catch (e) {}
                }}
              />
            );
          }}
          contentContainerStyle={getStyles(mode).chatListing}
          // reserve footer space dynamically so the list can scroll above the input + keyboard
          ListFooterComponent={<View style={{ height: 0 }} />}
        />

        {/* New Chat Input */}
        <View
          style={[
            getStyles(mode).chatInputHolder,
            // On iOS keep absolute so KeyboardAvoidingView with behavior='position' moves it.
            // On Android use relative positioning so behavior='padding' can push it above keyboard.
            Platform.OS === "ios"
              ? {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 50,
                }
              : { position: "relative" },
          ]}
        >
          {/* Emoji picker panel - shown above the input */}
          {showEmojiPicker && (
            <View
              style={[
                {
                  position: "absolute",
                  bottom: CHAT_INPUT_AREA_HEIGHT + 10,
                  left: 8,
                  right: 8,
                  backgroundColor: mode == "dark" ? "#1c1c1c" : "#fff",
                  borderRadius: 8,
                  padding: 8,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  zIndex: 1000,
                },
              ]}
            >
              {emojis.map((e, idx) => (
                <TouchableOpacity
                  // include the index so keys are always unique even when the same emoji appears twice
                  key={`${e}_${idx}`}
                  onPress={() => {
                    setMessageText((prev) => (prev || "") + e);
                    setShowEmojiPicker(false);
                    try {
                      textInputRef.current && textInputRef.current.focus();
                    } catch (err) {}
                  }}
                  style={{ padding: 6 }}
                >
                  <Text style={{ fontSize: 20 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={getStyles(mode).chatInput}>
            <TouchableOpacity
              onPress={() => {
                setShowEmojiPicker((prev) => !prev);
              }}
            >
              <MaterialIcons
                name="insert-emoticon"
                size={20}
                color={mode == "dark" ? colors.gray30 : null}
              />
            </TouchableOpacity>

            <TextInput
              ref={textInputRef}
              placeholder="Mensaje"
              style={getStyles(mode).chatInputText}
              placeholderTextColor={mode == "dark" ? colors.gray30 : null}
              value={messageText}
              onChangeText={setMessageText}
            />

            <TouchableOpacity
              style={{ paddingRight: 20 }}
              onPress={() => handleFile("camera")}
            >
              <Feather
                name="camera"
                size={20}
                color={mode == "dark" ? colors.gray30 : null}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleFile()}>
              <Feather
                name="paperclip"
                size={20}
                color={mode == "dark" ? colors.gray30 : null}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={getStyles(mode).sendBtn} onPress={sendMsg}>
            <Fontisto name="angle-right" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <AttachmentPickerHost file={true} camera={true} gallery={true} />
    </SafeAreaView>
  );
};

const ChatItem = ({ chat, onOpen, showDate, dateLabel }) => {
  const mode = useColorScheme();
  const { width } = useWindowDimensions();
  if (chat.originalName == undefined) chat.originalName = "";

  return (
    <View>
      {showDate && (
        <View style={{ alignItems: "center", marginVertical: 8 }}>
          <View
            style={{
              backgroundColor: mode == "dark" ? "#2b2b2b" : "#eee",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 16,
            }}
          >
            <Text
              style={{ color: mode == "dark" ? "#fff" : "#333", fontSize: 12 }}
            >
              {dateLabel}
            </Text>
          </View>
        </View>
      )}
      <View
        style={[
          getStyles(mode).chatBubble,
          chat.me ? getStyles(mode).chatBubbleMe : null,
        ]}
      >
        {chat.type == "file" ? (
          <TouchableOpacity
            onPress={() => {
              onOpen &&
                onOpen(
                  URL_FILE_DOWNLOAD + URL_FILE_NORMAL_PREFIX + chat.filename,
                  chat.mediaType
                );
            }}
          >
            {chat.mediaType == "image" && (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#fff",
                  borderRadius: 10,
                  padding: 8,
                }}
              >
                <Image
                  source={{
                    uri:
                      URL_FILE_DOWNLOAD + URL_FILE_SMALL_PREFIX + chat.filename,
                  }}
                  style={{
                    width: 0.6 * width,
                    minHeight: 150,
                    borderRadius: 10,
                    backgroundColor: "#fff",
                  }}
                  resizeMode="cover"
                />
              </View>
            )}

            {chat.mediaType == "application/pdf" && (
              <View style={{ width: "100%" }}>
                <View
                  style={{
                    backgroundColor: colors.white,
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("../assets/pdfIcon.jpg")}
                    style={{
                      width: 50,
                      height: 70,
                      margin: 10,
                      borderRadius: 10,
                    }}
                    resizeMode="cover"
                  />
                </View>
                <View>
                  <Text style={getStyles(mode).chatText}>
                    {ellipString(chat.originalName, 35)}
                  </Text>
                  <Text
                    style={[getStyles(mode).chatText, { color: colors.gray50 }]}
                  >
                    {Math.round(chat.size / 1000)} kB - PDF
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <Text style={getStyles(mode).chatText}>{chat.message}</Text>
        )}

        <View style={[tStyles.row, tStyles.endx, { marginTop: 3 }]}>
          <Text style={[getStyles(mode).chatTime]}>
            {moment(chat.TSSent).format("HH:mm")}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ChatDetails;
