import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import { MaterialIcons, Ionicons, Entypo, FontAwesome5 } from '@expo/vector-icons';
import * as Screens from '../screens';
import { colors, fonts, tStyles } from '../common/theme';
import React from 'react';
import AppContext from '../context/appContext';
import { getStyles } from '../styles/common';


const Tab = createBottomTabNavigator();

const  BottomTabNavigator = () => {
  const mode = useColorScheme();

  return (
    <Tab.Navigator tabBar={props => <CustomTabBar {...props} />} screenOptions={{ headerStyle: getStyles(mode).headerNav }}>
        <Tab.Screen 
            name="Tickets" 
            component={Screens.Home} 
            options={{ 
                title: "peiApp",
                tabBarIcon: () =>  <MaterialIcons name="chat" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } />,
                tabBarSelectedIcon: () => <MaterialIcons name="chat" size={ 20 } color={ colors.primary }/>,
                headerTitle: (props) => <CustomHeader {...props} />,
                tabBarBadge: 10,
            }} 
        />
        <Tab.Screen 
            name="Grupos" 
            component={Screens.HomeGroups} 
            options={{ 
              title: "peiApp",
                tabBarIcon: () =>  <MaterialIcons name="groups" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } />,
                tabBarSelectedIcon: () => <MaterialIcons name="groups" size={ 20 } color={ colors.primary } />,
                headerTitle: (props) => <CustomHeader {...props} />,
                tabBarBadge: 10,
            }} 
        />
        <Tab.Screen 
            name="Info" 
            component={Screens.Calls} 
            options={{ 
                tabBarIcon: () =>  <Ionicons name="call-sharp" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } />,
                tabBarSelectedIcon: () => <Ionicons name="call-sharp" size={ 20 } color={ colors.primary } />,
                headerTitle: (props) => <CustomHeader {...props} />
            }} 
        />
        <Tab.Screen 
            name="Info1" 
            component={Screens.Calls} 
            options={{ 
                tabBarIcon: () =>  <Ionicons name="call-sharp" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } />,
                tabBarSelectedIcon: () => <Ionicons name="call-sharp" size={ 20 } color={ colors.primary } />,
                headerTitle: (props) => <CustomHeader {...props} />
            }} 
        />

        <Tab.Screen 
            name="Settings1" 
            component={Screens.Settings} 
            options={{ 
                tabBarIcon: () =>  <FontAwesome5 name="cog" size={ 20 } color={ (mode == 'dark') ? colors.gray30 : null } />,
                tabBarSelectedIcon: () => <FontAwesome5 name="cog" size={ 20 } color={ colors.primary } />,
                headerTitle: (props) => <CustomHeader {...props} />
            }} 
        />
    </Tab.Navigator>
  );
}


function CustomHeader({ children }) {
    const { options, setOptions } = React.useContext(AppContext);
    const mode = useColorScheme();

    return(
        <View style={ getStyles(mode).tabHeader }>
            <Text style={ getStyles(mode).tabHeaderText }>{ children }</Text>

            <TouchableOpacity onPress={() => setOptions(!options)}>
                <Entypo name='dots-three-vertical' size={ 16 } color={ (mode == 'dark') ? colors.white : null } />
            </TouchableOpacity>

            
        </View>
    )
}


function CustomTabBar({ state, descriptors, navigation }) {
    const mode = useColorScheme();

    return (
      <View style={ getStyles(mode).tabBarContainer }>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : route.name;

            const tabBarIcon = options.tabBarIcon !== undefined
              ? options.tabBarIcon
              : () => {};
            
            const tabBarSelectedIcon = options.tabBarSelectedIcon !== undefined
              ? options.tabBarSelectedIcon
              : () => {};

  
          const isFocused = state.index === index;
  
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
  
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
  
          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
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
              style={{ flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 15 }}
              key={ index }
            >
                <View style={[ getStyles(mode).tabBarIconHolder, (isFocused) ? getStyles(mode).tabBarFocused : null ]}>
                    { (!isFocused) ? tabBarIcon() : tabBarSelectedIcon() }
                </View>
              
              <Text style={[ isFocused ? getStyles(mode).tabBarFocusedText : getStyles(mode).tabBarText ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
}



export default BottomTabNavigator;
