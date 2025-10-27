import React, { useEffect, useState } from "react";
import {
  Platform, Switch,StyleSheet, TextInput, View, Text, Modal, TouchableOpacity,
  useColorScheme, Keyboard, findNodeHandle} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import AppContext from "../context/appContext";
import { tStyles, colors, fonts } from "../common/theme";
import { getStyles } from "../styles/home";
import "../commonApp/global";
import { useNavigation } from "@react-navigation/native";
import { Fontisto } from "@expo/vector-icons";
import { validateNumeric, formatNumber } from "../commonApp/functions";
import { getProfile } from "../commonApp/profile";
import { TICKET, TICKET_LOG_DETAIL_STATUS } from "../commonApp/dataTypes";
import { currencyList } from "../commonApp/currency";
import {
  db_addTicketLogStatus,
  db_getTicket,
  db_updateTicket,
} from "../commonApp/database";
import {
  TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_NAME,
  TICKET_LOG_DETAIL_TYPE_CHANGE_DATA,
  TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_DESC,
  TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_DESC_PRIVATE,
  TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_AMOUNT,
  TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_REF,
  TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_PAY_INFO  
} from "../commonApp/constants";

const TicketEdit = ({ idTicket }) => {
  const navigation = useNavigation();
  const mode = useColorScheme();

  const [ticket, setTicket] = React.useState(new TICKET()); // mm - lo inicializo como ticket para no tener problema en el render al ser vacio
  const { showAlertModal } = React.useContext(AppContext);
  const [loading, setLoading] = React.useState("");
  const [ticketName, setTicketName] = React.useState("");
  const [ticketDesc, setTicketDesc] = React.useState("");
  const [ticketDescPrivate, setTicketDescPrivate] = React.useState("");
  const [ticketAmount, setTicketAmount] = useState(0);
  const [ticketRef, setTicketRef] = React.useState("");
  const [currencyName, setCurrencyName] = React.useState("");
  const [payMethodInfo, setPayMethodInfo] = React.useState("");
  const [isCollectionProcedure, setIsCollectionProcedure] = React.useState("");

  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = React.useRef(null);
  const payInputRef = React.useRef(null);

  const toggleCollectionProcedure = () => setIsCollectionProcedure((previousState) => !previousState);

  let profile = getProfile();

  useEffect(() => {
    loadData();

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates ? e.endCoordinates.height : 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      console.log("🧹 Componente TicketEdit desmontado");
      showSub.remove();
      hideSub.remove();
    };
  }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)


  async function loadData() {
    //setSelectedDate(new Date().toLocaleDateString());

    setLoading(true);

    let ticketAux = await db_getTicket(idTicket);

    setTicket(ticketAux); // mm - guardo una copia del original para analizar  los cambios
    setTicketName(ticketAux.title);
    setTicketDesc(ticketAux.note);
    setTicketDescPrivate(ticketAux.notePrivate);
    setPayMethodInfo(ticketAux.paymentInfo.paymentMethod);
    setTicketAmount(ticketAux.amount);
    setTicketRef(ticketAux.metadata.externalReference);
    setIsCollectionProcedure (ticketAux.collectionProcedure)
    setCurrencyName(
      currencyList.find((a) => a.currency_code == ticketAux.currency).name
    );

    //setTicket(ticketAux);
    setLoading(false);
  }

  async function addStatusLog(idStatus, message, data) {
    let ticketLog = new TICKET_LOG_DETAIL_STATUS();
    ticketLog.idTicket = idTicket;
    ticketLog.type = TICKET_LOG_DETAIL_TYPE_CHANGE_DATA; // mm - tipo de log de datos
    ticketLog.idStatus = idStatus;
    ticketLog.idUser = profile.idUser; // mm - usuario que hace el cambio de estado porque puede ser el cliente o el owner que lo hace
    ticketLog.isPrivate = true; // mm - si el estado solo puede verlo el creador
    ticketLog.message = message;
    ticketLog.data = data

    await db_addTicketLogStatus(ticketLog);
  }


  
  async function checkInfoAndSave() {
    if (ticketName.length == 0) {
      showAlertModal("Atención", "Por favor ingresa un titulo al ticket", {
        ok: true,
        cancel: false,
      });
      return;
    }

    if (!validateNumeric(ticketAmount)) {
      showAlertModal(
        "Atención",
        "Por favor ingresa un importe correcto al ticket",
        { ok: true, cancel: false }
      );
      return;
    }

    if (ticketAmount == 0) {
      showAlertModal("Atención", "Por favor ingresa un importe al ticket", {
        ok: true,
        cancel: false,
      });
      return;
    }

    setLoading(true);

    // mm - genero un nuevo log status segun si cambio el contenido anterior
    let aux= ticket

    let edit = false

    let noteAux = aux.note // mm - lo guardo porque lo cambio despues

    if (ticket.title != ticketName){edit = true; aux.title = ticketName}
    if (ticket.note != ticketDesc){edit = true; aux.note = ticketDesc; await addStatusLog(TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_DESC, `Se cambio la descripción\n\n-- Antes era \n${noteAux}\n\n-- Ahora es \n${ticketDesc}`, {note: ticketDesc})}
    if (ticket.notePrivate != ticketDescPrivate){edit = true; aux.notePrivate = ticketDescPrivate}
    if (ticket.amount != ticketAmount){edit = true; aux.amount = ticketAmount;await addStatusLog(TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_AMOUNT, "Se cambio el importe. Antes era " + ticket.currency + " "+ formatNumber(ticket.amount) + " y ahora es " + ticket.currency + " " +  formatNumber(ticketAmount), {amount: Number(ticketAmount)})}
    if (ticket.metadata.externalReference != ticketRef ){edit = true; aux.metadata.externalReference = ticketRef}
    if (ticket.paymentInfo.paymentMethod != payMethodInfo ){edit = true; aux.paymentInfo.paymentMethod = payMethodInfo; addStatusLog(TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_PAY_INFO , "Se cambio la información de pago a " + payMethodInfo, {payMethodInfo : payMethodInfo})}
    if (ticket.paymentInfo.paymentMethod != payMethodInfo ){edit = true; aux.paymentInfo.paymentMethod = payMethodInfo; addStatusLog(TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_PAY_INFO , "Se cambio la información de pago a " + payMethodInfo, {payMethodInfo : payMethodInfo})}
    if (ticket.collectionProcedure != isCollectionProcedure ){edit = true; aux.collectionProcedure = isCollectionProcedure;}

    if(edit) {
      console.log ("GRABAR")
      await db_updateTicket (idTicket, aux)}
    setLoading(false);
    navigation.goBack();
  }
  
  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      // Cuando el teclado está visible reducimos el paddingBottom para eliminar el hueco.
      contentContainerStyle={{ padding: 10, paddingBottom: keyboardHeight > 0 ? 20 : 100 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      // extraScrollHeight ajustado para empujar más la vista sobre el teclado (aumentar si sigue oculto)
      extraScrollHeight={Platform.OS === 'ios' ? 20 : 240}
      // Si la pantalla está dentro de un TabBar, ayuda a calcular el espacio disponible
      viewIsInsideTabBar={true}
      showsVerticalScrollIndicator={false}
    >
      {profile.idUser != ticket.idUserCreatedBy && (
        <View style={{ padding: 10 }}>
          <Text style={getStyles(mode).sectionTitle}>
            <Fontisto name="locked" size="10" />
            {"  "} Solo la persona que creo este ticket lo puede cambiar
          </Text>
        </View>
      )}
      {profile.idUser == ticket.idUserCreatedBy && (
        <View>
          <View style={{ padding: 10 }}>
            <Text style={getStyles(mode).sectionTitle}>Título</Text>
            <View style={getStyles(mode).searchBar}>
              <TextInput
                placeholder="título del ticket..."
                placeholderTextColor={colors.secondary}
                style={getStyles(mode).textInput}
                value={ticketName}
                onChangeText={setTicketName}
              />
            </View>
          </View>
          <View style={{ padding: 10 }}>
            <Text style={getStyles(mode).sectionTitle}>Detalle</Text>
            <View style={getStyles(mode).searchBar}>
              <TextInput
                placeholder="detalle del ticket..."
                placeholderTextColor={colors.secondary}
                style={getStyles(mode).textInput}
                multiline={true}
                numberOfLines={5}
                value={ticketDesc}
                onChangeText={setTicketDesc}
              />
            </View>
          </View>
          <View style={{ padding: 10 }}>
            <Text style={getStyles(mode).sectionTitle}>Nota Privada</Text>
            <View style={getStyles(mode).searchBar}>
              <TextInput
                placeholder="información que solo yo puedo ver..."
                placeholderTextColor={colors.secondary}
                style={getStyles(mode).textInput}
                multiline={true}
                numberOfLines={5}
                value={ticketDescPrivate}
                onChangeText={setTicketDescPrivate}
              />
            </View>
          </View>
          <View style={{ padding: 10 }}>
            <Text style={getStyles(mode).sectionTitle}>
              Texto de Referencia
            </Text>
            <View style={getStyles(mode).searchBar}>
              <TextInput
                placeholder="por ej FACTURA #2243..."
                placeholderTextColor={colors.secondary}
                style={getStyles(mode).textInput}
                value={ticketRef}
                onChangeText={setTicketRef}
              />
            </View>
          </View>
          <View style={{ padding: 10 }}>
            <Text style={getStyles(mode).sectionTitle}>
              Importe ({ticket.currency} - {currencyName})
            </Text>
            <View style={getStyles(mode).searchBar}>
              <TextInput
                placeholder="importe del ticket..."
                placeholderTextColor={colors.secondary}
                style={[getStyles(mode).textInput, {textAlign: "right" }]}
                value={ticketAmount}
                onChangeText={setTicketAmount}
                keyboardType="numeric"
              />
            </View>
            
          </View>
          <View style={{paddingBottom:20}}>
            <View style={[styles.row, ]}>
              <Text style={getStyles(mode).sectionTitle}>Ayúdame con este ticket</Text>
              <Switch value={isCollectionProcedure} onValueChange={toggleCollectionProcedure} trackColor={{ false: "#767577", true: "#b3b3b3ff" }} thumbColor={isCollectionProcedure ? "#aafdc2ff" : "#f4f3f4"} />
              </View>
              <View style={[styles.row, {padding:0, paddingHorizontal:10}]}>
                <Text style={getStyles(mode).subNormalText}>Usar un procedimiento para recordar el pago o cobro de este ticket</Text>
              </View>
          </View>
          <View style={{ padding: 10 }}>
            <Text style={getStyles(mode).sectionTitle}>
              Instrucciones de Pago
            </Text>
            <View style={getStyles(mode).searchBar}>
              <TextInput
                placeholder="instrucciones de pago..."
                multiline={true}
                numberOfLines={5}
                placeholderTextColor={colors.secondary}
                style={getStyles(mode).textInput}
                value={payMethodInfo}
                ref={payInputRef}
                onFocus={() => {
                  if (scrollRef && scrollRef.current && payInputRef.current) {
                    try {
                      scrollRef.current.scrollToFocusedInput(findNodeHandle(payInputRef.current));
                    } catch (e) {
                      // ignore
                    }
                  }
                }}
                onChangeText={setPayMethodInfo}
              />
            </View>
          </View>
          <View style={{ paddingHorizontal: 15, marginBottom: 15 }}>
            <TouchableOpacity
              style={styles.agreeBtn}
              onPress={() => checkInfoAndSave()}
            >
              <Text
                style={[fonts.medium, { color: colors.white, fontSize: 13 }]}
              >
                Guardar los cambios que hice
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAwareScrollView>
  );
};
const styles = StyleSheet.create({
  agreeBtn: {
    width: "100%",
    backgroundColor: colors.primary,
    ...tStyles.centery,
    paddingVertical: 12,
    borderRadius: 30,
  },
  cancelBtn: {
    width: "100%",
    backgroundColor: colors.cancel,
    ...tStyles.centery,
    paddingVertical: 12,
    borderRadius: 30,
  },
  contenedor: {
    flexDirection: "row", // 📌 Esto alinea horizontalmente
    alignItems: "center", // 📌 Centra verticalmente
  },
  imagen: {
    width: 50,
    height: 50,
    marginRight: 10, // 📌 Espacio entre imagen y texto
    borderRadius: 25, // Para hacerlo redondo si es un avatar
  },
  texto: {
    fontSize: 16,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 0,
    borderBottomColor: "#ccc",
  },
  label: {
    fontSize: 16,
  },
});

export default TicketEdit;
