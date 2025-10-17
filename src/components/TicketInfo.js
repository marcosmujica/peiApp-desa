import React, { useEffect, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, FlatList, ScrollView, TextInput, View, Text, TouchableOpacity, KeyboardAvoidingView, useColorScheme } from "react-native";
import { getContactName } from "../commonApp/contacts";
import AppContext from "../context/appContext";
import Hr from "../components/Hr";
import { tStyles, colors, fonts } from "../common/theme";
import { getStyles } from "../styles/home";
import "../commonApp/global";
import { useNavigation } from "@react-navigation/native";
import { displayTime, ellipString } from "../common/helpers";
import { Ionicons, Feather, Fontisto } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import DropDownList from "../components/DropDownList";
import { duplicateTicket, formatDateToText, formatDateToStringLong, formatNumber, diasEntreFechas } from "../commonApp/functions";
import Loading from "../components/Loading";
import { getFileAndUpload, uploadFileToServer } from "../commonApp/attachFile";
import { getProfile } from "../commonApp/profile";
import BadgeBtn from "../components/BadgeBtn";
import DateBtn from "../components/DateBtn";
import { TICKET, TICKET_LOG_DETAIL_STATUS } from "../commonApp/dataTypes";
import moment from "moment";
import { db_getTicketRating, db_getTicketLog, db_addTicketLogStatus, db_getTicket, db_updateTicket, db_updateTicketRating, db_getTicketLogByStatus, db_getTicketInfo, db_updateTicketInfo } from "../commonApp/database";
import {
  TICKET_TYPE_COLLECT,
  TICKET_TYPE_PAY,
  EXPENSES_CATEGORY,
  TICKET_DETAIL_ACCEPTED_STATUS,
  TICKET_DETAIL_CHANGE_DUE_DATE_STATUS,
  TICKET_DETAIL_DISPUTE_STATUS,
  TICKET_DETAIL_PAY_STATUS,
  TICKET_DETAIL_CANCELED_STATUS,
  TICKET_DETAIL_PAYED_STATUS,
  TICKET_INFO_TYPE_USE_TYPE,
  TICKET_DETAIL_CLOSED_STATUS,
  PAY_METHOD,
  URL_FILE_DOWNLOAD,
  URL_FILE_SMALL_PREFIX,
  TICKET_INFO_TYPE_PAY,
  TICKET_INFO_TYPE_PAY_PLANNED,
  TICKET_INFO_TYPE_PAY_IMPULSIVED,
  TICKET_INFO_TYPE_PAY_UNEXPECTED,
  TICKET_USE_TYPE_PERSONAL,
  TICKET_USE_TYPE_BUSINESS,
  TICKET_USE_TYPE_SHARED,
} from "../commonApp/constants";
import ImgAvatar from "./ImgAvatar";
import AttachmentPickerHost, { hideAttachmentPicker, showAttachmentPicker } from "../components/AttachmentPicker";

const TicketInfo = ({ idTicket }) => {
  const navigation = useNavigation();
  const mode = useColorScheme();
  let profile = getProfile();

  const [ticket, setTicket] = React.useState(new TICKET()); // mm - lo inicializo como ticket para no tener problema en el render al ser vacio
  const [payType, setPayType] = React.useState(); // mm - si es una compra planeada o impulsiva
  const [useType, setUseType] = React.useState(); // mm - si es personal o para el negocio
  const [expensesCategory, setExpensesCategory] = React.useState(); // mm - si es personal o para el negocio
  const { showAlertModal } = React.useContext(AppContext);
  const [isLoading, setLoading] = React.useState("");
  const [ticketNote, setTicketNote] = React.useState(""); // mm - lo dejo sin estado al principio para que el usuario se obligue a marcarlo
  const [ticketPay, setPay] = React.useState(0);
  const [rating, setRating] = React.useState(0);
  const [dueDate, setDueDate] = React.useState(new Date());
  const [initialDueDate, setInitialDueDate] = React.useState(new Date());
  const [dueDateText, setDueDateText] = React.useState("");
  const [isTicketOwner, setIsTicketOwner] = React.useState(false);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [partialAmount, setPartialAmount] = useState(0);
  const [contactName, setContactName] = useState("");
  const [contactId, setContactId] = useState("");
  const [payList, setPayList] = useState([]); // mm - lista de pagos realizados)
  const [isPayDetail, setIsPayDetail] = useState(false); // mm - lista de pagos realizados)
  const [isShowInfo, setIsShowInfo] = useState(false); // mm - lista de pagos realizados)
  const [isShowMenuList, setIsShowMenuList] = useState(true);
  const [payAttachment, setPayAttachment] = useState(false);
  const [payAttachmentFilename, setPayAttachmentFilename] = useState("");
  const behavior = Platform.OS === "ios" ? "height" : "padding";
  const [payMethod, setPayMethod] = useState(""); /// mm - por donde se paga

  function selectedPayMethod(item) {
    setPayMethod(item);
  }

  async function setTicketRating(star) {
    setRating(star);
    await db_updateTicketRating(idTicket, star);
  }

  function changeTicketStatus(code) {
    setIsShowMenuList(false);
    setTicket((prev) => ({ ...prev, status: code }));
    setShowConfirmButton(true);
  }

  async function setUseTypeOption (option)
  {
    let aux = await db_updateTicketInfo (idTicket, profile.idUser, TICKET_INFO_TYPE_USE_TYPE, {useType:option})
    setUseType (option)
  }

  async function setPayTypeOption (option)
  {
    let aux = await db_updateTicketInfo (idTicket, profile.idUser, TICKET_INFO_TYPE_PAY, {type:option})
    setPayType (option)
  }

  useEffect(() => {
    loadData();

    return () => {
      console.log("🧹 Componente desmontado TicketInfo");
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)

  const openViewer = (filename) => {
    navigation.navigate("Viewer", { filename: filename });
  };

  function saveStatus() {
    if (ticket.status == TICKET_DETAIL_DISPUTE_STATUS && ticketNote == "") {
      showAlertModal("Atención", "Por favor ingresa una nota comentando de porqué está en disputa el ticket", { ok: true });
      return;
    }

    if (ticket.status == TICKET_DETAIL_CANCELED_STATUS && ticketNote == "") {
      showAlertModal("Atención", "Por favor ingresa una nota comentando porque cancelas el ticket", { ok: true });
      return;
    }

    // mm - si no se ingresa monto o si el monto es mayor que el el total
    if (ticket.status == TICKET_DETAIL_PAY_STATUS && ticketPay == 0 && ticketPay + partialAmount <= ticket.amount) {
      showAlertModal("Atención", "Por favor ingresa el importe pagado, asegurate de que no exceda el total del ticket.", {
        ok: true,
      });
      return;
    }

    if (ticket.status == TICKET_DETAIL_PAY_STATUS && payMethod == "") {
      // mm - nunca se seteo
      showAlertModal("Atención", "Por favor selecciona cómo hiciste el pago", {
        ok: true,
      });
      return;
    }

    if (ticket.status == TICKET_DETAIL_PAY_STATUS && isNaN(ticketPay)) {
      // mm - nunca se seteo
      showAlertModal("Atención", "Ingresa un importe correcto", {
        ok: true,
      });
      return;
    }

    let message = "";
    message = ticket.status == TICKET_DETAIL_CANCELED_STATUS ? "Se cancela el ticket " : message;
    message = ticket.status == TICKET_DETAIL_DISPUTE_STATUS ? "El ticket se encuentra en disputa por una de las partes" : message;
    message =
      ticket.status == TICKET_DETAIL_CHANGE_DUE_DATE_STATUS
        ? "Se cambió la fecha de pago del ticket del " + formatDateToStringLong(initialDueDate) + " al " + formatDateToStringLong(dueDate)
        : message;

    // mm - si salda la deuda lo marco como pagado
    if (ticket.status == TICKET_DETAIL_PAY_STATUS) {
      message = "Se realiza un pago por " + ticket.currency + " " + formatNumber(ticketPay) + " a través de " + payMethod.name;
      if (ticketPay + partialAmount >= ticket.amount) {
        // mm - si salda la deuda
        ticket.status == TICKET_DETAIL_PAYED_STATUS;
      }
    }

    try {
      let aux = new TICKET_LOG_DETAIL_STATUS();
      aux.idTicket = idTicket;
      aux.idStatus = ticket.status;
      aux.note = ""; // mm - por si quiere agregar algo al cambiar de estado
      aux.message = message;
      aux.note = ticketNote;
      aux.idUserFrom = profile.idUser;
      aux.idUserTo = ticket.idUserCreatedBy == profile.idUser ? ticket.idUserTo : ticket.idUserFrom; // mm - si soy el dueno se lo asigno al otro y viceversa
      aux.data.currency = ticket.currency;
      aux.data.amount = Number(ticketPay);
      aux.data.payMethod = payMethod.code;
      aux.data.dueDate = new Date(dueDate);

      if (!payAttachment) {
      } else {
        aux.data.mediaType = payAttachment.type;
        aux.data.uri = payAttachment.remotefilename;
      }

      db_addTicketLogStatus(aux);
    } catch (e) {
      console.log(e);
    }
    navigation.goBack();
  }

  async function attachPayment() {
    try {
      setPayAttachmentFilename("");
      setPayAttachment({});
      
      const res = await showAttachmentPicker();
      if (!res) {
        console.log("No se seleccionó ninguna opción");
        return;
      }

      setLoading(true);
      let uploadedFile = await getFileAndUpload(profile.idUser, false, res.type);

      setLoading(false);
      if (!uploadedFile) return;
      setPayAttachment(uploadedFile);
      setPayAttachmentFilename(uploadedFile.fileName);
    } catch (e) {
      console.log("attachpayment: " + JSON.stringify(e));
      setLoading(false);
    }
  }

  function OnSelectedDueDate(date) {
    setDueDate(date);
  }

  async function onSelectedExpensesCategory(expenses) {
    let aux = await db_updateTicketInfo (idTicket, profile.idUser, TICKET_INFO_TYPE_PAY, {expensesCategory:expenses})
    setExpensesCategory (expenses)
  }

  function duplicateTicketInfo() {
    navigation.replace("NewTicket", {
      idTicketGroup: ticket.idTicketGroup,
      idTicketGroupBy: ticket.idTicketGroupBy,
      name: ticket.name,
      ticketDefault: duplicateTicket(ticket),
    });
  }

  async function loadData() {
    try {
      setLoading(true);

      let ticketAux = await db_getTicket(idTicket);
      setTicket(ticketAux);
      setRating(await db_getTicketRating(idTicket));

      // mm - me fijo si soy el dueno muestro el del otro, sino muestro quien lo creo
      setContactId(ticketAux.idUserCreatedBy == profile.idUser ? ticketAux.idUserTo : ticketAux.idUserFrom);
      // Guardar solo el nombre para evitar renderizar objetos completos
      const contactObj = getContactName(ticketAux.idUserCreatedBy == profile.idUser ? ticketAux.idUserTo : ticketAux.idUserFrom);
      setContactName(contactObj && contactObj.name ? contactObj.name : "");
      // mm - lo guardo en una variable porque no le da el tiempo de guardarla y luego consultarla
      let dateAux = await db_getTicketLogByStatus(idTicket, TICKET_DETAIL_CHANGE_DUE_DATE_STATUS, "TS", "desc");
      let TSDueDateAux = dateAux.length == 0 ? new Date() : dateAux[0].data.dueDate

      // mm - conformo el partialamount segun los pagos hechos
      let payStatus = await db_getTicketLogByStatus(idTicket, TICKET_DETAIL_PAY_STATUS, "TS", "desc");
      let amount = 0;
      let payList = [];
      payStatus.forEach((element, index) => {
        console.log (element)
        payList.push({
          id: index,
          TSPay: element.data.TSPay,
          uri: element.data.uri,
          idUser: element.idUserFrom,
          currency: element.data.currency,
          dueDate: element.data.dueDate,
          amount: element.data.amount,
        });
        amount = amount + element.data.amount;
      });

      // mm - ordeno por fecha los resgistros de pago
      setPayList(payList.sort((a, b) => (a.TSPay < b.TSPay ? -1 : 1)));

      setPartialAmount(amount);
      setDueDateText(
        diasEntreFechas(TSDueDateAux) >= 0 ? "Faltan " + diasEntreFechas(TSDueDateAux) + " días, " + formatDateToText(TSDueDateAux) : "Venció hace " + Math.abs(diasEntreFechas(TSDueDateAux)) + " días"
      );
      setInitialDueDate(TSDueDateAux); // mm - la guardo por si la cambio despues
      setDueDate(TSDueDateAux);

      // mm - determino si quien me lo crea es quien creo del ticket
      setIsTicketOwner(ticketAux.idUserFrom == profile.idUser);
      // mm - no tomo el valor de isTicketOwner porque setIsTicketOwner no lo guarda en el momento, demora y al hacer la comprobacion me da erroneo
      if (ticketAux.idUserFrom != profile.idUser) {
        // mm - si otro me creo el ticket le pongo el valo inverso a pagar o cobrar
        ticketAux.way = ticketAux.way == TICKET_TYPE_COLLECT ? TICKET_TYPE_PAY : TICKET_TYPE_COLLECT;
      }

      // mm - proceso los valores particulares del usuario en el ticket
      let ticketInfo = await db_getTicketInfo(idTicket);
      if (ticketInfo.length>0) // mm - si tiene contenido
      {
        // mm - obtengo el registro de pago
        let aux = ticketInfo.find((item) => item.type == TICKET_INFO_TYPE_PAY);
        setPayType(aux.info.type);
        setExpensesCategory(aux.info.expensesCategory);

        // mm - obtengo el registro de tipo de gasto
        aux = ticketInfo.find((item) => item.type == TICKET_INFO_TYPE_USE_TYPE && item.idUser == profile.idUser);
        setUseType(aux ==undefined ? "" : aux.info.useType);
      }
    } catch (e) {
      showAlertModal("Error", "Existio un error al intentar recuperar el ticket. Por favor consulta más tarde.");
      console.log("Error loaddata: " + JSON.stringify(e));console.log(e);
    }
    setLoading(false);
  }

  async function acceptTicket() {
    try {
      let aux = new TICKET_LOG_DETAIL_STATUS();
      aux.idTicket = idTicket;
      aux.idStatus = TICKET_DETAIL_ACCEPTED_STATUS;
      aux.note = ""; // mm - por si quiere agregar algo al cambiar de estado
      aux.idUserFrom = profile.idUser;
      aux.idUserTo = ticket.idUserCreatedBy == profile.idUser ? ticket.idUserTo : ticket.idUserFrom; // mm - si soy el dueno se lo asigno al otro y viceversa
      aux.message = "Acepté el ticket";

      setTicket((prev) => ({ ...prev, status: aux.idStatus }));

      await db_addTicketLogStatus(aux);
    } catch (e) {
      console.log(e);
    }
  }

  function showTicketInfoDetail() {
    navigation.navigate("TicketResume", ticket);
  }

  async function closeTicketAlert(option) {
    if (option == "CANCEL") return;

    let aux = new TICKET_LOG_DETAIL_STATUS();
    aux.idTicket = idTicket;
    aux.idStatus = TICKET_DETAIL_CLOSED_STATUS;
    aux.note = ""; // mm - por si quiere agregar algo al cambiar de estado
    aux.idUserFrom = profile.idUser;
    aux.idUserTo = ticket.idUserCreatedBy == profile.idUser ? ticket.idUserTo : ticket.idUserFrom; // mm - si soy el dueno se lo asigno al otro y viceversa
    aux.message = "Se cerró el ticket";
    await db_addTicketLogStatus(aux);

    ticket.isOpen = false; // mm - doy por cerrado el ticket
    ticket.TSClosed = new Date();
    ticket.idUserClosed = profile.idUser;
    await db_updateTicket(idTicket, ticket);

    navigation.goBack();
  }
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(20, insets.bottom || 0) + 16;

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          padding: 10,
          paddingBottom: bottomPadding + 130,
        }}
        keyboardShouldPersistTaps="handled">
        <Loading loading={isLoading} />
      {ticket.amount != ticket.initialAmount && (
        <View style={[getStyles(mode).row, { backgroundColor: "#DAF7A6", marginBottom: 20, borderRadius: 25 }]}>
          <Text style={{ padding: 10, color: colors.gray75 }}>
            <Text style={{ color: colors.cancel }}>Cuidado! </Text>
            El monto actual del ticket fue cambiado. Inicialmente era de {ticket.currency} {formatNumber(ticket.amount)} y ahora es de {ticket.currency} {formatNumber(ticket.initialAmount)}
          </Text>
        </View>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginVertical: 10,
          justifyContent: "space-between",
        }}>
        <View style={{ justifyContent: "flex-start", flex: 1 }}>
          {ticket.way == TICKET_TYPE_COLLECT && (
            <TouchableOpacity style={[getStyles(mode).chatFilter, getStyles(mode).activeChatFilter]}>
              <Text style={[getStyles(mode).chatFilterText, getStyles(mode).activeChatFilterText]}>COBRAR</Text>
            </TouchableOpacity>
          )}

          {ticket.way == TICKET_TYPE_PAY && (
            <TouchableOpacity style={[getStyles(mode).chatFilter, getStyles(mode).activeChatFilter]}>
              <Text style={[getStyles(mode).chatFilterText, getStyles(mode).activeChatFilterText]}>
                <Text>PAGAR</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flex: 1, alignItems: "flex-end", justifyContent: "center" }}>
          <Text style={[getStyles(mode).bigText, { fontWeight: "bold", textAlign: "right" }]}>
            {ticket.currency} {formatNumber(ticket.amount)}
          </Text>
        </View>
      </View>
      {ticket.way == TICKET_TYPE_PAY && <View></View>}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginVertical: 10,
          justifyContent: "space-between",
        }}>
        <ImgAvatar size="30" id={contactId} />
        <Text style={getStyles(mode).screenSubTitle}>{ellipString(contactName, 20)}</Text>
        <View style={{ justifyContent: "flex-end", flexDirection: "row", flex: 1 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setTicketRating(star)} activeOpacity={0.7}>
              <Ionicons name={rating >= star ? "star" : "star-outline"} size={20} color={rating >= star ? colors.darkPrimary2 : colors.darkPrimary} style={{ marginHorizontal: 2 }} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View>
        {diasEntreFechas(initialDueDate) < 0 && ticket.isOpen && (
          <Text
            style={{
              padding: 5,
              fontSize: 15,
              fontWeight: "bold",
              color: colors.cancel,
            }}>
            {dueDateText}
          </Text>
        )}
        {diasEntreFechas(initialDueDate) >= 0 && ticket.isOpen && (
          <Text
            style={{
              fontSize: 15,
              padding: 5,
              fontWeight: "bold",
              color: colors.primary,
            }}>
            {dueDateText}
          </Text>
        )}
        {partialAmount < ticket.amount && (
          <View style={{ padding: 5 }}>
            <Text style={getStyles(mode).sectionTitle}></Text>
            <Text style={{ color: colors.gray50 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "bold",
                  color: colors.cancel,
                }}>
                <Text>
                  Todavía falta pagar: {ticket.currency} {formatNumber(ticket.amount - partialAmount)}
                </Text>
              </Text>
            </Text>
          </View>
        )}
      </View>
      <View style={getStyles(mode).row}>
        {!isShowInfo && (<View style={{ justifyContent: "flex-start", flex: 1 }}>
          <TouchableOpacity onPress={() => {setIsPayDetail(false); setIsShowInfo(true)}}>
            <Text style={[getStyles(mode).sectionTitle, { padding: 20 }]}>
              <Fontisto name="angle-dobule-down" /> Información
            </Text>
          </TouchableOpacity>
        </View>)}
        {isShowInfo  && (<View style={{ justifyContent: "flex-start", flex: 1 }}>
          <TouchableOpacity onPress={() => {setIsPayDetail(false); setIsShowInfo(false)}}>
            <Text style={[getStyles(mode).sectionTitle, { padding: 20 }]}>
              <Fontisto name="angle-dobule-up" /> Información
            </Text>
          </TouchableOpacity>
        </View>)}
        {!isPayDetail && payList.length > 0 && (
          <View style={{ justifyContent: "flex-end", flex: 1 }}>
            <TouchableOpacity onPress={() => {setIsPayDetail(true); setIsShowInfo(false)}}>
              <Text style={[getStyles(mode).sectionTitle, { padding: 20 }]}>
                <Fontisto name="angle-dobule-down" /> Pagos
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {isPayDetail && payList.length > 0 && (
          <View style={{ justifyContent: "flex-end", flex: 1 }}>
            <TouchableOpacity onPress={() =>{setIsPayDetail(false); setIsShowInfo(false)}}>
              <Text style={[getStyles(mode).sectionTitle, { padding: 20 }]}>
                <Fontisto name="angle-dobule-up" /> Pagos
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isPayDetail && (
        <View style={{ paddingBottom: 10 }}>
          <View style={getStyles(mode).chatListing}>
            {payList.map((item) => (
              <PayItem key={item.id} onOpen={openViewer} payItem={item} />
            ))}
          </View>
          <View
            style={{
              width: "100%",
              alignItems: "center",
              borderWidth: 1,
              borderRadius: 10,
              borderColor: colors.white,
            }}>
            <Text style={[getStyles(mode).normalText, { padding: 5 }]}>
              Total pagos: {ticket.currency} {formatNumber(payList.reduce((sum, item) => sum + item.amount, 0))}
            </Text>
          </View>
        </View>
      )}
      {isShowInfo && (
        <View>
          <View style={getStyles(mode).row}>
            <BadgeBtn
              items={[
                {
                  id: TICKET_USE_TYPE_PERSONAL,
                  title: "Personal",
                  active: useType === TICKET_USE_TYPE_PERSONAL,
                  onClick: () => setUseTypeOption(TICKET_USE_TYPE_PERSONAL),
                },
                {
                  id: TICKET_USE_TYPE_BUSINESS,
                  title: "Negocio",
                  active: useType === TICKET_USE_TYPE_BUSINESS,
                  onClick: () => setUseTypeOption(TICKET_USE_TYPE_BUSINESS),
                },
                {
                  id: TICKET_USE_TYPE_SHARED,
                  title: "Compartido",
                  active: useType === TICKET_USE_TYPE_SHARED,
                  onClick: () => setUseTypeOption(TICKET_USE_TYPE_SHARED),
                },
              ]}
              idActive={useType}
            />
          </View>
          {ticket.way == TICKET_TYPE_PAY && <View>
          <View style={getStyles(mode).row}>
            <BadgeBtn
              items={[
                {
                  id: TICKET_INFO_TYPE_PAY_PLANNED,
                  title: "Gasto Programado",
                  active: payType === TICKET_INFO_TYPE_PAY_PLANNED,
                  onClick: () => setPayTypeOption(TICKET_INFO_TYPE_PAY_PLANNED),
                },
                {
                  id: TICKET_INFO_TYPE_PAY_IMPULSIVED,
                  title: "Gasto Impulsivo",
                  active: setPayType === TICKET_INFO_TYPE_PAY_IMPULSIVED,
                  onClick: () => setPayTypeOption(TICKET_INFO_TYPE_PAY_IMPULSIVED),
                },
                {
                  id: TICKET_INFO_TYPE_PAY_UNEXPECTED,
                  title: "Gasto Inesperado",
                  active: payType === TICKET_INFO_TYPE_PAY_UNEXPECTED,
                  onClick: () => setPayTypeOption(TICKET_INFO_TYPE_PAY_UNEXPECTED),
                }
              ]}
              idActive={payType}
            />
          </View>

          <View style={{ paddingTop: 20, paddingBottom: 20 }}>
            <Text style={getStyles(mode).sectionTitle}>Categoría</Text>
            <View>
               <DropDownList 
                placeholder="Seleccionar..."        // Texto cuando no hay selección
                data={EXPENSES_CATEGORY}
                onSelected={(item) => onSelectedExpensesCategory(item.code)}  // Callback al seleccionar
                showSearch={true}                    // Mostrar barra de búsqueda (default: true)
                defaultCode={expensesCategory}></DropDownList>
            </View>
          </View>
          </View>}
          {ticket.note != "" && (
            <View style={{ padding: 10 }}>
              <Text style={getStyles(mode).sectionTitle}>Detalle</Text>
              <View style={getStyles(mode).searchBar}>
                <Text style={{ color: colors.gray50 }}>{ticket.note}</Text>
              </View>
            </View>
          )}
          {ticket.notePrivate != "" && ticket.idUserCreatedBy == profile.idUser && (
            <View style={{ padding: 10 }}>
              <Text style={getStyles(mode).sectionTitle}>Nota Privada</Text>
              <View style={getStyles(mode).searchBar}>
                <Text style={{ color: colors.gray50 }}>{ticket.notePrivate}</Text>
              </View>
            </View>
          )}

          {ticket.metadata.externalReference != "" && ticket.idUserCreatedBy == profile.idUser && (
            <View style={{ padding: 10 }}>
              <Text style={getStyles(mode).sectionTitle}>Texto de referencia</Text>
              <View style={getStyles(mode).searchBar}>
                <Text style={{ color: colors.gray50 }}>{ticket.metadata.externalReference}</Text>
              </View>
            </View>
          )}

          {ticket.paymentInfo.paymentMethod != "" && (
            <View style={{ padding: 10 }}>
              <Text style={getStyles(mode).sectionTitle}>Forma de Pago</Text>
              <View style={getStyles(mode).searchBar}>
                <Text style={{ color: colors.gray50 }}>{ticket.paymentInfo.paymentMethod}</Text>
              </View>
            </View>
          )}
          {profile.idUser == ticket.idUserCreatedBy && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginVertical: 10,
              }}></View>
          )}
        </View>
      )}
      {!ticket.isOpen && (
        <View style={[getStyles(mode).row, { alignItems: "center", justifyContent: "center" }]}>
          <Text style={[getStyles(mode).normalText, { paddingTop: 20, flexWrap: "nowrap", textAlign: "center" }]}>
            <Fontisto name="locked" size={15} /> Este ticket fue cerrado por {getContactName(ticket.idUserClosed)} el {moment(ticket.TSClosed).format("D MMM, HH:mm")}
          </Text>
        </View>
      )}
      {ticket.isOpen && (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          {isShowMenuList && (
            <View style={{ width: "100%" }}>
              <TouchableOpacity onPress={() => changeTicketStatus(TICKET_DETAIL_PAY_STATUS)} style={[getStyles(mode).infoBtn, { marginVertical: 10 }]}>
                <Text style={{ color: "#fff" }}>Quiero registrar un pago</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changeTicketStatus(TICKET_DETAIL_CHANGE_DUE_DATE_STATUS)} style={[getStyles(mode).infoBtn, { marginVertical: 10 }]}>
                <Text style={{ color: "#fff" }}>Quiero cambiar la fecha de vencimiento</Text>
              </TouchableOpacity>
              {ticket.idUserCreatedBy != profile.idUser && (
                <TouchableOpacity onPress={() => changeTicketStatus(TICKET_DETAIL_DISPUTE_STATUS)} style={[getStyles(mode).infoBtn, { marginVertical: 10 }]}>
                  <Text style={{ color: "#fff" }}>Ticket en disputa</Text>
                </TouchableOpacity>
              )}
              {ticket.idUserCreatedBy != profile.idUser && (
                <TouchableOpacity onPress={() => changeTicketStatus(TICKET_DETAIL_CANCELED_STATUS)} style={[getStyles(mode).infoBtn, { marginVertical: 10 }]}>
                  <Text style={{ color: "#fff" }}>Quiero cancelar el ticket</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={{ width: "100%" }}>
            {!isShowMenuList && (
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.gray25,
                    borderRadius: 15,
                    width: "100%",
                    marginTop: 10,
                    marginBottom: 10,
                    paddingVertical: 15,
                    alignItems: "left",
                  }}
                  onPress={() => setIsShowMenuList(true)}>
                  <Text style={[getStyles(mode).sectionTitle, { marginLeft: 15, fontWeight: "bold" }]}>
                    <Feather name="arrow-left" size={15} /> Volver al menu de estados
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {!isShowMenuList && ticket.status == TICKET_DETAIL_CHANGE_DUE_DATE_STATUS && (
              <View>
                <View style={{ marginTop: 10 }}>
                  <DateBtn text={`Vence en ${diasEntreFechas(dueDate)} días`} date={dueDate} onDateSelected={OnSelectedDueDate} />
                </View>
              </View>
            )}
            {!isShowMenuList && ticket.status == TICKET_DETAIL_PAY_STATUS && (
              <View>
                <Text style={getStyles(mode).sectionTitle}>Método de Pago</Text>

                <DropDownList data={PAY_METHOD} placeholder="¿Cómo lo pagué?" onSelected={selectedPayMethod} />
                <Text style={getStyles(mode).sectionTitle}>Importe pagado en {ticket.currency}</Text>
                <View style={getStyles(mode).searchBar}>
                  <TextInput
                    placeholder="importe pagado..."
                    placeholderTextColor={colors.secondary}
                    style={[getStyles(mode).textInput, { textAlign: "right" }]}
                    value={ticketPay}
                    keyboardType="numeric"
                    onChangeText={setPay}
                  />
                </View>
                <TouchableOpacity
                  style={getStyles(mode).infoBtn}
                  onPress={() => {
                    attachPayment();
                  }}>
                  {payAttachmentFilename != "" && (
                    <Text style={[fonts.medium, { color: colors.white, fontSize: 13 }]}>
                      <Fontisto name="paperclip" /> {ellipString(payAttachmentFilename, 20)}
                    </Text>
                  )}
                  {payAttachmentFilename == "" && (
                    <Text
                      style={[
                        fonts.medium,
                        {
                          color: colors.white,
                          fontSize: 13,
                          fontWeight: "bold",
                        },
                      ]}>
                      <Fontisto name="paperclip" /> Adjuntar comprobante de pago
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {!isShowMenuList && showConfirmButton && (
              <View>
                <Text style={[getStyles(mode).sectionTitle, { paddingTop: 10 }]}>Notas</Text>
                <View style={getStyles(mode).searchBar}>
                  <TextInput
                    placeholder="agrega info del cambio de estado del ticket..."
                    placeholderTextColor={colors.secondary}
                    multiline={true}
                    style={[getStyles(mode).textInput, { marginLeft: 0 }]}
                    numberOfLines={5}
                    value={ticketNote}
                    onChangeText={setTicketNote}
                  />
                </View>
                <TouchableOpacity onPress={() => saveStatus()} style={getStyles(mode).agreeBtn}>
                  <Text style={[fonts.medium, { color: colors.white, fontSize: 13 }]}>Quiero confirmar el cambio de estado</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text>{isTicketOwner}</Text>
          {ticket.isOpen && isTicketOwner && (
            <View style={{ width: "100%" }}>
              <Hr style={{ marginTop: 10 }} />
              <View style={{ height: 10 }} />
              <TouchableOpacity
                onPress={() => showAlertModal("Atención", "Este ticket se cerrara y no podrá volverse a usar, ¿Estás seguro?", { ok: true, cancel: true }, () => closeTicketAlert)}
                style={[
                  getStyles(mode).cancelBtn,
                  { width: "100%", alignSelf: "center" }, // <-- ancho completo
                ]}>
                <Text style={[fonts.medium, { color: colors.white, fontSize: 13 }]}>
                  <Fontisto name="locked" size={15} /> Quiero dar por cerrado este ticket
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={[]}>
            <Text style={[getStyles(mode).subNormalText, { paddingTop: 20 }]}>
              Este ticket fue creado por {getContactName(ticket.idUserCreatedBy)} el {moment(ticket.TSCreated).format("D MMM, HH:mm")}
            </Text>
          </View>
        </View>
      )}
      </ScrollView>
      <AttachmentPickerHost file={true} camera={true} gallery={true} />
    </>
  );
};

const PayItem = ({ payItem, onOpen }) => {
  const mode = useColorScheme();
  console.log ("PAGO")
  console.log (payItem)
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 5,
        margin: 10,
        justifyContent: "space-between",
      }}>
      <ImgAvatar id={payItem.idUser} size={25} />
      <Text style={[getStyles(mode).chatText, { fontWeight: "bold", color: colors.primary, marginLeft: 8, flex: 1 }]}>
        {moment(payItem.TSPay).format("D MMM, HH:mm")} - {payItem.currency} {formatNumber(payItem.amount)}
      </Text>
      {payItem.uri != "" && (
        <TouchableOpacity
          onPress={() => {
            onOpen && onOpen(payItem.uri);
          }}
          style={[
            getStyles(mode).iconBtn,
            {
              width: 40,
              height: 40,
              marginLeft: 8,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}>
          <Fontisto name="paperclip" size={15} style={[getStyles(mode).iconBtn, { borderWidth: 0, padding: 0 }]} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TicketInfo;
