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
    contactsHeading: {
        ...fonts.semibold,  
        marginTop: 15, 
        marginBottom: 5 
    },
    contactLink: {
        ...tStyles.row,
        paddingVertical: 10
    },
    contactLinkIconHolder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        ...tStyles.centerx,
        ...tStyles.centery,
        marginRight: 18
    },
    contactLinkText: {
        ...fonts.semibold,
        fontSize: 17
    },
    contactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12
    },
    contactAvatar: {
        width: 40, 
        height: 40, 
        borderRadius: 20
    },
    contactUser: {
        ...fonts.medium,  
        fontSize: 16, 
        marginBottom: 2
    },
    contactStatus: {
        ...fonts.regular,  
        fontSize: 13, 
        color: colors.gray75, 
        marginLeft: 2
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
    contactsHeading: {
        ...lightStyles.contactsHeading,
        color: colors.gray30
    },
    contactLink: {
       ...lightStyles.contactLink
    },
    contactLinkIconHolder: {
        ...lightStyles.contactLinkIconHolder
    },
    contactLinkText: {
        ...lightStyles.contactLinkText,
        color: colors.white
    },
    contactContainer: {
        ...lightStyles.contactContainer
    },
    contactAvatar: {
        ...lightStyles.contactAvatar
    },
    contactUser: {
        ...lightStyles.contactUser,
        color: colors.white
    },
    contactStatus: {
        ...lightStyles.contactStatus,
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