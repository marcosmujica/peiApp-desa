import React, { useRef, useEffect } from "react";
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
import { setProfile, firstLogging, getProfile, saveProfile } from "../commonApp/profile";
import { db_saveLocal, db_checkOTP } from "../commonApp/database";
import AppContext from "../context/appContext";
import Loading from "../components/Loading";
import { useState } from "react";
import { getStyles } from "../styles/home";
import { LOCAL } from "../commonApp/dataTypes";
import { URL_OTP_REQUEST, URL_OTP_VALIDATE } from "../commonApp/constants.js";

const OTPScreen = ({ navigation, route }) => {
  const [visibleBtn, setVisibleBtn] = useState(true);
  const [loading, setLoading] = useState(false);
  const { showAlertModal } = React.useContext(AppContext);
  let profile = route.params["profile"];
  const [phone] = useState (profile.phone)
  
  const [requestID, setRequestId] = useState("") // mm - id devuelvo por el setotp
  const mode = useColorScheme();

  const otpRef = useRef(null);

  async function getOTP()
  {
    try{
      let aux = await fetch (URL_OTP_REQUEST, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ phone: phone })})

      let response = await aux.json();
      setRequestId (response.requestId);
      }
      catch (e) {console.log (e)}
  }

  useEffect(() => {
    
    getOTP ()
    
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
        
        console.log('📤 Enviando validación OTP');
        console.log('requestID:', requestID);
        console.log('otp:', otp);
        
        let aux = await fetch (URL_OTP_VALIDATE, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ requestId: requestID,  code: otp})})
      
        let response = await aux.json();
        
        if (aux.ok && response.token) {
          // mm - creo el id en el local
          let local = new LOCAL()
          local.idUser = profile.phone
          await db_saveLocal (local)
          await setProfile (profile)
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
        }
        setVisibleBtn(true);
        
      } catch (e) {
        showAlertModal ("Error", "Existio un error al intentar acceder al código, por favor reintenta más tarde")
        console.log(e);
      }
      setVisibleBtn(true);
      setOtp ("")
      setLoading(false);
    }
  }

  const [otp, setOtp] = React.useState("");

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
          {`Hemos enviado un SMS con un código de autorización a\n${profile.phone}.\n\n`}
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
