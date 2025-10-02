import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  useColorScheme,
  KeyboardAvoidingView,
  TextInput,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import { colors, tStyles } from "../common/theme";
import { getStyles } from "../styles/home";
import Hr from "../components/Hr";
import { SafeAreaView } from "react-native-safe-area-context";
import Modal from "../components/Modal";
import LineTextInput from "../components/LineTextInput";
import TitleBar from "../components/TitleBar";
import AppContext from "../context/appContext";
import Loading from "../components/Loading";
import { setProfile, getProfile } from "../commonApp/profile";
import CurrencyDropDown from "../components/CurrencyDropDown";
import { currencyList } from "../commonApp/currency";
import { AREA_OF_WORK_LIST } from "../commonApp/constants";
import DropDownList from "../components/DropDownList";
import { displayTime, ellipString } from "../common/helpers";
import WrappingFlatList from "../components/WrappingFlatList";

const Profile_PayMethod = ({ navigation, route }) => {
  const mode = useColorScheme();

  const { showAlertModal } = React.useContext(AppContext);
  const [loading, setLoading] = React.useState("");

  let profile = getProfile(); // mm - obtengo los datos del profile
  const [payMethod, setPayMethod] = React.useState([]);
  const [defaultCurrency, setDefaultCurrency] = React.useState("UYU");

  // Aquí podés hacer cosas que se ejecutan una vez al cargar el componente
  useEffect(() => {
    setPayMethod(profile.payMethodInfo);
    setDefaultCurrency(profile.defaultCurrency);

    return () => {
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)

  function onSelectedCurrency(item) {
    setDefaultCurrency(item);
  }

  async function checkInfoAndSave() {
    try {
      setLoading(true);

      try {
        profile.payMethodInfo = payMethod;
        profile.defaultCurrency = defaultCurrency;

        await setProfile(profile);

        navigation.navigate("UserProfile");
      } catch (e) {
        showAlertModal(
          "Atención",
          "Existio un error al actualizar la información, por favor intentar en unos minutos",
          {
            ok: true,
            cancel: false,
          }
        );
        console.log(e);
      }

      setLoading(false);
    } catch (e) {
      console.log(e);
    }
  }
  return (
    <SafeAreaView style={getStyles(mode).container}>
      <Loading loading={loading} title="Procesando..." />
      <View>
        {/* Top Bar  */}
        <TitleBar
          title="Instrucciones de Pago"
          subTitle=""
          goBack={true}
          onGoBack={checkInfoAndSave}
        ></TitleBar>
        <View style={{padding:15}}>
            <View style={{ padding: 5 }}>
              <Text style={getStyles(mode).sectionTitle}>Métodos de Pago</Text>
              </View>
              <View style={{ padding: 5 }}>
              <View style={getStyles(mode).searchBar}>
                <TextInput
                  placeholder="cómo y porqué medios pueden pagarte..."
                  placeholderTextColor={colors.secondary}
                  style={getStyles(mode).textInput}
                  value={payMethod}
                  multiline={true}
                  numberOfLines={5}
                  onChangeText={setPayMethod}
                />
              </View>
              <Text style={[getStyles(mode).sectionTitle, { padding:5, marginTop: 30 }]}>
                Moneda frecuente
              </Text>
              <CurrencyDropDown
                defaultCurrency={defaultCurrency}
                onSelected={onSelectedCurrency}
              />
            </View>
            </View>
            </View>
    </SafeAreaView>
  );
};
export default Profile_PayMethod;
