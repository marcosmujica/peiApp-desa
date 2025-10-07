import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
  Platform
} from "react-native";
import {
  MaterialIcons,
  Ionicons,
  Entypo,
  FontAwesome5,
} from "@expo/vector-icons";
import * as Screens from "../screens";
import { colors, fonts, tStyles } from "../common/theme";
import React, { useEffect } from "react";
import AppContext from "../context/appContext";
import { getStyles } from "../styles/common";
import { BackHandler } from "react-native";
import { useNavigationState, CommonActions, useFocusEffect } from "@react-navigation/native";
import * as IntentLauncher from "expo-intent-launcher";

const Tab = createBottomTabNavigator();

const MainScreen = ({ navigation }) => {
  const mode = useColorScheme();

  const routes = useNavigationState((state) => state.routes);
  const currentRoute = routes[routes.length - 1]?.name;

  useEffect(() => {
    const backAction = () => {
      if (currentRoute === "MainScreen") {
        // 👇 Si estamos en Home, salir de la app
        if (Platform.OS === "android") {
          IntentLauncher.startActivityAsync("android.intent.action.MAIN", {
            category: "android.intent.category.HOME",
          });
        } else {
          alert("iOS no permite minimizar la app desde código");
        }
      } else {
        // 👇 Si no, volver a la pantalla anterior
        navigation.goBack();
      }
      return true; // ✅ indica que manejamos el evento
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [currentRoute]);

  // Removed useFocusEffect to prevent infinite update loop.

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerStyle: getStyles(mode).headerNav }}
    >
      <Tab.Screen
        name="Chats"
        component={Screens.Home}
        options={{
          title: "peiApp",
          tabBarIcon: () => (
            <MaterialIcons
              name="chat"
              size={20}
              color={mode == "dark" ? colors.gray30 : null}
            />
          ),
          tabBarSelectedIcon: () => (
            <MaterialIcons name="chat" size={20} color={colors.primary} />
          ),
          headerTitle: (props) => <CustomHeader {...props} />,
          tabBarBadge: 10,
        }}
      />
      <Tab.Screen
        name="Updates"
        component={Screens.Updates}
        options={{
          tabBarIcon: () => (
            <MaterialIcons
              name="bubble-chart"
              size={20}
              color={mode == "dark" ? colors.gray30 : null}
            />
          ),
          tabBarSelectedIcon: () => (
            <MaterialIcons
              name="bubble-chart"
              size={20}
              color={colors.primary}
            />
          ),
          headerTitle: (props) => <CustomHeader {...props} />,
        }}
      />
      <Tab.Screen
        name="Calls"
        component={Screens.Calls}
        options={{
          tabBarIcon: () => (
            <Ionicons
              name="call-sharp"
              size={20}
              color={mode == "dark" ? colors.gray30 : null}
            />
          ),
          tabBarSelectedIcon: () => (
            <Ionicons name="call-sharp" size={20} color={colors.primary} />
          ),
          headerTitle: (props) => <CustomHeader {...props} />,
        }}
      />

      <Tab.Screen
        name="Settings1"
        component={Screens.Settings}
        options={{
          tabBarIcon: () => (
            <FontAwesome5
              name="cog"
              size={20}
              color={mode == "dark" ? colors.gray30 : null}
            />
          ),
          tabBarSelectedIcon: () => (
            <FontAwesome5 name="cog" size={20} color={colors.primary} />
          ),
          headerTitle: (props) => <CustomHeader {...props} />,
        }}
      />
    </Tab.Navigator>
  );
};

function CustomHeader({ children }) {
  const mode = useColorScheme();
  const { options, setOptions } = React.useContext(AppContext);

  return (
    <View style={getStyles(mode).tabHeader}>
      <Text style={getStyles(mode).tabHeaderText}>{children}</Text>

      <TouchableOpacity 
        onPress={() => setOptions(!options)}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        style={{ padding: 8 }}
      >
        <Entypo
          name="dots-three-vertical"
          size={16}
          color={mode == "dark" ? colors.white : null}
        />
      </TouchableOpacity>
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const mode = useColorScheme();

  return (
    <View style={getStyles(mode).tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;

        const tabBarIcon =
          options.tabBarIcon !== undefined ? options.tabBarIcon : () => {};

        const tabBarSelectedIcon =
          options.tabBarSelectedIcon !== undefined
            ? options.tabBarSelectedIcon
            : () => {};

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: "center",
              paddingTop: 10,
              paddingBottom: 15,
            }}
            key={index}
          >
            <View
              style={[
                getStyles(mode).tabBarIconHolder,
                isFocused ? getStyles(mode).tabBarFocused : null,
              ]}
            >
              {!isFocused ? tabBarIcon() : tabBarSelectedIcon()}
            </View>

            <Text
              style={[
                isFocused
                  ? getStyles(mode).tabBarFocusedText
                  : getStyles(mode).tabBarText,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default MainScreen;
