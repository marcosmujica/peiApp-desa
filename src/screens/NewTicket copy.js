import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  FlatList,
  useColorScheme,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fontisto, Entypo, AntDesign, Feather } from "@expo/vector-icons";
import { colors, fonts, tStyles } from "../common/theme";
import ImgAvatar from "../components/ImgAvatar";
import { getStyles } from "../styles/home";
import {
  db_addTicket,
  db_getGroupInfo,
  db_addGroupByTicket,
  db_addTicketLogStatus,
  _contacts,
} from "../commonApp/database";
import "../commonApp/global";
import { _maxContactPerGroup } from "../commonApp/global";
import AppContext from "../context/appContext";
import {
  AREA_OF_WORK_LIST,
  TICKET_TYPE_COLLECT,
  TICKET_TYPE_PAY,
  TICKET_DETAIL_DEFAULT_STATUS,
  TICKET_DETAIL_STATUS,
  EXPENSES_CATEGORY,
} from "../commonApp/constants";
import {
  GROUP_BY_TICKETS,
  TICKET,
  TICKET_LOG_DETAIL_STATUS,
} from "../commonApp/dataTypes";
import { getProfile } from "../commonApp/profile";
import CurrencyDropDown from "../components/CurrencyDropDown";
import DropDownList from "../components/DropDownList";
import TitleBar from "../components/TitleBar";
import Loading from "../components/Loading";
import {
  formatDateToText,
  formatNumber,
  validateNumeric,
  diasEntreFechas
} from "../commonApp/functions";
import { displayTime, ellipString } from "../common/helpers";
import { toast } from "react-toastify";
import Hr from "../components/Hr";
import DateBtn from "../components/DateBtn";
import { v4 as uuidv4 } from "uuid";

const NewTicket = ({ navigation, route }) => {
  console.log ("entro2")
  const [idTicketGroup] = React.useState(route.params["idTicketGroup"]);
  let idTicketGroupBy = route.params["idTicketGroupBy"];
  const [groupName, setGroupName] = React.useState(route.params["name"]);

  // mm - si no viene un parametro ticketDefault lo inicializo en blanco
  // este parametro toma los datos por default de los campos 
  let isNewTicket = route.params["ticketDefault"] == undefined
  let ticketDefault = isNewTicket ? new TICKET() : route.params["ticketDefault"]

  let profileAux = getProfile () 

  // mm - si se crea un ticket nuevo se pone el currency por default, porque puede ser un duplicado y ya viene la moneda
  if (isNewTicket) ticketDefault.currency = profileAux.defaultCurrency 

  const [userAreaWork, setUserAreaWork] = useState([{ name: "", code: "" }]);

  const mode = useColorScheme();
  const [expensesCategory, setExpensesCategory] = React.useState(ticketDefault.pay.expensesCategory);
  const [ticketName, setTicketName] = React.useState(ticketDefault.title);
  const [ticketDesc, setTicketDesc] = React.useState(ticketDefault.note);
  const [ticketDescPrivate, setTicketDescPrivate] = React.useState(ticketDefault.notePrivate);
  const [ticketAmount, setTicketAmount] = React.useState(ticketDefault.amount == 0 ? "" : String(ticketDefault.amount)); // mm - lo dejo en string para que no me aparezco un 0 en el placeholder
  const [ticketRef, setTicketRef] = React.useState(ticketDefault.metadata.externalReference);
  const { showAlertModal } = React.useContext(AppContext);
  const [loading, setLoading] = React.useState("");
  const [payMethodInfo, setPayMethodInfo] = React.useState(ticketDefault.paymentInfo.paymentMethod);
  const [ticketType, setTicketType] = React.useState(ticketDefault.way);
  const [defaultCurrency, setDefaultCurrency] = React.useState(ticketDefault.currency == "" ? "USD" : ticketDefault.currency);
  const [ticketStatus, setTicketStatus] = React.useState( TICKET_DETAIL_DEFAULT_STATUS); // mm - lo dejo sin estado al principio para que el usuario se obligue a marcarlo
  const [groupInfo, setGroupInfo] = React.useState({});
  const [isTicketOpen, setisTicketOpen] = React.useState(true); // mm - si es pago o cobro
  const [billsNote, setBillsNote] = React.useState(ticketDefault.collect.billsNote); // mm - si es pago o cobro
  const [billsAmount, setBillsAmount] = React.useState(ticketDefault.collect.billsAmount); // mm - si es pago o cobro
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [statusList, setStatusList] = useState([]);
  const [profile] = useState(profileAux);
  const [groupUsersList, setGroupUsersList] = useState([]);

  const toggleRecurrent = () =>
    setIsRecurrent((previousState) => !previousState);

  const toggleTicketOpen = () =>
    setisTicketOpen((previousState) => !previousState);

  let userAreaToWork = ""; /// mm - el codigo al que se le acredita el ticket

  const [dueDate, setDueDate] = useState(new Date());
  const [visible, setVisible] = useState(false);

  function OnSelectedDueDate (date)
  {
    console.log (date)
    setDueDate (date)
  }
  
  function onSelectedExpensesCategory(expenses) {
    setExpensesCategory(expenses);
  }

  function onSelectedCurrency(item) {
    setDefaultCurrency(item);
  }

  async function checkInfoAndSave() {
    console.log("ENTRO");

    if (ticketName.length == 0) {
      showAlertModal("Atención", "Por favor ingresa un título al ticket", {
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

    if (ticketAmount < billsAmount) {
      showAlertModal(
        "Atención",
        "El importe del ticket es menor al monto que gastaste",
        { ok: true, cancel: false }
      );

      return;
    }

    if (!validateNumeric(billsAmount)) {
      showAlertModal(
        "Atención",
        "El importe del gasto no es correcto, por favor verificar",
        { ok: true, cancel: false }
      );
      return;
    }

    if (ticketType == TICKET_TYPE_PAY && expensesCategory == "") {
      showAlertModal(
        "Atención",
        "Por favor selecciona una categoría para el pago",
        { ok: true, cancel: false }
      );
      return;
    }

    setLoading(true);

    // mm - si no se creo la asociacion de tickets lo creo
    if (idTicketGroupBy == undefined) {
      let groupBy = new GROUP_BY_TICKETS();
      groupBy.name = ticketName;
      groupBy.idTicketGroup = idTicketGroup;
      groupBy.idUserCreatedBy = profile.idUser;
      groupBy.idUserOwner = profile.idUser;

      let status = await db_addGroupByTicket(groupBy);

      idTicketGroupBy = status.id;
    }

    groupUsersList.forEach(async (item) => {
      // mm - para no crearle un ticket al creador del ticket
      if (item != profile.idUser) {
        // mm - necesito volver a crear el ticket cada vez para que no de error
        let ticket = new TICKET();

        ticket.initialAmount = Number(ticketAmount);
        ticket.amount = Number(ticketAmount);
        ticket.partialAmount = isTicketOpen ? 0 : ticket.amount; // mm  - si el ticket lo dejo abierto me ingresa lo que va pagando/cobrando mas tarde, sino ya pongo el importe total
        ticket.netAmount = Number(ticketAmount - billsAmount);
        ticket.title = ticketName;
        ticket.isOpen = isTicketOpen;
        ticket.status = ticketStatus;
        ticket.currency = defaultCurrency;
        ticket.note = ticketDesc;
        ticket.notePrivate = ticketDescPrivate;
        ticket.category = ticketType; // !!!! ojo que falta decir si es cobro o pago
        ticket.way = ticketType;
        ticket.TSDueDate = dueDate
        ticket.paymentInfo.paymentMethod = payMethodInfo;
        ticket.metadata.externalReference = ticketRef;
        ticket.idUserCreatedBy = profile.idUser;
        ticket.idTicketGroupBy = idTicketGroupBy;
        ticket.idTicketGroup = idTicketGroup;
        ticket.pay.expensesCategory =
          expensesCategory.code == undefined ? "" : expensesCategory.code;
        ticket.collect.billsAmount = Number(billsAmount);
        ticket.collect.billsNote = billsNote;
        ticket.collect.areaWork = userAreaWork;
        // mm - para cada usuario del grupo le agrego un ticket con la misma info
        ticket.idUser = item;

        let aux = await db_addTicket(ticket);
        if (!aux.ok) {
          setLoading(false);
          showAlertModal(
            "Atención",
            "Existio un error al crear el ticket, por favor verifica la info y volve a intentar",
            { ok: true, cancel: false }
          );
          return;
        } else {
          let data = new TICKET_LOG_DETAIL_STATUS();
          // mm - tomo el id del ticket que se creo
          data.idTicket = aux.id;
          data.idStatus = isTicketOpen ? TICKET_DETAIL_DEFAULT_STATUS : "PAYED"; // mm - si esta abierto muestro el defaul, sino ya lo doy como pagado
          data.idUser = profile.idUser;
          data.data.amount = ticketAmount;
          data.message = isTicketOpen
            ? "Se creo el ticket por " +
              defaultCurrency +
              " " +
              formatNumber(ticketAmount)
            : "Se ingreso un ticket cumplido por " +
              defaultCurrency +
              " " +
              formatNumber(ticketAmount);
          let auxStatus = db_addTicketLogStatus(data);
        }
      }
    });

    setLoading(false);

    toast.success(
      "Se creo el ticket '" +
        ticketName +
        "' por " +
        defaultCurrency +
        " " +
        ticketAmount
    );
    navigation.navigate("MainScreen");
  }

  function setPayCollect(pay) {
    setPay(pay);
  }

  const removeContactFromList = (contact) => {
    /// mm - si aun no esta en la lista para no agregarlo duplicado que da error
    if (groupUsersList.length == 2) {
      // mm - el usuario mas otro
      showAlertModal("Atención", "Debes tener al menos un contacto asociado", {
        ok: true,
        cancel: false,
      });
      return;
    }
    setGroupUsersList((prevItems) =>
      prevItems.filter((item) => item !== contact)
    );
  };
  async function loadData() {
    
    setLoading(true);

    setDefaultCurrency(profile.defaultCurrency);
    setPayMethodInfo(profile.payMethodInfo);

    let aux = [];

    profile.areaWorksList.forEach((element) => {
      aux.push(AREA_OF_WORK_LIST.find((item) => item.code == element));
    });
    setUserAreaWork(aux);

    // mm - obtengo la infoirmacion del grupo
    try {
      let aux = await db_getGroupInfo(idTicketGroup);
      setGroupInfo(aux);
      console.log(aux);
      setGroupUsersList(aux.groupUsers);
    } catch (e) {
      console.log(e);
    }

    setStatusList(TICKET_DETAIL_STATUS.filter((item) => item.admin == true));
    setLoading(false);
  }

  useEffect(() => {
    loadData();

    return () => {
      console.log("🧹 Componente desmontado");
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
      <Loading loading={loading} title="Procesando..." />
      <TitleBar title="Ticket" subtitle="" goBack={true} onGoBack={gotoHome} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ flex: 1 }}>
        <View style={[getStyles(mode).row, {padding:10}]}>
            
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 20,
            }}
          >
            <TouchableOpacity
              style={[
                getStyles(mode).chatFilter,
                ticketType == TICKET_TYPE_COLLECT
                  ? getStyles(mode).activeChatFilter
                  : null,
              ]}
              onPress={() => setTicketType(TICKET_TYPE_COLLECT)}
            >
              <Text
                style={[
                  getStyles(mode).chatFilterText,
                  ticketType == TICKET_TYPE_COLLECT
                    ? getStyles(mode).activeChatFilterText
                    : null,
                ]}
              >
                Cobrar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                getStyles(mode).chatFilter,
                ticketType == TICKET_TYPE_PAY
                  ? getStyles(mode).activeChatFilter
                  : null,
              ]}
              onPress={() => setTicketType(TICKET_TYPE_PAY)}
            >
              <Text
                style={[
                  getStyles(mode).chatFilterText,
                  ticketType == TICKET_TYPE_PAY
                    ? getStyles(mode).activeChatFilterText
                    : null,
                ]}
              >
                Pagar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[getStyles(mode).topBarHolder, { borderBottomWidth: 0 }]}>
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            data={groupUsersList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SelectedItem
                item={item}
                removeContactFromList={removeContactFromList}
                profile={profile}
              />
            )}
            contentContainerStyle={{ paddingHorizontal: 15 }}
          />
        </View>
        <View style={[styles.container, { flex: 1 }]}>
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
                numberOfLines={2}
                value={ticketDesc}
                onChangeText={setTicketDesc}
              />
            </View>
          </View>
          <View style={{ padding: 10 }}>
            <Text style={getStyles(mode).sectionTitle}>Nota Privada</Text>
            <View style={getStyles(mode).searchBar}>
              <TextInput
                placeholder="información que solo yo puedo ver"
                placeholderTextColor={colors.secondary}
                style={getStyles(mode).textInput}
                multiline={true}
                numberOfLines={2}
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
                placeholder="por ej FACTURA ..."
                placeholderTextColor={colors.secondary}
                style={getStyles(mode).textInput}
                value={ticketRef}
                onChangeText={setTicketRef}
              />
            </View>
          </View>
          <View style={{ padding: 10 }}>
          <DateBtn
            text={"Vence (" + diasEntreFechas(dueDate) +" días)"}
            onDateSelected={OnSelectedDueDate}
          />
          
          </View>
          
          <View style={{ padding: 10 }}>
            <Text style={getStyles(mode).sectionTitle}>Importe</Text>
            <View style={[getStyles(mode).row, { flexDirection: "row" }]}>
              <CurrencyDropDown
                defaultCurrency={defaultCurrency}
                onSelected={onSelectedCurrency}
              />
              <TextInput
                placeholder="importe del ticket..."
                placeholderTextColor={colors.secondary}
                style={[
                  getStyles(mode).textInput,
                  getStyles(mode).searchBar,
                  { textAlign: "right" },
                ]}
                value={ticketAmount}
                keyboardType="numeric"
                onChangeText={setTicketAmount}
              />
            </View>
            <View style={styles.row}>
              <Text style={getStyles(mode).switchText}>
                Todavía no cobre/pagué el ticket
              </Text>
              <Switch
                value={isTicketOpen}
                onValueChange={toggleTicketOpen}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isTicketOpen ? "#f5dd4b" : "#f4f3f4"}
              />
            </View>
          </View>
          <View style={{ backgroundColor: colors.gray75 }}>
            {ticketType == TICKET_TYPE_COLLECT && (
              <View style={{ padding: 10 }}>
                <Text style={getStyles(mode).sectionTitle}>
                  Cosas que gasté
                </Text>
                <View style={getStyles(mode).searchBar}>
                  <TextInput
                    placeholder="detalle de cosas en las que gasté."
                    placeholderTextColor={colors.secondary}
                    style={getStyles(mode).textInput}
                    multiline={true}
                    numberOfLines={3}
                    value={billsNote}
                    onChangeText={setBillsNote}
                  />
                </View>
                <View style={{ padding: 10 }}>
                  <Text style={getStyles(mode).sectionTitle}>
                    Importe de los gastos
                  </Text>
                  <View style={getStyles(mode).searchBar}>
                    <Text style={{color:colors.gray50}}>{defaultCurrency}</Text>

                    <TextInput
                      placeholder="importe del gasto..."
                      placeholderTextColor={colors.secondary}
                      style={[
                        getStyles(mode).searchBarInput,
                        { textAlign: "right" },
                      ]}
                      value={billsAmount}
                      keyboardType="numeric"
                      onChangeText={setBillsAmount}
                    />
                  </View>
                </View>
                <View style={{ padding: 10 }}>
                  {userAreaWork.length > 0 && (
                    <View>
                      <Text style={getStyles(mode).sectionTitle}>
                        Área de Trabajo
                      </Text>
                      <DropDownList
                        placeholder="selecciona el área de trabajo"
                        data={userAreaWork}
                        onSelected={onSelectedAreaToWork}
                      />
                    </View>
                  )}
                  {userAreaWork.length == 0 && (
                    <Text style={getStyles(mode).activeText}>
                      Puedes agregar áreas de trabajo en Ajustes y luego Área de
                      Trabajo
                    </Text>
                  )}
                </View>
              </View>
            )}
            {/* SI ES TIPO COBRAR*/}
            {ticketType == TICKET_TYPE_PAY && (
              <View style={{ padding: 10 }}>
                <Text style={getStyles(mode).sectionTitle}>
                  A que corresponde el gasto
                </Text>
                <DropDownList
                  placeholder="selecciona un tipo de gasto"
                  data={EXPENSES_CATEGORY}
                  onSelected={onSelectedExpensesCategory}
                />
              </View>
            )}
            
            <View style={{ padding: 10 }}>
              <Text style={getStyles(mode).sectionTitle}>
                Instrucciones de Pago
              </Text>
              <View style={getStyles(mode).searchBar}>
                <TextInput
                  placeholder="instrucciones de pago..."
                  multiline={true}
                  numberOfLines={3}
                  placeholderTextColor={colors.secondary}
                  style={getStyles(mode).textInput}
                  value={payMethodInfo}
                  onChangeText={setPayMethodInfo}
                />
              </View>
            
              <Hr color={colors.gray50} width={1}></Hr>
            </View>

            <View style={{ paddingHorizontal: 15}}>
              <TouchableOpacity
                style={styles.agreeBtn}
                onPress={() => checkInfoAndSave()}
              >
                <Text
                  style={[fonts.medium, { color: colors.white, fontSize: 13 }]}
                >
                  Guardar el Ticket
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const SelectedItem = ({ removeContactFromList, item, profile }) => {
  const mode = useColorScheme();

  console.log(item);
  return (
    <View>
      {item != profile.idUser && (
        <TouchableOpacity
          onPress={() => removeContactFromList(item)}
          style={getStyles(mode).selectedContact}
        >
          <View style={[getStyles(mode).linkIconHolder, { marginRight: 15 }]}>
            <ImgAvatar id={item} nombre={item} size={20} />
            <View style={getStyles(mode).avatarHolder}>
              <AntDesign name="closecircle" size={16} color={colors.gray30} />
            </View>
          </View>

          <Text style={getStyles(mode).chatUsernameSmall}>
            {ellipString(item, 8)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
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

export default NewTicket;
