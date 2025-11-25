import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, Switch, TouchableOpacity, FlatList, useColorScheme, StyleSheet, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign } from "@expo/vector-icons";
import { Fontisto, Entypo, Feather } from "@expo/vector-icons";
import { colors, fonts, tStyles } from "../common/theme";
import ImgAvatar from "../components/ImgAvatar";
import { getStyles } from "../styles/home";
import { calculateInstancesBetweenDates, formatDateToStringLong, getMonthName, getDayName, getUId } from "../commonApp/functions";
import { db_addRepeatTicket, db_TICKET, db_openDB, db_addTicket, db_getGroupInfo, db_addGroupByTicket, db_addTicketLogStatus, db_addTicketRating, db_addTicketInfo, db_TICKET_INFO, db_TICKET_LOG_STATUS, db_TICKET_REPEAT } from "../commonApp/database";
import "../commonApp/global";
import { _contacts, getContactName } from "../commonApp/contacts";
import { _maxContactPerGroup } from "../commonApp/global";
import AppContext from "../context/appContext";
import AttachmentPickerHost, { hideAttachmentPicker, showAttachmentPicker } from "../components/AttachmentPicker";
import { getFileAndUpload } from "../commonApp/attachFile";
import {
  TICKET_USE_TYPE_BUSINESS,
  TICKET_USE_TYPE_PERSONAL,
  TICKET_USE_TYPE_SHARED,
  TICKET_INFO_TYPE_PAY_PLANNED,
  TICKET_INFO_TYPE_PAY_IMPULSIVED,
  TICKET_INFO_TYPE_PAY_UNEXPECTED,
  AREA_OF_WORK_LIST,
  TICKET_TYPE_COLLECT,
  TICKET_TYPE_PAY,
  TICKET_DETAIL_DEFAULT_STATUS,
  TICKET_DETAIL_STATUS,
  EXPENSES_CATEGORY,
  TICKET_DETAIL_CHANGE_DUE_DATE_STATUS,
  TICKET_INFO_TYPE_PAY,
  TICKET_INFO_TYPE_COLLECT,
  TICKET_INFO_TYPE_USE_TYPE,
  REPEAT_NO_REPEAT,
  REPEAT_ANNUALY,
  REPEAT_BIMONTHLY,
  REPEAT_BIWEEKLY,
  REPEAT_MONTHLY, 
  REPEAT_QUADRIMONTHLY,
  REPEAT_QUATERLY,
  REPEAT_BIANNUALY,
  REPEAT_WEEKLY
} from "../commonApp/constants";
import { showToast } from "../common/toast";
import { TICKET_REPEAT, TICKET_INFO_PAY, TICKET_INFO_COLLECT, GROUP_BY_TICKETS, TICKET, TICKET_LOG_DETAIL_STATUS, TICKET_INFO_USE_TYPE } from "../commonApp/dataTypes";
import { getProfile, isMe } from "../commonApp/profile";
import CurrencyDropDown from "../components/CurrencyDropDown";
import DropDownList from "../components/DropDownList";
import TitleBar from "../components/TitleBar";
import Loading from "../components/Loading";
import { formatNumber, validateNumeric, diasEntreFechas } from "../commonApp/functions";
import { displayTime, ellipString } from "../common/helpers";
import Toast from "react-native-toast-message";
import Hr from "../components/Hr";
import DateBtn from "../components/DateBtn";
import BadgeBtn from "../components/BadgeBtn";

const NewTicket = ({ navigation, route }) => {
  const [idTicketGroup] = React.useState(route.params["idTicketGroup"] || "");
  const [idTicketGroupBy] = React.useState(route.params["idTicketGroupBy"] || "");
  
  // mm - si no viene un parametro ticketDefault lo inicializo en blanco
  // este parametro toma los datos por default de los campos
  // Usar useState con función inicializadora para que solo se calcule una vez
  const [isNewTicket] = React.useState(() => route.params["ticketDefault"] == undefined);
  const [ticketDefault] = React.useState(() => {
    const profileAux = getProfile();
    let ticket = isNewTicket ? new TICKET() : route.params["ticketDefault"];
    // mm - si se crea un ticket nuevo se pone el currency por default
    if (isNewTicket) {
      ticket.currency = profileAux.defaultCurrency;
    }
    return ticket;
  });
  const [usersList] = React.useState(() => route.params["usersList"] || []);

  const [useType, setUseType] = React.useState(TICKET_USE_TYPE_PERSONAL);
  const [isShowDetail, setIsShowDetail] = React.useState(false);
  const [isCollectProcedure, setIsCollectProcedure] = React.useState (true)
  const [repeatOptions, setRepeatOptions] = React.useState ([])
  const [repeatOption, setRepeatOption] = React.useState (REPEAT_NO_REPEAT)
  const [repeatEndDate, setRepeatEndDate] = React.useState (new Date())
  const [docAttachmentFilename, setDocAttachmentFilename] = React.useState ("")
  const [docAttachment, setDocAttachment] = React.useState ({})

  const [userAreaWork, setUserAreaWork] = useState([{ name: "", code: "" }]);

  const mode = useColorScheme();

  const [ticketName, setTicketName] = React.useState(ticketDefault.title);
  const [ticketDesc, setTicketDesc] = React.useState(ticketDefault.note);
  const [ticketDescPrivate, setTicketDescPrivate] = React.useState(ticketDefault.notePrivate);
  const [ticketAmount, setTicketAmount] = React.useState(ticketDefault.amount == 0 ? "" : String(ticketDefault.amount)); // mm - lo dejo en string para que no me aparezco un 0 en el placeholder
  const [ticketRef, setTicketRef] = React.useState(ticketDefault.metadata.externalReference);
  

  const { showAlertModal } = React.useContext(AppContext);
  const [loading, setLoading] = React.useState("");
  const [payMethodInfo, setPayMethodInfo] = React.useState(ticketDefault.paymentInfo.paymentMethod);
  const [expensesCategory, setExpensesCategory] = React.useState();
  const [ticketType, setTicketType] = React.useState(ticketDefault.way);
  const [defaultCurrency, setDefaultCurrency] = React.useState(() => {
    const profileAux = getProfile();
    return ticketDefault.currency == "" ? profileAux.defaultCurrency : ticketDefault.currency;
  });
  const [ticketStatus, setTicketStatus] = React.useState(TICKET_DETAIL_DEFAULT_STATUS); // mm - lo dejo sin estado al principio para que el usuario se obligue a marcarlo
  const [groupInfo, setGroupInfo] = React.useState({});
  const [isTicketOpen, setisTicketOpen] = React.useState(true); // mm - si es pago o cobro
  const [billsNote, setBillsNote] = React.useState("");
  const [billsAmount, setBillsAmount] = React.useState(0);
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [statusList, setStatusList] = useState([]);
  const [profile, setProfile] = useState(() => getProfile());
  const [groupUsersList, setGroupUsersList] = useState([]);
  const [payType, setTypePay] = useState(TICKET_INFO_TYPE_PAY_PLANNED);

  const toggleTicketOpen = () => setisTicketOpen((previousState) => !previousState);
  const toggleCollectProcedure = () => setIsCollectProcedure((previousState) => !previousState);

  let userAreaToWork = ""; /// mm - el codigo al que se le acredita el ticket

  const [dueDate, setDueDate] = useState(new Date());
  const [visible, setVisible] = useState(false);

  function OnSelectedDueDate(date) {
    setDueDate(date);
  }

  function onSelectedExpensesCategory(expenses) {
    setExpensesCategory(expenses);
  }

  function onSelectedCurrency(item) {
    setDefaultCurrency(item);
  }

  function selectedRepeat(repeatInfo)
  {
    setRepeatOption (repeatInfo.code)
    console.log (repeatInfo.code)
  }

  async function checkInfoAndSave() {
    if (ticketType == "") {
      showAlertModal("Atención", "Selecciona si el ticket es a Cobrar o a Pagar");
      return;
    }

    if (ticketName.length == 0) {
      showAlertModal("Atención", "Por favor ingresa un título al ticket");
      return;
    }

    if (!validateNumeric(ticketAmount)) {
      showAlertModal("Atención", "Por favor ingresa un importe correcto al ticket");
      return;
    }

    if (ticketAmount == 0) {
      showAlertModal("Atención", "Por favor ingresa un importe al ticket", {});
      return;
    }

    if (!validateNumeric(billsAmount)) {
      showAlertModal("Atención", "El importe del gasto no es correcto, por favor verificar");
      return;
    }

    if (Number(ticketAmount) < Number(billsAmount)) {
      showAlertModal("Atención", "El importe del ticket es menor al monto que gastaste");

      return;
    }


    if (ticketType == TICKET_TYPE_PAY && (expensesCategory == "" || expensesCategory==undefined)) {
      showAlertModal("Atención", "Por favor selecciona tipo de gasto");
      return;
    }

    if (groupUsersList.length >=2)
    {
      showAlertModal("Atención", "Se generarán " + groupUsersList.length + " tickets, ¿estás seguro?", {ok:true, cancel: true}, ()=>confirmSave);
      return;
    }
    else
    {await saveInfo()}

  }

  async function confirmSave (option)
  {
    if (option=="OK") await saveInfo()
  }

  async function saveInfo()
  {
    try{
      setLoading(true);

      // mm - si el ticket no viene para nadie me lo agrego a mi como usuario
      if (groupUsersList.length ==0)
      {
        groupUsersList.push ({id:1, name:"", contact: profile.idUser})
      }

      // mm - si no se creo la asociacion de tickets lo creo
      for (const item of groupUsersList) {
          let idToUser = item.contact;
          
          let idTicket = getUId()
          // mm - si el ticket es de pago entonces creo un ticket de pago para mi y uno de cobro para el otro, o lo contrario si es de cobro
          let ticketInfoPay = new TICKET_INFO_PAY();
          ticketInfoPay.idTicket = idTicket;
          ticketInfoPay.idUser = TICKET_TYPE_PAY ? profile.idUser : idToUser;

          let ticketInfoCollect = new TICKET_INFO_COLLECT();
          ticketInfoCollect.idTicket = idTicket;
          ticketInfoCollect.idUser = TICKET_TYPE_PAY ? idToUser : profile.idUser;

          // mm - agrego los 2 registros, pay y collect de esta manera para que no me guarde info sucia porque el usuario pudo haber seleccionado info para pay o collect y despues haberla cambiada
          if (ticketType == TICKET_TYPE_PAY) {
            ticketInfoPay.info.expensesCategory = expensesCategory?.code || "";
            ticketInfoPay.info.type = payType
          } else {
            ticketInfoCollect.info.billsAmount = Number(billsAmount);
            ticketInfoCollect.info.billsNote = billsNote;
            ticketInfoCollect.info.areaWork = userAreaToWork;
          }

          // mm - si es un ticket para mi, dependiendo si es cobrar o pagar lo agrego
          if (isMe (idToUser) && ticketType == TICKET_TYPE_PAY ) await db_addTicketInfo(ticketInfoPay);
          if (isMe (idToUser) && ticketType == TICKET_TYPE_COLLECT ) await db_addTicketInfo(ticketInfoCollect);

          // mm - si no es un ticket para mi agrego los 2 registros de cobro y pago
          if (!isMe(idToUser))
          { await db_addTicketInfo(ticketInfoPay);
            await db_addTicketInfo(ticketInfoCollect);
          }

          // mm - agrego que tipo es personal-negocio,etc
          // mm primero genero un registro para un usuario y luego para el otro
          let ticketInfoUseType = new TICKET_INFO_USE_TYPE();
          ticketInfoUseType.idTicket = idTicket;
          ticketInfoUseType.idUser = profile.idUser;
          ticketInfoUseType.info.useType = useType;
          await db_addTicketInfo(ticketInfoUseType);

          // mm - si el ticket es para mi no le agrego la info para el usuario destinatario
          if (!isMe(idToUser))
          {
            // mm - le agrego el usetype del ticket para el otro usuario para que lo complete
            ticketInfoUseType = new TICKET_INFO_USE_TYPE();
            ticketInfoUseType.idTicket = idTicket;
            ticketInfoUseType.idUser = idToUser;
            await db_addTicketInfo(ticketInfoUseType);
          }

          // mm - creo status inicial
          let data = new TICKET_LOG_DETAIL_STATUS();
          // mm - tomo el id del ticket que se creo
          data.idTicket = idTicket;
          data.idStatus = isTicketOpen ? TICKET_DETAIL_DEFAULT_STATUS : "PAYED"; // mm - si esta abierto muestro el defaul, sino ya lo doy como pagado
          data.idUserFrom = profile.idUser;
          data.idUserTo = isMe (idToUser) ? "" : idToUser; // mm - guardo para poder filtrar en los eventos del log
          data.data.amount = ticketAmount;
          data.message = isTicketOpen
            ? profile.name + " creo el ticket '" + ticketName + "' por " + defaultCurrency + " " + formatNumber(ticketAmount) + " que vence el " + formatDateToStringLong(dueDate) 
            : profile.name + " ingreso el ticket '" + ticketName + "' cumplido por " + defaultCurrency + " " + formatNumber(ticketAmount);

          await db_addTicketLogStatus(data);

          // mm - creo status de fecha de vencimiento inicial
          data = new TICKET_LOG_DETAIL_STATUS();
          data.idTicket = idTicket;
          data.idStatus = TICKET_DETAIL_CHANGE_DUE_DATE_STATUS; // mm - si esta abierto muestro el defaul, sino ya lo doy como pagado
          data.idUserFrom = profile.idUser;
          data.idUserTo = isMe (idToUser) ? "" : idToUser; // mm - guardo para poder filtrar en los eventos del log
          data.message = "Se fijo la fecha inicial de vencimiento del ticket para el " + formatDateToStringLong(dueDate);
          data.data.dueDate = dueDate;

          await db_addTicketLogStatus(data);

          // mm - creo por default el rating 0 para el ticket
          await db_addTicketRating(idTicket, 0);

          let ticket = new TICKET();
          ticket.idTicket = idTicket
          ticket.initialAmount = Number(ticketAmount);
          ticket.amount = Number(ticketAmount);
          ticket.netAmount = Number(ticketAmount - billsAmount);
          ticket.title = ticketName;
          ticket.isOpen = isTicketOpen;
          ticket.currency = defaultCurrency;
          ticket.note = ticketDesc;
          ticket.notePrivate = ticketDescPrivate;
          ticket.way = ticketType;
          ticket.initialTSDueDate = dueDate; // mm - fecha inicial de vencimiento
          ticket.paymentInfo.paymentMethod = payMethodInfo;
          ticket.metadata.externalReference = ticketRef;
          ticket.idUserCreatedBy = profile.idUser;
          ticket.idUserFrom = profile.idUser;
          // mm - si es para mi no se lo agrego a nadie
          ticket.idUserTo = isMe (idToUser) ? "" : idToUser;
          ticket.idTicketGroupBy = idTicketGroupBy;
          ticket.idTicketGroup = idTicketGroup;
          ticket.collectionProcedure = isCollectProcedure
          ticket.initialTSDueDate = dueDate
          if (!docAttachment.remotefilename) {
          } else {
            ticket.document.mediaType = docAttachment.type;
            ticket.document.uri = docAttachment.remotefilename;
          }

          // mm - para cada usuario del grupo le agrego un ticket con la misma info
          let aux = await db_addTicket(idTicket, ticket);

          if (!aux) {
            setLoading(false);
            showToast.error("Existió un error al crear el ticket, por favor verifica la información y vuelve a intentar");
            return;
          }
        //}
        
      }

      if (repeatOption != REPEAT_NO_REPEAT)
      {
        let repeat = new TICKET_REPEAT()

        repeat.frecuency = repeatOption
        repeat.TSEnd = repeatEndDate
        repeat.groupUsers = groupUsersList.map ((item)=>item.contact)
        repeat.idUserFrom = profile.idUser, //mm - quien origina el ticket
        repeat.idUserCreatedBy = profile.idUser
        repeat.name = ticketName
        repeat.ticket.idTicketGroup = idTicketGroup
        repeat.ticket.idTicketGroupBy = idTicketGroupBy
        repeat.ticket.amount = Number(ticketAmount);
        repeat.ticket.title = ticketName;
        repeat.ticket.currency = defaultCurrency;
        repeat.ticket.note = ticketDesc;
        repeat.ticket.notePrivate = ticketDescPrivate;
        repeat.ticket.way = ticketType;
        repeat.ticket.paymentInfo.paymentMethod = payMethodInfo;
        repeat.ticket.metadata.externalReference = ticketRef;
        repeat.ticket.collectionProcedure = isCollectProcedure

        await db_addRepeatTicket (repeat.idTicketRepeat, repeat)
        showAlertModal ("Atención", "La repetición del ticket esta pausada hasta que la habilites en la pantalla de Repetir")
      }
      setLoading(false);

      showToast.success(`Se creó el ticket '${ticketName}' por ${defaultCurrency} ${ticketAmount}`, "Ticket creado");
    }catch (e) {console.log (e)
      showAlertModal ("Error", "Cuando intente crear el ticket existio un error, por favor intenta verifica e intenta más tarde")
    }
      navigation.reset({ index: 0, routes: [{ name: "MainScreen" }] });
  }

  function setPayCollect(pay) {
    setPay(pay);
  }

  const removeContactFromList = (contact) => {
    /// mm - si aun no esta en la lista para no agregarlo duplicado que da error
    /*if (groupUsersList.length == 1) {
      // mm - el usuario mas otro
      showAlertModal("Atención", "Debes tener al menos un contacto asociado", {
        ok: true,
        cancel: false,
      });
      return;
    }*/
    setGroupUsersList((prevItems) => prevItems.filter((item) => item !== contact));
  };
  async function loadData() {
    setLoading(true);

    let auxProfile = getProfile();
    setProfile(auxProfile);

    // mm - solo actualizar si tiene un valor válido
    if (payMethodInfo == "") {setPayMethodInfo(auxProfile.payMethodInfo)};

    let aux = [];

    auxProfile.areaWorksList.forEach((element) => {
      aux.push(AREA_OF_WORK_LIST.find((item) => item.code == element));
    });
    setUserAreaWork(aux);

    // mm - obtengo la infoirmacion del grupo
    try {
      // mm - obtener usersList directamente de route.params para asegurar el valor actual
      const usersListParam = route.params["usersList"] || [];
      console.log("usersList desde params:", usersListParam);
      
      // mm - agrego a la lista y le pongo el idunico
      setGroupUsersList(
        usersListParam.map((item, index) => ({
          name: getContactName(item),
          contact: item,
          id: index + 1,
        }))
      );
    } catch (e) {
      console.log(e);
    }

    setRepeatOptions([
      {name:"No se repite", code: REPEAT_NO_REPEAT},
      {name:"El " + getDayName() + " de cada semana", code: REPEAT_WEEKLY},
      {name:"El " + getDayName() + " de cada quincena", code: REPEAT_BIWEEKLY},
      {name:"El " + new Date().getDate() + " de cada mes", code: REPEAT_MONTHLY},
      {name:"El " + new Date().getDate() + " de cada mes, cada 2 meses", code: REPEAT_BIMONTHLY},
      {name:"El " + new Date().getDate() + " de cada mes, cada 3 meses", code: REPEAT_QUATERLY},
      {name:"El " + new Date().getDate() + " de cada mes, cada 4 meses", code: REPEAT_QUADRIMONTHLY},
      {name:"El " + new Date().getDate() + " de cada mes, cada 6 meses", code: REPEAT_BIANNUALY},
      {name:"El " + new Date().getDate() + " de " + getMonthName() + " de cada año", code: REPEAT_ANNUALY}
    ]);

    setStatusList(TICKET_DETAIL_STATUS.filter((item) => item.admin == true));

    
    setTicketName(ticketDefault.title)

    console.log (route.params)
  
    setLoading(false);
  }

  async function attachDocument() {
    try {
      setDocAttachmentFilename("");
      setDocAttachment({});
      
      const res = await showAttachmentPicker();
      if (!res) {
        console.log("No se seleccionó ninguna opción");
        return;
      }

      setLoading(true);
      let uploadedFile = await getFileAndUpload(profile.idUser, false, res.type);
      setLoading(false);
      if (!uploadedFile) return;
      setDocAttachment(uploadedFile);
      setDocAttachmentFilename(uploadedFile.fileName);
    } catch (e) {
      console.log("attachdoc: " + JSON.stringify(e));
      setLoading(false);
    }
  }
  
  useEffect(() => {

    // mm - abro estas bases antes de todo para que cuando se guarde no demore en abrirlas y el usuario pueda cerrar en la mitad la app
    db_openDB (db_TICKET_INFO)
    db_openDB (db_TICKET)
    db_openDB (db_TICKET_REPEAT)
    db_openDB (db_TICKET_LOG_STATUS)

    loadData();

    return () => {
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)

  function gotoHome() {
    navigation.navigate("MainScreen");
  }
  function onSelectedAreaToWork(item) {
    userAreaToWork = item;
  }

  return (
    <SafeAreaView style={getStyles(mode).container}>
      <Loading loading={loading} title="Trabajando, por favor espera..." />
      <TitleBar title="Nuevo Ticket" goBack={true} onGoBack={gotoHome} />
      <KeyboardAvoidingView behavior="padding" style={[tStyles.flex1]}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <View style={[getStyles(mode).row, { padding: 10 }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                //padding: 20,
                }}>
                <TouchableOpacity style={[getStyles(mode).chatFilter, ticketType == TICKET_TYPE_COLLECT ? getStyles(mode).activeChatFilter : null]} onPress={() => setTicketType(TICKET_TYPE_COLLECT)}>
                <Text style={[getStyles(mode).chatFilterText, ticketType == TICKET_TYPE_COLLECT ? getStyles(mode).activeChatFilterText : null]}>Cobrar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[getStyles(mode).chatFilter, ticketType == TICKET_TYPE_PAY ? getStyles(mode).activeChatFilter : null]} onPress={() => setTicketType(TICKET_TYPE_PAY)}>
                <Text style={[getStyles(mode).chatFilterText, ticketType == TICKET_TYPE_PAY ? getStyles(mode).activeChatFilterText : null]}>Pagar</Text>
                </TouchableOpacity>
              </View>
              </View>

              <View style={[getStyles(mode).topBarHolder, { borderBottomWidth: 0 }]}>
              <FlatList
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                data={groupUsersList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <SelectedItem item={item} removeContactFromList={removeContactFromList} profile={profile} />}
                contentContainerStyle={{ paddingHorizontal: 15 }}
              />
              </View>
              <View style={getStyles(mode).row}>
              <BadgeBtn
                items={[
                {
                  id: TICKET_USE_TYPE_PERSONAL,
                  title: "Personal",
                  active: useType === TICKET_USE_TYPE_PERSONAL,
                  onClick: () => setUseType(TICKET_USE_TYPE_PERSONAL),
                },
                {
                  id: TICKET_USE_TYPE_BUSINESS,
                  title: "Negocio",
                  active: useType === TICKET_USE_TYPE_BUSINESS,
                  onClick: () => setUseType(TICKET_USE_TYPE_BUSINESS),
                },
                {
                  id: TICKET_USE_TYPE_SHARED,
                  title: "Compartido",
                  active: useType === TICKET_USE_TYPE_SHARED,
                  onClick: () => setUseType(TICKET_USE_TYPE_SHARED),
                },
                ]}
                idActive={useType}
              />
              </View>
              {ticketType == TICKET_TYPE_PAY && <View style={getStyles(mode).row}>
              <BadgeBtn
                items={[
                {
                  id: TICKET_INFO_TYPE_PAY_PLANNED,
                  title: "Gasto Programado",
                  active: payType === TICKET_INFO_TYPE_PAY_PLANNED,
                  onClick: () => setTypePay(TICKET_INFO_TYPE_PAY_PLANNED),
                },
                {
                  id: TICKET_INFO_TYPE_PAY_IMPULSIVED,
                  title: "Gasto Impulsivo",
                  active: payType === TICKET_INFO_TYPE_PAY_IMPULSIVED,
                  onClick: () => setTypePay(TICKET_INFO_TYPE_PAY_IMPULSIVED),
                },
                {
                  id: TICKET_INFO_TYPE_PAY_UNEXPECTED,
                  title: "Gasto Inesperado",
                  active: payType === TICKET_INFO_TYPE_PAY_UNEXPECTED,
                  onClick: () => setTypePay(TICKET_INFO_TYPE_PAY_UNEXPECTED),
                },
                ]}
                idActive={payType}
              />
              </View>}

              <View style={[getStyles(mode).container, { flex: 1 }]}>
              <View style={{ padding: 20 }}>
                <Text style={getStyles(mode).sectionTitle}>Título</Text>
                <View style={getStyles(mode).searchBar}>
                <TextInput placeholder="título del ticket..." placeholderTextColor={colors.secondary} style={getStyles(mode).textInput} value={ticketName} onChangeText={setTicketName} />
                </View>
                <Text style={[getStyles(mode).sectionTitle, { paddingTop: 20 }]}>Importe</Text>
                <View
                style={[
                  {
                  padding: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  },
                  getStyles(mode).searchBar,
                ]}>
                <CurrencyDropDown defaultCurrency={defaultCurrency} onSelected={onSelectedCurrency} />
                <TextInput
                  placeholder="importe del ticket..."
                  placeholderTextColor={colors.secondary}
                  style={[getStyles(mode).textInput, { textAlign: "right", flex: 1, fontSize: ticketAmount ? 30 : 18, fontWeight: ticketAmount ? "bold" : "normal" }]}
                  value={ticketAmount}
                  keyboardType="numeric"
                  onChangeText={setTicketAmount}
                />
                </View>
                {ticketType == TICKET_TYPE_PAY && (
                <View style={{ paddingTop: 20, paddingBottom: 20 }}>
                  <Text style={getStyles(mode).sectionTitle}>A que corresponde el gasto</Text>
                  <View>
                  <DropDownList placeholder="selecciona un tipo de gasto" data={EXPENSES_CATEGORY} onSelected={onSelectedExpensesCategory} />
                  </View>
                </View>
                )}
                <View>
                <View style={getStyles(mode).row}>
                  <Text style={getStyles(mode).normalText}>Ya cobre/pagué el ticket</Text>
                  <Switch value={!isTicketOpen} onValueChange={toggleTicketOpen} trackColor={{ false: "#767577", true: "#b3b3b3ff" }} thumbColor={isTicketOpen ? "#f4f3f4" : "#aafdc2ff"} />
                </View>
                </View>
                {/* SI ES TIPO COBRAR*/}
              <Hr />

              <View style={{ paddingVertical: 20 }}>
                    <Text style={getStyles(mode).sectionTitle}>
                      Repetir Ticket
                    </Text>
                    <DropDownList data={repeatOptions} onSelected={selectedRepeat} defaultCode={REPEAT_NO_REPEAT}/>
                    {repeatOption != REPEAT_NO_REPEAT && <View style={{ padding: 10 }}>
                   <DateBtn text={"Repetir hasta" } onDateSelected={setRepeatEndDate} />
                  <Text style={[getStyles(mode).sectionTitle, {paddingTop:10}]}>Este ticket se repetirá {calculateInstancesBetweenDates (repeatOption, new Date(), repeatEndDate) } veces</Text>
                </View>}
                </View>
              <Hr />
              <View style={{ padding: 20 }}></View>

                {!isShowDetail && (
                  <TouchableOpacity onPress={() => setIsShowDetail(!isShowDetail)}>
                    <Text style={getStyles(mode).sectionTitle}>
                      <Fontisto name="angle-dobule-down" /> Ver más (cuanto más datos ingreses mejores resultados obtendrás)
                    </Text>
                  </TouchableOpacity>
                )}
                {isShowDetail && (
                  <TouchableOpacity onPress={() => setIsShowDetail(!isShowDetail)}>
                    <Text style={getStyles(mode).sectionTitle}>
                      <Fontisto name="angle-dobule-up" /> Ocultar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            {isShowDetail && (
              <View style={{ padding: 10 }}>
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
                <TouchableOpacity
                  style={getStyles(mode).attachBtn}
                  onPress={() => {
                    attachDocument();
                  }}>
                    {docAttachmentFilename != "" && 
                    <Text style={[{  fontSize: 13 }]}>
                      <Fontisto name="paperclip" /> {ellipString(docAttachmentFilename, 20)}
                    </Text>}
                    {docAttachmentFilename == "" && 
                    <Text
                      style={[
                        fonts.medium,
                        {
                          fontSize: 13,
                        },
                      ]}>
                      <Fontisto name="paperclip" /> Adjuntar documento o imágen
                    </Text>}
                </TouchableOpacity>
                <View style={{ padding: 10 }}>
                  <Text style={getStyles(mode).sectionTitle}>Nota Privada</Text>
                  <View style={getStyles(mode).searchBar}>
                    <TextInput
                      placeholder="información que solo puedo ver yo..."
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
                  <Text style={getStyles(mode).sectionTitle}>Texto de Referencia</Text>
                  <View style={getStyles(mode).searchBar}>
                    <TextInput placeholder="por ej FACTURA ..." placeholderTextColor={colors.secondary} style={getStyles(mode).textInput} value={ticketRef} onChangeText={setTicketRef} />
                  </View>
                </View>
                <View style={{ padding: 10 }}>
                    <Text style={[getStyles(mode).sectionTitle, {paddingBottom:10}]}>Vencimiento del Ticket</Text>
                
                  <DateBtn text={"Vence en " + diasEntreFechas(dueDate) + " días"} onDateSelected={OnSelectedDueDate} />
                </View>

                <View style={{ padding: 10 }}>
                  {ticketType == TICKET_TYPE_COLLECT && (
                    <View>
                      <Text style={getStyles(mode).sectionTitle}>Cosas que gasté</Text>
                      <View style={getStyles(mode).searchBar}>
                        <TextInput
                          placeholder="detalle de cosas en las que gasté..."
                          placeholderTextColor={colors.secondary}
                          style={getStyles(mode).textInput}
                          multiline={true}
                          numberOfLines={5}
                          value={billsNote}
                          onChangeText={setBillsNote}
                        />
                      </View>
                      <View style={{ paddingTop: 10 }}>
                        <Text style={getStyles(mode).sectionTitle}>Importe de los gastos</Text>
                        <View style={getStyles(mode).searchBar}>
                          <Text style={{ color: colors.gray50 }}>{defaultCurrency}</Text>

                          <TextInput
                            placeholder="importe del gasto..."
                            placeholderTextColor={colors.secondary}
                            style={[getStyles(mode).searchBarInput, { textAlign: "right" }]}
                            value={billsAmount}
                            keyboardType="numeric"
                            onChangeText={setBillsAmount}
                          />
                        </View>
                      </View>
                      <View>
                        {userAreaWork.length > 0 && (
                          <View style={{ paddingTop: 10 }}>
                            <Text style={getStyles(mode).sectionTitle}>Área de Trabajo</Text>
                            <DropDownList placeholder="selecciona el área de trabajo" data={userAreaWork} onSelected={onSelectedAreaToWork} />
                          </View>
                        )}
                        {userAreaWork.length == 0 && <Text style={[getStyles(mode).activeText, { paddingBottom: 30 }]}>Puedes agregar áreas de trabajo en Ajustes y luego Área de Trabajo</Text>}
                      </View>
                    </View>
                  )}

                  <View style={{ paddingTop: 10 }}>
                    <Text style={getStyles(mode).sectionTitle}>Instrucciones de Pago</Text>
                    <View style={getStyles(mode).searchBar}>
                      <TextInput
                        placeholder="instrucciones de pago..."
                        multiline={true}
                        numberOfLines={5}
                        placeholderTextColor={colors.secondary}
                        style={getStyles(mode).textInput}
                        value={payMethodInfo}
                        onChangeText={setPayMethodInfo}
                      />
                    </View>
                  </View>
                  <Hr/>
                  <View style={{ paddingTop: 0, paddingBottom:30 }}>
                    <View style={getStyles(mode).row}>
                      <Text style={getStyles(mode).sectionTitle}>Ayúdame con este ticket</Text>
                      <Switch
                        value={isCollectProcedure}
                        onValueChange={toggleCollectProcedure}
                        trackColor={{ false: "#767577", true: "#b3b3b3ff" }}
                        thumbColor={isCollectProcedure ? "#aafdc2ff" : "#f4f3f4"}
                        />
                    </View>
                    <View style={[getStyles(mode).row, {padding:0, paddingHorizontal:10}]}>
                      <Text style={getStyles(mode).subNormalText}>Usar un procedimiento para recordar el pago o cobro de este ticket</Text>
                    </View>
                  </View>
                        <Hr/>
                </View>
              </View>
            )}
            <View style={{ paddingHorizontal: 15 }}>
              <TouchableOpacity style={getStyles(mode).agreeBtn} onPress={() => checkInfoAndSave()}>
                <Text style={[fonts.medium, { color: colors.white, fontSize: 13 }]}>Guardar el Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AttachmentPickerHost camera={true} gallery={true} file={true} />
    </SafeAreaView>
  );
};

const SelectedItem = ({ removeContactFromList, item, profile }) => {
  const mode = useColorScheme();

  return (
    <View>
      {item.contact != profile.idUser && (
        <TouchableOpacity onPress={() => removeContactFromList(item)} style={getStyles(mode).selectedContact}>
          <View style={[getStyles(mode).linkIconHolder, { marginRight: 15 }]}>
            <ImgAvatar id={item.contact} detail={false}/>
            <View style={getStyles(mode).avatarHolder}>
              <Fontisto name="close" size={16} color={colors.gray30} />
            </View>
          </View>

          <Text style={getStyles(mode).chatUsernameSmall}>{ellipString(item.name, 8)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles1 = StyleSheet.create({
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

export default NewTicket;
