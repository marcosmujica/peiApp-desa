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
  db_addTicketInfo,
  _contacts,
} from "../commonApp/database";
import "../commonApp/global";
import { _maxContactPerGroup } from "../commonApp/global";
import AppContext from "../context/appContext";
import {
  TICKET_TYPE_COLLECT,
  TICKET_DETAIL_PAY_STATUS,
  TICKET_TYPE_PAY,
  TICKET_STATUS_CLOSED,
  TICKET_DETAIL_DEFAULT_STATUS,
  TICKET_DETAIL_STATUS,
  TICKET_DETAIL_PAYED_STATUS,
  EXPENSES_CATEGORY,
} from "../commonApp/constants";
import {
  GROUP_BY_TICKETS,
  TICKET,
  TICKET_LOG_DETAIL_STATUS,
  TICKET_INFO_PAY
} from "../commonApp/dataTypes";
import { getProfile } from "../commonApp/profile";
import CurrencyDropDown from "../components/CurrencyDropDown"; 
import DropDownList from "../components/DropDownList";
import TitleBar from "../components/TitleBar";
import Loading from "../components/Loading";
import { Calendar } from "react-native-calendars";

import { Button } from "react-native-paper";
import {
  formatDateToText,
  formatNumber,
  validateNumeric,
  diasEntreFechas,
  getUId
} from "../commonApp/functions";
import { displayTime, ellipString } from "../common/helpers";
import { toast } from "react-toastify";
import Hr from "../components/Hr";
import DateBtn from "../components/DateBtn";
import { v4 as uuidv4 } from "uuid";
import { showToast } from "../common/toast";

const QuickEntry = ({ navigation, route }) => {
  /*const [idTicketGroup] = React.useState(route.params["idTicketGroup"]);
  let idTicketGroupBy = route.params["idTicketGroupBy"];
  const [groupName, setGroupName] = React.useState(route.params["name"]);
  */

  let mode = useColorScheme();

  const profile = getProfile();

  let defaultCurrency = profile.defaultCurrency;

  const { showAlertModal } = React.useContext(AppContext);

  const [ticketDate, setTicketDate] = React.useState(new Date());
  const [loading, setLoading] = React.useState(false);

  const expensesList = [
    {
      icon: "hot-dog",
      code: "AL",
      name: "Alimentación",
      order: 1,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "bus",
      code: "TR",
      name: "Transporte",
      order: 2,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "aids",
      code: "CU",
      name: "Cuidado Personal",
      order: 3,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "bicycle",
      code: "EN",
      name: "Entretenimiento",
      order: 4,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "paw",
      code: "MA",
      name: "Mascotas",
      order: 5,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "home",
      code: "VI",
      name: "Vivienda",
      order: 6,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "pulse-medical",
      code: "SA",
      name: "Salud",
      order: 7,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "book",
      code: "ED",
      name: "Educación",
      order: 8,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "plane-ticket",
      code: "SU",
      name: "Suscripciones",
      order: 9,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "cocktail",
      code: "VI",
      name: "Viajes y Vacaciones",
      order: 10,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "dollar-currency",
      code: "DE",
      name: "Pago de Deuda",
      order: 11,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "dollar-currency",
      code: "OP",
      name: "Otros pagos",
      order: 11,
      currency: defaultCurrency,
      amount: "",
    },
  ].sort((a, b) => (a.order < b.order ? -1 : 1));

  const incomeList = [
    {
      icon: "wallet-icon",
      code: "SL",
      name: "Salario / Sueldo",
      order: 1,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "gbp-currency",
      code: "SL",
      name: "Cobro de Deuda",
      order: 2,
      currency: defaultCurrency,
      amount: "",
    },
    {
      icon: "dollar-currency",
      code: "OC",
      name: "Otros cobros",
      order: 3,
      currency: defaultCurrency,
      amount: "",
    },
  ].sort((a, b) => (a.order < b.order ? -1 : 1));

  const investList = [
    {
      icon: "tl-currency",
      code: "SL",
      name: "Cobro de Intereses ",
      order: 1,
      currency: defaultCurrency,
      amount: "",
    }
    ].sort((a, b) => (a.order < b.order ? -1 : 1));

  function setTicketAmount(data, code, value) {
    data.find((p) => p.code === code).amount = value;
  }

  useEffect(() => {
    //  loadData();

    return () => {
      console.log("🧹 Componente desmontado");
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)

  function onSelectedCurrency(data, code, value) {
    data.find((p) => p.code === code).currency = value;
  }

  function checkAndBack()
  {
    let setInfoOk = false;
     // mm -busco que se haya ingresado alguna info
    expensesList.map((item) => (item.amount != "" ? (setInfoOk = true) : null));
    incomeList.map((item) => (item.amount != "" ? (setInfoOk = true) : null));
    investList.map((item) => (item.amount != "" ? (setInfoOk = true) : null));

    if (setInfoOk) {
      showAlertModal(
        "Atención",
        "Los valores ingresados se van a guardar",
        {
          ok: true,
          cancel: true,
        },
        () => checkBack
      );
      return;
    }
    else
    {
      navigation.goBack()
    }

  }

  function checkBack(id)
  {
    if (id=="OK") {checkInfoAndSave()}
    else {navigation.goBack()}
  }

  function checkInfoAndSave() {

    let isSaveInfo = false
/*
    let setInfoOk = false;

    // mm -busco que se haya ingresado alguna info
    expensesList.map((item) => (item.amount != "" ? (setInfoOk = true) : null));
    incomeList.map((item) => (item.amount != "" ? (setInfoOk = true) : null));
    investList.map((item) => (item.amount != "" ? (setInfoOk = true) : null));

    if (!setInfoOk) {
      showAlertModal(
        "Atención",
        "Ingresa algún dato para el día que seleccionaste",
        {
          ok: true,
          cancel: false,
        }
      );
      return;
    }
    */
    setLoading (true)
    expensesList.forEach(async (item) => {
      if (item.amount > 0) {
        isSaveInfo = true
        
        // mm - registro el pago
        let idTicket = getUId()
        let auxStatus = new TICKET_LOG_DETAIL_STATUS();
        auxStatus.idTicket = idTicket;
        auxStatus.idStatus = TICKET_DETAIL_PAY_STATUS;
        auxStatus.message = "Registré un pago por " + item.currency + " " + item.amount;
        auxStatus.idUserFrom = profile.idUser;
        auxStatus.idUserTo = ""
        auxStatus.data.TSPay = ticketDate
        auxStatus.data.currency = item.currency;
        auxStatus.data.amount = Number(item.amount);
        
        await db_addTicketLogStatus(auxStatus);

        let ticketInfoPay = new TICKET_INFO_PAY();
        ticketInfoPay.idTicket = idTicket;
        ticketInfoPay.idUser = profile.idUser
        ticketInfoPay.info.expensesCategory = item.code
        
        await db_addTicketInfo(ticketInfoPay);

        let ticket = new TICKET();
        ticket.idTicket = idTicket
        ticket.initialAmount = Number(item.amount);
        ticket.amount = Number(item.amount);
        ticket.netAmount = Number(item.amount);
        ticket.title = item.name;
        ticket.isOpen = false;
        ticket.currency = item.currency;
        ticket.way = TICKET_TYPE_PAY;
        ticket.initialTSDueDate = ticketDate;
        ticket.idUserCreatedBy = profile.idUser;
        ticket.idUserClosed = profile.idUser;
        ticket.idUserFrom = profile.idUser;
        ticket.collectionProcedure = false

        console.log (ticket)
        debugger
        let aux = await db_addTicket(ticket.idTicket, ticket);
        if (!aux) {
          setLoading(false);
          showAlertModal(
            "Atención",
            "Existio un error al crear un ticket de pago, por favor verifica la info y volve a intentar",
            { ok: true, cancel: false }
          );
          return;
        }
      }
    });
    
    incomeList.forEach(async (item) => {
      if (item.amount > 0) {
        isSaveInfo = true
        
        let ticket = new TICKET();
        ticket.idTicket = getUId()
        ticket.initialAmount = Number(item.amount);
        ticket.amount = Number(item.amount);
        ticket.netAmount = Number(item.amount);
        ticket.title = item.name;
        ticket.isOpen = false;
        ticket.currency = item.currency;
        ticket.way = TICKET_TYPE_COLLECT;
        ticket.initialTSDueDate = ticketDate;
        ticket.idUserCreatedBy = profile.idUser;
        ticket.idUserFrom = profile.idUser;
        
        let aux = await db_addTicket(ticket.idTicket, ticket);
        if (!aux) {
          setLoading(false);
          showAlertModal(
            "Atención",
            "Existio un error al crear un ticket de cobro, por favor verifica la info y volve a intentar",
            { ok: true, cancel: false }
          );
          return;
        }
      }
    });
    investList.forEach(async (item) => {
      if (item.amount > 0) {
        isSaveInfo = true

        
        
        let ticket = new TICKET();
        ticket.idTicket = idTicket
        ticket.initialAmount = Number(item.amount);
        ticket.amount = Number(item.amount);
        ticket.netAmount = Number(item.amount);
        ticket.title = item.name;
        ticket.isOpen = false;
        ticket.currency = item.currency;
        ticket.way = TICKET_TYPE_COLLECT;
        ticket.initialTSDueDate = ticketDate;
        ticket.idUserCreatedBy = profile.idUser;
        ticket.idTicketGroupBy = profile.privateGroupByInvestment;
        ticket.idTicketGroup = profile.privateGroup;
        //ticket.pay.expensesCategory = item.code;
        ticket.idUserFrom = profile.idUser;
        
        let aux = await db_addTicket(ticket.idTicket, ticket);
        if (!aux) {
          setLoading(false);
          showAlertModal(
            "Atención",
            "Existio un error al crear un ticket de cobro, por favor verifica la info y volve a intentar",
            { ok: true, cancel: false }
          );
          return;
        }

        // mm - creo status inicial
        
      }
    });

    if (isSaveInfo)
    {
      showToast.success("Se marcaron como cumplidos los tickets ingresados", "");
    }
    setLoading (false)
    navigation.goBack();
  }
  
  function OnSelectedTicketDate(date) {
    setTicketDate(date);
  }
  
  return (
    <SafeAreaView style={getStyles(mode).container}>
      <Loading loading={loading} title="Procesando..." />
      <TitleBar title="Ingreso Rápido" subtitle="" goBack={true} onGoBack={checkAndBack} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ flex: 1 }}>
        <View style={{ padding: 10 }}>
          <DateBtn
            text={"(" + diasEntreFechas(ticketDate) + " días)"}
            onDateSelected={OnSelectedTicketDate}
          />
        </View>
        
        <View style={{ padding: 10 }}>
          <View style={[styles.container, { flex: 1 }]}>
            <Text
              style={[
                getStyles(mode).sectionTitle,
                {
                  borderRadius: 0,
                  paddingBottom: 5,
                  borderBottomColor: colors.gray50,
                  borderBottomWidth: 1,
                },
              ]}
            >
              Mis Pagos
            </Text>
            {expensesList.map((item, index) => (
              <View key={index} style={[getStyles(mode).row, { flexDirection: "row" }]}>
                {/*<Fontisto style={[getStyles(mode).sectionTitle]} name={item.icon} size="40"/>*/}
                <CurrencyDropDown
                  defaultCurrency={item.currency}
                  onSelected={(itemCurrency) =>
                    onSelectedCurrency(expensesList, item.code, itemCurrency)
                  }
                />
                <TextInput
                  placeholder={item.name}
                  placeholderTextColor={colors.secondary}
                  style={[
                    getStyles(mode).textInput,
                    getStyles(mode).searchBar,
                    { textAlign: "right" },
                  ]}
                  keyboardType="numeric"
                  onChangeText={(value) =>
                    setTicketAmount(expensesList, item.code, value)
                  }
                />
              </View>
            ))}
          </View>
        </View>

        <View style={{ padding: 10 }}>
          <View style={[styles.container, { flex: 1 }]}>
            <Text
              style={[
                getStyles(mode).sectionTitle,
                {
                  borderRadius: 0,
                  paddingBottom: 5,
                  borderBottomColor: colors.gray50,
                  borderBottomWidth: 1,
                },
              ]}
            >
              Mis Cobros
            </Text>
            {incomeList.map((item, index) => (
              <View key={index} style={[getStyles(mode).row, { flexDirection: "row" }]}>
                <CurrencyDropDown
                  defaultCurrency={item.currency}
                  onSelected={(itemCurrency) =>
                    onSelectedCurrency(incomeList, item.code, itemCurrency)
                  }
                />
                <TextInput
                  placeholder={item.name}
                  placeholderTextColor={colors.secondary}
                  style={[
                    getStyles(mode).textInput,
                    getStyles(mode).searchBar,
                    { textAlign: "right" },
                  ]}
                  keyboardType="numeric"
                  onChangeText={(value) =>
                    setTicketAmount(incomeList, item.code, value)
                  }
                />
              </View>
            ))}
          </View>
        </View>

        <View style={{ padding: 10 }}>
          <View style={[styles.container, { flex: 1 }]}>
            <Text
              style={[
                getStyles(mode).sectionTitle,
                {
                  borderRadius: 0,
                  paddingBottom: 5,
                  borderBottomColor: colors.gray50,
                  borderBottomWidth: 1,
                },
              ]}
            >
              Mis Inversiones
            </Text>
            {investList.map((item, index) => (
              <View key={index} style={[getStyles(mode).row, { flexDirection: "row" }]}>
                <CurrencyDropDown
                  defaultCurrency={item.currency}
                  onSelected={(itemCurrency) =>
                    onSelectedCurrency(investList, item.code, itemCurrency)
                  }
                />
                <TextInput
                  placeholder={item.name}
                  placeholderTextColor={colors.secondary}
                  style={[
                    getStyles(mode).textInput,
                    getStyles(mode).searchBar,
                    { textAlign: "right" },
                  ]}
                  keyboardType="numeric"
                  onChangeText={(value) =>
                    setTicketAmount(investList, item.code, value)
                  }
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      
      <TouchableOpacity 
        onPress={() => checkInfoAndSave()} 
        style={[getStyles(mode).floatingBtn, {top:50}]}
      >
        <AntDesign name="check" size={24} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
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

export default QuickEntry;
