import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  useColorScheme 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OtpTextInput from "react-native-text-input-otp";
import { colors, fonts, tStyles } from "../common/theme";
import { firstLogging, getProfile } from "../commonApp/profile";
import { db_checkOTP } from "../commonApp/database";
import AppContext from "../context/appContext";
import Loading from "../components/Loading";
import { useState } from "react";
import { getStyles } from "../styles/home";

var firstTime = true;
var profile;

const OTPScreen = ({ navigation }) => {
  const [visibleBtn, setVisibleBtn] = useState(true);
  const [loading, setLoading] = useState(false);
  const { showAlertModal } = React.useContext(AppContext);

  const mode = useColorScheme();

  useEffect(() => {
    return () => {
      console.log("🧹 Componente desmontado");
      // Esto se ejecuta cuando el componente se va de pantalla
    };
  }, []); //

  async function checkOTP() {
    if (otp.length >= 4) {
      // si ingresaron todos los numeros
      try {
        setLoading(true);
        setVisibleBtn(false);
        let aux = await db_checkOTP(profile.phone, otp);
        if (aux) {
          await firstLogging();
          navigation.navigate("Profile_Info", { idUser: null });
        } else {
          showAlertModal(
            "Código de autorización",
            "El código ingresado es incorrecto, por favor chequear el SMS que le hemos enviado e ingresalo de nuevo",
            {
              ok: true,
              cancel: false,
            }
          );
          setOtp("")
        }
        setVisibleBtn(true);
        setLoading(false);
      } catch (e) {
        console.log(e);
      }
    }
  }

  const [otp, setOtp] = React.useState("");

  profile = getProfile();

  return (
    <SafeAreaView style={getStyles(mode).container}>
      <Loading loading={loading} title="Verificando código..." />
      <KeyboardAvoidingView behavior="padding" style={[tStyles.flex1]}>
        <View style={[tStyles.centery, { paddingVertical: 15 }]}>
          <Text
            style={[fonts.semibold, { fontSize: 15, color: colors.primary }]}
          >
            Verificando tu número
          </Text>
        </View>

        <View style={{ paddingHorizontal: 35, marginTop: 20 }}>
          <Text style={[getStyles(mode).subNormalText,{ textAlign: "center"}]}>
          {`Hemos enviado un SMS con un código de autorización a\n${profile.phone}\n\n.`}
          </Text>
            <Text
              onPress={() => navigation.navigate("Login")}
              style={[getStyles(mode).subNormalText,{ textAlign: "center",color: "#0096FF" }]}
            >
              ¿Número equivocado?
            </Text>
        </View>

          <View
            style={[
              tStyles.flex1,
              tStyles.centery,
              { paddingHorizontal: 40, marginTop: 40 },
            ]}
          >
            <OtpTextInput
              otp={otp}
              setOtp={(value) => {
                setOtp(value);
                if (value.length === 4) {
            // Ejecutar acción cuando se ingresan 4 dígitos
            // Por ejemplo, puedes llamar a checkOTP() aquí si lo deseas
               checkOTP();
                }
              }}
              digits={4}
              style={{
                borderTopWidth: 0,
                borderRightWidth: 0,
                borderLeftWidth: 0,
                borderRadius: 0,
              }}
              fontStyle={{ ...fonts.black, color: colors.gray75, fontSize: 18 }}
            />
        </View>

        {/* Agree Button */}
        <View
          style={{
            paddingHorizontal: 15,
            marginBottom: 15,
            display: otp.length == 4 ? "block" : "none",
          }}
        >
          {visibleBtn && (
            <TouchableOpacity
              onPress={() => checkOTP()}
              style={styles.agreeBtn}
            >
              <Text
                style={[fonts.medium, { color: colors.white, fontSize: 13 }]}
              >
                Siguiente
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
});

export default OTPScreen;
