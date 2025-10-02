import { StyleSheet } from "react-native";
import { colors, tStyles, fonts } from "../common/theme";


const lightStyles = StyleSheet.create({
    container: {
        backgroundColor: colors.dark,
        ...tStyles.flex1
    },
    callDetailsHolder: {
        ...tStyles.flex1, 
        ...tStyles.centery,  
        marginTop: 60 
    },
    callAvatar: {
        width: 100, 
        height: 100, 
        borderRadius: 50
    },
    callUser: {
        ...fonts.medium,  
        marginTop: 20, 
        fontSize: 25, 
        color: colors.white
    },
    callDetail: {
        ...fonts.regular, 
        marginTop: 3, 
        fontSize: 15, 
        color: colors.gray10
    },
    bottomControls: {
        backgroundColor: colors.darkSecondary,
        padding: 35,
        ...tStyles.spacedRow,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15
    },
    endBtn: {
        width: 48,
        height: 48,
        borderRadius: 25,
        backgroundColor: 'red',
        ...tStyles.centerx,
        ...tStyles.centery
    }
});


const darkStyles = lightStyles;


export const getStyles = (mode) => {
    if(mode == 'light'){
        return lightStyles;
    }else{
        return darkStyles;
    }
}