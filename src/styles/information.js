import { StyleSheet } from "react-native";
import { tStyles, fonts, colors } from "../common/theme";


const lightStyles = StyleSheet.create({
    container: {
        ...tStyles.flex1,  
        backgroundColor: colors.white
    },
    topBarHolder: {
        ...tStyles.spacedRow, 
        paddingHorizontal: 15, 
        paddingVertical: 10
    },
    topBarMainText: {
        ...fonts.medium
    },
    topBarSecText: {
        ...fonts.regular,  
        fontSize: 11, 
        marginTop: 1 
    },
    informationText: {
        ...fonts.regular,
        lineHeight: 19,
        textAlign: 'justify',
        fontSize: 13
    }
});


const darkStyles = StyleSheet.create({
    container: {
        ...lightStyles.container,
        backgroundColor: colors.dark
    },
    topBarHolder: {
        ...lightStyles.topBarHolder
    },
    topBarMainText: {
        ...lightStyles.topBarMainText,
        color: colors.white
    }, 
    topBarSecText: {
        ...lightStyles.topBarSecText,
        color: colors.gray30
    },
    informationText: {
        ...lightStyles.informationText,
        color: colors.gray10
    }
});



export const getStyles = (mode) => {
    if(mode == 'light'){
        return lightStyles;
    }else{
        return darkStyles;
    }
}