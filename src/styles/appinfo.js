import { StyleSheet } from "react-native";
import { tStyles, fonts, colors } from "../common/theme";


const lightStyles = StyleSheet.create({
    container: {
        ...tStyles.flex1,  
        backgroundColor: colors.gray5
    },
    topBarHolder: {
        ...tStyles.spacedRow, 
        paddingHorizontal: 15, 
        paddingVertical: 10
    },
    appName: {
        ...fonts.medium,
        fontSize: 18
    },
    appVersion: {
        ...fonts.regular,
        fontSize: 16,
        marginTop: 5,
        color: colors.gray50,
        marginBottom: 30
    },
});


const darkStyles = StyleSheet.create({
    container: {
        ...lightStyles.container,
        backgroundColor: colors.dark
    },
    topBarHolder: {
        ...lightStyles.topBarHolder
    },
    appName: {
        ...lightStyles.appName,
        color: colors.white
    },
    appVersion: {
        ...lightStyles.appVersion,
        color: colors.gray30
    },
});



export const getStyles = (mode) => {
    if(mode == 'light'){
        return lightStyles;
    }else{
        return darkStyles;
    }
}