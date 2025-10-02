import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fontisto, Entypo, AntDesign, Feather } from "@expo/vector-icons";
import { colors, fonts, tStyles } from "../common/theme";
import { getStyles } from "../styles/home";
import {
  db_addTicket,
  db_getGroupInfo,
  db_addGroupByTicket,
  db_addTicketLogStatus,
  db_getTicketInfo,
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
import { getProfile } from "../commonApp/profile";
import TitleBar from "../components/TitleBar";
import {
  formatDateToStringLong,
  formatNumber,
} from "../commonApp/functions";
import { diasEntreFechas } from "../commonApp/functions";

const TicketResume = ({ navigation, route }) => {
  const [ticket] = React.useState(route.params);
  const mode = useColorScheme();

  let profile = getProfile();

  return (
    <SafeAreaView style={getStyles(mode).container}>
      {/* Top Bar  */}
      <TitleBar title={ticket.title} subtitle="" goBack={true} options={[]} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            margin: 10,
          }}
        >
          {ticket.way == TICKET_TYPE_COLLECT && (
            <TouchableOpacity
              style={[
                getStyles(mode).chatFilter,
                getStyles(mode).activeChatFilter,
              ]}
            >
              <Text
                style={[
                  getStyles(mode).chatFilterText,
                  getStyles(mode).activeChatFilterText,
                ]}
              >
                COBRAR 
              </Text>
            </TouchableOpacity>
          )}
          {ticket.way == TICKET_TYPE_PAY && (
            <TouchableOpacity
              style={[
                getStyles(mode).chatFilter,
                getStyles(mode).activeChatFilter,
              ]}
            >
              <Text
                style={[
                  getStyles(mode).chatFilterText,
                  getStyles(mode).activeChatFilterText,
                ]}
              >
                PAGAR [
                {EXPENSES_CATEGORY.find(
                  (a) => a.code == ticket.pay.expensesCategory
                ).name.toUpperCase()}
                ]
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              getStyles(mode).chatFilter,
              getStyles(mode).activeChatFilter,
              { backgroundColor: "#96c7e1", borderRadius: 10 },
            ]}
          >
            <Text
              style={[
                getStyles(mode).chatFilterText,
                getStyles(mode).activeChatFilterText,
                { color: colors.dark },
              ]}
            >
              {TICKET_DETAIL_STATUS.find(
                (item) => item.code == ticket.status
              ).name.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.container, { padding: 10 }]}>
          {ticket.note != "" && (
            <View style={[getStyles(mode).row, { padding: 10 }]}>
              <Text style={[getStyles(mode).sectionTitle, { padding: 0 }]}>
                Descripción
              </Text>
              <Text style={getStyles(mode).normalText}>{ticket.note}</Text>
            </View>
          )}
          {ticket.notePrivate != "" && (
            <View style={[getStyles(mode).row, { padding: 10 }]}>
              <Text style={[getStyles(mode).sectionTitle, { padding: 0 }]}>
                Nota Privada
              </Text>
              <Text style={getStyles(mode).normalText}>
                {ticket.notePrivate}
              </Text>
            </View>
          )}
          {ticket.metadata.externalReference != "" && (
            <View style={[getStyles(mode).row, { padding: 10 }]}>
              <Text style={[getStyles(mode).sectionTitle, { padding: 0 }]}>
                Referencia
              </Text>
              <Text style={getStyles(mode).normalText}>
                {ticket.metadata.externalReference}
              </Text>
            </View>
          )}
          
          <View style={[getStyles(mode).row, { padding: 10 }]}>
            <Text style={[getStyles(mode).sectionTitle, { padding: 0 }]}>
              Importe Inicial
            </Text>
            <Text style={getStyles(mode).normalText}>
              {ticket.currency} {formatNumber(ticket.initialAmount)}
            </Text>
          </View>

<View style={{ marginVertical: 10, borderRadius:10, borderWidth: 1,
                  borderColor: colors.lightPrimary, backgroundColor:colors.gray75,
                  color: colors.white,}}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 10,
                }}
              >
                <Text
                  style={[
                    getStyles(mode).sectionTitle,
                    {
                      fontWeight: "bold",
                      flex: 1,
                      textAlign: "center",
                      padding: 5,
                    },
                  ]}
                >
                  Importe Actual
                </Text>
                <Text
                  style={[
                    getStyles(mode).sectionTitle,
                    {
                      fontWeight: "bold",
                      flex: 1,
                      textAlign: "center",
                      padding: 5,
                    },
                  ]}
                >
                  Pagado
                </Text>
                <Text
                  style={[
                    getStyles(mode).sectionTitle,
                    {
                      fontWeight: "bold",
                      flex: 1,
                      textAlign: "center",
                      padding: 5,
                    },
                  ]}
                >
                  Falta 
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  borderTopWidth: 1,
                  borderTopColor: "#fff",
                  borderRadius:0,
                  textAlign: "right",

                }}
              >
                <Text
                  style={[
                    getStyles(mode).normalText,
                    { flex: 1, textAlign: "right", padding: 10 },
                  ]}
                >
                  {ticket.currency} {formatNumber(ticket.amount)}
                </Text>
                <Text
                  style={[
                    getStyles(mode).normalText,
                    {
                      flex: 1,
                      textAlign: "right",
                      borderLeftWidth: 1,
                      borderLeftColor: colors.dark,
                      borderRightWidth: 1,
                      borderRightColor: colors.dark,
                      padding: 10,
                    },
                  ]}
                >
                  {ticket.currency} {formatNumber(ticket.partialAmount)}
                </Text>
                <Text
                  style={[
                    getStyles(mode).normalText,
                    { flex: 1, textAlign: "right", padding: 10 },
                  ]}
                >
                  {ticket.currency}{" "}
                  {formatNumber(ticket.amount - ticket.partialAmount)}
                </Text>
              </View>
            </View>
            <View style={[getStyles(mode).row, { padding: 10 }]}>
            <Text style={[getStyles(mode).sectionTitle, { padding: 0 }]}>
              Creación del Ticket
            </Text>
            <Text style={getStyles(mode).normalText}>
              {formatDateToStringLong(ticket.TSCreated) +
                " (" +
                Math.abs(diasEntreFechas(ticket.TSCreated)) +
                " días)"}
            </Text>
          </View>
          <View style={[getStyles(mode).row, { padding: 10 }]}>
            <Text style={[getStyles(mode).sectionTitle, { padding: 0 }]}>
              Vencimiento del Ticket
            </Text>
            <Text style={getStyles(mode).normalText}>
              {formatDateToStringLong(ticket.TSDueDate) +
                " (" +
                diasEntreFechas(ticket.TSDueDate) +
                " días)"}
            </Text>
          </View>
          {ticket.way == TICKET_TYPE_COLLECT && (
            <View style={{ marginVertical: 10, borderRadius:10, borderWidth: 1,
                  borderColor: colors.lightPrimary, backgroundColor:colors.gray75,
                  color: colors.white,}}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 10,
                }}
              >
                <Text
                  style={[
                    getStyles(mode).sectionTitle,
                    {
                      fontWeight: "bold",
                      flex: 1,
                      textAlign: "center",
                      padding: 5,
                    },
                  ]}
                >
                  Importe
                </Text>
                <Text
                  style={[
                    getStyles(mode).sectionTitle,
                    {
                      fontWeight: "bold",
                      flex: 1,
                      textAlign: "center",
                      padding: 5,
                    },
                  ]}
                >
                  Gasté
                </Text>
                <Text
                  style={[
                    getStyles(mode).sectionTitle,
                    {
                      fontWeight: "bold",
                      flex: 1,
                      textAlign: "center",
                      padding: 5,
                    },
                  ]}
                >
                  Gané
                </Text>
              </View>
              <View style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  borderTopWidth: 1,
                  borderTopColor: "#fff",
                  borderRadius:0,
                  textAlign: "right",
                }}
              >
                <Text
                  style={[
                    getStyles(mode).normalText,
                    { flex: 1, textAlign: "right", padding: 10 },
                  ]}
                >
                  {ticket.currency} {formatNumber(ticket.amount)}
                </Text>
                <Text
                  style={[
                    getStyles(mode).normalText,
                    {
                      flex: 1,
                      textAlign: "right",
                      borderLeftWidth: 1,
                      borderLeftColor: colors.dark,
                      padding: 10,
                    },
                  ]}
                >
                  {ticket.currency} {formatNumber(ticket.collect.billsAmount)}
                </Text>
                <Text
                  style={[
                    getStyles(mode).normalText,
                    { flex: 1, textAlign: "right", padding: 10 },
                  ]}
                >
                  {ticket.currency}{" "}
                  {formatNumber(ticket.amount - ticket.collect.billsAmount)}
                </Text>
              </View>
            </View>
          )}
          
          {ticket.paymentInfo.paymentMethod != "" && (
            <View style={[getStyles(mode).row, { padding: 10 }]}>
              <Text style={[getStyles(mode).sectionTitle, { padding: 0 }]}>
                Instrucciones de Pago
              </Text>
              <Text style={getStyles(mode).normalText}>
                {ticket.paymentInfo.paymentMethod}
              </Text>
            </View>
          )}

          {/* SI ES TIPO PAGAR*/}
          {ticket.way == TICKET_TYPE_COLLECT && (
            <View>
              {ticket.collect.billsNote !="" && <View style={[getStyles(mode).row, { padding: 10 }]}>
                <Text style={[getStyles(mode).sectionTitle, { padding: 0 }]}>
                  Cosas en las que gasté
                </Text>
                <Text style={getStyles(mode).normalText}>
                  {ticket.collect.billsNote}
                </Text>
              </View>
              }
              <View style={{ padding: 10 }}>
                <View>
                  <Text style={getStyles(mode).sectionTitle}>
                    Área de Trabajo - {ticket.collect.areaWork}
                  </Text>
                </View>
              </View>

            </View>
          
          )}
        </View>
      </ScrollView>
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

export default TicketResume;
