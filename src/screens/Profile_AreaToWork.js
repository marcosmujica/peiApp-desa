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
import { AREA_OF_WORK_LIST } from "../commonApp/constants";
import DropDownList from "../components/DropDownList";
import { displayTime, ellipString } from "../common/helpers";
import WrappingFlatList from "../components/WrappingFlatList";

const Profile_AreaToWork = ({ navigation, route }) => {
  const mode = useColorScheme();

  const { showAlertModal } = React.useContext(AppContext);
  const [loading, setLoading] = React.useState("");

  let profile = getProfile(); // mm - obtengo los datos del profile
  const [areaWork, setAreaWork] = React.useState([]);

  // Aquí podés hacer cosas que se ejecutan una vez al cargar el componente
  useEffect(() => {
    // mm - cargo a la lista de areas de trabajo las que tiene seleccionadas en el profile
    setAreaWork(
      profile.areaWorksList.map((item) =>
        AREA_OF_WORK_LIST.find((elem) => elem.code === item)
      )
    );

    return () => {
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); // <- array vacío = solo se ejecuta una vez (cuando se monta)

  let userAreaToWork = [];

  function onSelectedAreaToWork(item) {
    // mm - no ingreso valores repetidos
    areaWork.findIndex((itemArray) => itemArray.code == item.code) > -1
      ? null
      : setAreaWork([...areaWork, item]);
  }

  function onDeleteAreaToWork(itemArea) {
    // mm - no ingreso valores repetidos
    setAreaWork((prevItems) =>
      prevItems.filter((item) => item.code !== itemArea)
    );
  }
  async function checkInfoAndSave() {
    try {
      setLoading(true);

      try {
        profile.areaWorksList = areaWork.map((item) => item.code);

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
          title="Áreas de Trabajo"
          subTitle=""
          goBack={true}
          onGoBack={checkInfoAndSave}
        ></TitleBar>
            <View style={{ padding: 10 }}>
              <View style={getStyles(mode).profileDetail}>
                <DropDownList
                  placeholder="selecciona el área de trabajo"
                  data={AREA_OF_WORK_LIST}
                  onSelected={onSelectedAreaToWork}
                />
              </View>
            </View>
              <View style={[tStyles.spacedRow, tStyles.flex1]}>
                <WrappingFlatList
                  areaWorkList={areaWork}
                  onDelete={onDeleteAreaToWork}
                />
              </View>
            </View>
      {/* COntinue Button */}
    </SafeAreaView>
  );
};

export default Profile_AreaToWork;
