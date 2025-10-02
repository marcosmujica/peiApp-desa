import { StyleSheet } from "react-native";
import { tStyles, fonts, colors } from "../common/theme";


const lightStyles = StyleSheet.create({
    container: {
        ...tStyles.flex1,  
        backgroundColor: colors.white
    },
    profileHolder: {
        ...tStyles.row,
        paddingHorizontal: 15,
        paddingVertical: 15
    },
    profileAvatar: {
        width: 60,
        height: 60,
        borderRadius: 35,
        marginRight: 15
    },
    profileName: {
        ...fonts.medium,
        fontSize: 20
    },
    profileStatus: {
        ...fonts.regular,
        marginTop: 4,
        color: colors.gray50,
        fontSize: 13
    },
    settingsLink: {
        ...tStyles.row,
        paddingVertical: 16
    },
    settingsTextHolder: {
        ...tStyles.flex1,
    },
    settingMainText: {
        ...fonts.regular,
        fontSize: 16
    },
    settingSecText: {
        ...fonts.regular,
        color: colors.gray50,
        marginTop: 3,
        fontSize: 13
    },
    topBarHolder: {
        ...tStyles.spacedRow, 
        paddingHorizontal: 15, 
        paddingVertical: 10
    },
    topBarMainText: {
        ...fonts.medium,
        fontSize: 18
    },
    helpTextArea: {
        minHeight: 100,
        backgroundColor: colors.gray5,
        padding: 10,
        ...fonts.regular,
        borderBottomWidth: 3,
        borderColor: colors.primary,
        textAlignVertical: 'top'
    },
    helpInfoText: {
        ...fonts.regular,
        fontSize: 12,
        marginTop: 13,
        color: colors.gray50
    },
    
});


const darkStyles = StyleSheet.create({
    container: {
        ...lightStyles.container,
        backgroundColor: colors.dark
    },
    profileHolder: {
        ...lightStyles.profileHolder
    },
    profileAvatar: {
        ...lightStyles.profileAvatar
    },
    profileName: {
        ...lightStyles.profileName,
        color: colors.white
    },
    profileStatus: {
        ...lightStyles.profileStatus
    },
    settingsLink: {
        ...lightStyles.settingsLink
    },
    settingsTextHolder: {
       ...lightStyles.settingsTextHolder
    },
    settingMainText: {
        ...lightStyles.settingMainText,
        color: colors.white
    },
    settingSecText: {
        ...lightStyles.settingSecText
    },
    topBarHolder: {
        ...lightStyles.topBarHolder
    },     
    topBarMainText: {
        ...lightStyles.topBarMainText,
        color: colors.white
    }, 
    helpTextArea: {
        ...lightStyles.helpTextArea,
        backgroundColor: colors.darkSecondary,
        color: colors.gray30
    },
    helpInfoText: {
       ...lightStyles.helpInfoText,
        color: colors.gray30
    }
});


export const getStyles = (mode) => {
    if(mode == 'light'){
        return lightStyles;
    }else{
        return darkStyles;
    }
}