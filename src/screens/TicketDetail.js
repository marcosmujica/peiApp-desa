import React, { useState, useEffect } from "react";
import {
  View,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,

} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tStyles, colors } from "../common/theme";
import { getStyles } from "../styles/chatdetails";
import AppContext from "../context/appContext";
import Loading from "../components/Loading";
import TitleBar from "../components/TitleBar";
import BadgeBtn from "../components/BadgeBtn";
import TicketInfo from "../components/TicketInfo";
import TicketEdit from "../components/TicketEdit";
import TicketChat from "../components/TicketChat";
import TicketLog from "../components/TicketLog";
import { db_getTicket } from "../commonApp/database";
import { isMe } from "../commonApp/profile";
import { getContactName } from "../commonApp/contacts";

//import { ModalSlideFromBottomIOS } from '@react-navigation/stack/lib/typescript/src/TransitionConfigs/TransitionPresets';

const TicketDetail = ({ navigation, route }) => {
  const mode = useColorScheme();
  const behavior = Platform.OS === "ios" ? "height" : "padding";
  const { options, setOptions, showAlertModal } = React.useContext(AppContext);

  const [idTicket] = useState(route.params["idTicket"]);
  const [idUserTo, setIdUserTo] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeActive, setCodeActive] = useState("");

  const [buttons, setButtonsStatus] = useState([
      {
        id: "INFO",
        title: "Info",
        active: true,
        onClick: () => viewInfo(),
      },
      {
        id: "CHAT",
        title: "Chat",
        active: false,
        onClick: () => viewChat(),
      },
      {
        id: "LOG",
        title: "Cambios",
        active: false,
        onClick: () => viewLog(),
      },{
        id: "EDIT",
        title: "Datos",
        active: false,
        onClick: () => viewEdit(),
      },]);

  const [isShowInfo, setIsShowInfo] = useState(false);
  const [isShowChat, setIsShowChat] = useState(false);
  const [isShowLog, setIsShowLog] = useState(false);
  const [isShowEdit, setIsShowEdit] = useState(false);

  function viewLog() {
    setCodeActive ("LOG")
    setIsShowLog(true);
    setIsShowInfo(false);
    setIsShowChat(false);
    setIsShowEdit(false);
  }
  function viewEdit() {
    setCodeActive ("EDIT")
    setIsShowLog(false);
    setIsShowInfo(false);
    setIsShowChat(false);
    setIsShowEdit(true);
  }
  function viewInfo() {
    setCodeActive ("INFO")
    setIsShowInfo(true);
    setIsShowLog(false);
    setIsShowEdit(false);
    setIsShowChat(false);
  }
  function viewChat() {
    navigation.navigate("ChatDetails", {idTicket: idTicket})
    viewInfo()
  }

  async function loadTicket()
  {
    try {
      let aux = await db_getTicket (idTicket)
      if (!aux) return

      //mm - si el ticket lo cree yo el usuario es el otro
      setIdUserTo (isMe (aux.idUserCreatedBy) ? aux.idUserTo : aux.idUserFrom)

      setTicketName (aux.title)


    } catch (e) {console.log ("error loadticket");console.log (e)}
  }

  useEffect(() => {

    loadTicket ()
    viewInfo ()
  
    return () => {
      console.log("🧹 Componente desmontado");
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)

  return (
    <SafeAreaView
      edges={["top", "right", "left", "bottom"]}
      style={getStyles(mode).container}
    >
      <Loading loading={loading} title="Buscando..." />
      <KeyboardAvoidingView behavior={behavior} style={[tStyles.flex1]}>
        {/* Top Bar  */}
        <TitleBar title={ticketName} subtitle={getContactName(idUserTo)} goBack={true} options={[]} idAvatar={idUserTo} detail={false}/>
        <View style={{ padding: 10 }}>
          <BadgeBtn idActive={codeActive}  items={buttons}></BadgeBtn>
        </View>
        <View>
        <View
          // Use 'inert' to prevent focus and interaction when not active (supported in web)
          {...(!isShowInfo ? { inert: "true" } : {})}
          accessibilityElementsHidden={!isShowInfo}
          importantForAccessibility={isShowInfo ? "yes" : "no-hide-descendants"}
        >
          {isShowInfo && <TicketInfo idTicket={idTicket}></TicketInfo>}
        </View>
        <View
          {...(!isShowChat ? { inert: "true" } : {})}
          accessibilityElementsHidden={!isShowChat}
          importantForAccessibility={isShowChat ? "yes" : "no-hide-descendants"}
        >
          {isShowChat && <TicketChat idTicket={idTicket}></TicketChat>}
        </View>
        <View
          {...(!isShowLog ? { inert: "true" } : {})}
          accessibilityElementsHidden={!isShowLog}
          importantForAccessibility={isShowLog ? "yes" : "no-hide-descendants"}
        >
          {isShowLog && <TicketLog idTicket={idTicket}></TicketLog>}
        </View>
        <View
          {...(!isShowEdit ? { inert: "true" } : {})}
          accessibilityElementsHidden={!isShowEdit}
          importantForAccessibility={isShowEdit ? "yes" : "no-hide-descendants"}
        >
          {isShowEdit && <TicketEdit idTicket={idTicket}></TicketEdit>}
        </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


export default TicketDetail;
