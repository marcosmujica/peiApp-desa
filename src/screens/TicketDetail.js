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
import { TICKET } from "../commonApp/dataTypes";
import { useReducedMotion } from "react-native-reanimated";

//import { ModalSlideFromBottomIOS } from '@react-navigation/stack/lib/typescript/src/TransitionConfigs/TransitionPresets';

const TicketDetail = ({ navigation, route }) => {
  const mode = useColorScheme();
  const behavior = Platform.OS === "ios" ? "height" : "padding";

  const [idTicket] = useState(route.params["idTicket"]);
  const [idUserTo, setIdUserTo] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeActive, setCodeActive] = useState("");

  // mm - convertir ticket a estado para mantener el valor actualizado
  const [ticket, setTicket] = useState(new TICKET());
  const [options, setOptions] = useState ([])

  const [buttons, setButtonsStatus] = useState([])

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

  async function duplicateTicket()
  {
    console.log ("params duplicar ticket")
    console.log ("idUserTo:", idUserTo)
    console.log ("ticket:", ticket)
    // mm - asegurar que idUserTo tenga valor antes de navegar
    if (!idUserTo) {
      console.warn("idUserTo está vacío");
      return;
    }
    navigation.navigate ("NewTicket", {ticketDefault: ticket, idTicketGroup: "", usersList: [idUserTo]})
  }

  async function loadTicket()
  {
    try {
      let aux = await db_getTicket (idTicket)
      
      if (!aux) return

      console.log ("Ticket cargado:", aux)
      //mm - si el ticket lo cree yo el usuario es el otro
      const userTo = isMe (aux.idUserCreatedBy) ? aux.idUserTo : aux.idUserFrom;
      setIdUserTo (userTo)
      console.log ("idUserTo establecido:", userTo)
      
      // mm - usar una función arrow que lea el estado actual cuando se ejecute
      setOptions (!isMe (aux.idUserCreatedBy) ? [ ]: [{name:"copy", onClick: () => {
        navigation.navigate ("NewTicket", {ticketDefault: aux, idTicketGroup: "", usersList: [userTo]})
      }}])

      // mm - actualizar el estado del ticket
      setTicket(aux)
      setTicketName (aux.title)

      let buttonsList = []
      buttonsList.push ({id: "INFO", title: "Info", active: true, onClick: () => viewInfo()})

      if (aux.idUserTo !="") buttonsList.push ({id: "CHAT", title: "Chat", active: false, onClick: () => viewChat()})

      buttonsList.push ( {id: "LOG",title: "Cambios", active: false, onClick: () => viewLog()})
      buttonsList.push ( {id: "EDIT", title: "Datos", active: false, onClick: () => viewEdit()})

      setButtonsStatus (buttonsList)
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
        <TitleBar title={ticketName} subtitle={getContactName(idUserTo)} goBack={true} idAvatar={idUserTo} detail={false} options={options}/>
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
