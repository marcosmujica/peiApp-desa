import React, {useEffect} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MainStackNavigator } from "./navigators/MainStackNavigator";
import AppContext from "./context/appContext";
import AlertModal from "./components/AlertModal";

const PeiApp = () => {
  const { alertModal, setAlertModal, alertOptions, alertCallback } =
    React.useContext(AppContext);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MainStackNavigator />

        {alertModal && <AlertModal setModal={setAlertModal} />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
export default PeiApp;
