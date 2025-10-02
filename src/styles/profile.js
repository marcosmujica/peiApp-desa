import { StyleSheet } from "react-native";
import { tStyles, fonts, colors } from "../common/theme";


const lightStyles = StyleSheet.create({
    container: {
        ...tStyles.flex1,  
        backgroundColor: colors.gray5
    },
    info: {
        backgroundColor: colors.white,
        paddingBottom: 20,
        paddingTop: 120
    },
    titleText: {
        ...fonts.medium,
        fontSize: 20,
        marginTop: 20,
        marginBottom: 5
    },
    actionBtn: {
        width: '20%',
        height: 65,
        borderWidth: 1,
        borderRadius: 15,
        borderColor: colors.gray10,
        ...tStyles.centerx,
        ...tStyles.centery
    },
    actionBtnText: {
        ...fonts.regular,
        fontSize: 13,
        marginTop: 5
    },
    subtitleText: {
        ...fonts.regular,
        color: colors.gray50
    },
    bgStrip: {
        width: '100%',
        marginTop: 10,
        paddingHorizontal: 15,
        paddingVertical: 18,
        backgroundColor: colors.white
    },
    primaryHeading: {
        ...fonts.regular,
        fontSize: 15,
        color: colors.primary,
        marginBottom: 5
    },
    secText: {
        ...fonts.regular,
        color: colors.gray50,
        marginBottom: 5
    },
    memberLink: {
        ...tStyles.row,
        paddingVertical: 10,
        marginBottom: 5
    },
    memberLinkIconHolder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        ...tStyles.centerx,
        ...tStyles.centery,
        marginRight: 18
    },
    memberLinkText: {
        ...fonts.medium,
        fontSize: 16
    },
    membersHeading: {
        ...fonts.semibold,  
        marginBottom: 10
    },
    optionBtn: {
        ...tStyles.row,
        paddingVertical: 12,
        paddingHorizontal: 5
    },
    optionBtnText: {
        ...fonts.medium,
        fontSize: 15
    },
    optionBtnSecText: {
        ...fonts.regular,
        fontSize: 13,
        marginTop: 3,
        color: colors.gray50
    },
    actionText: {
        ...fonts.regular,
        color: 'red',
        marginLeft: 15,
         fontSize: 15
    }
    
});


const darkStyles = StyleSheet.create({
    container: {
        ...lightStyles.container,
        backgroundColor: '#000000'
    },
    info: {
        ...lightStyles.info,
        backgroundColor: colors.dark
    },
    titleText: {
        ...lightStyles.titleText,
        color: colors.white
    },
    subtitleText: {
        ...lightStyles.subtitleText,
        color: colors.gray30
    },
    actionBtn: {
        ...lightStyles.actionBtn,
        borderColor: colors.gray50
    },
    actionBtnText: {
        ...lightStyles.actionBtnText,
        color: colors.gray30
    },
    bgStrip: {
        ...lightStyles.bgStrip,
        backgroundColor: colors.dark
    },
    primaryHeading: {
        ...lightStyles.primaryHeading
    },
    secText: {
        ...lightStyles.secText,
        color: colors.gray30
    },
    memberLink: {
        ...lightStyles.memberLink
    },
    memberLinkIconHolder: {
        ...lightStyles.memberLinkIconHolder
    },
    memberLinkText: {
        ...lightStyles.memberLinkText,
        color: colors.white
    },
    membersHeading: {
        ...lightStyles.membersHeading,
        color: colors.gray30
    },
    optionBtn: {
        ...lightStyles.optionBtn
    },
    optionBtnText: {
        ...lightStyles.optionBtnText,
        color: colors.gray10
    },
    optionBtnSecText: {
        ...lightStyles.optionBtnSecText,
        color: colors.gray50
    },  
    actionText: {
        ...lightStyles.actionText
    }
});



export const getStyles = (mode) => {
    if(mode == 'light'){
        return lightStyles;
    }else{
        return darkStyles;
    }
}