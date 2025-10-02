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
    linkIconHolder: { 
        ...tStyles.centerx,
        ...tStyles.centery
    },
    linkAvatar: {
        width: 50, 
        height: 50, 
        borderRadius: 25
    },
    avatarHolder: { 
        position: 'absolute', 
        right: -5, bottom: 5, 
        backgroundColor: colors.white, 
        borderRadius: 100 
    },
    selectedContact: {
        alignItems: 'center',
        marginRight: 25,
        marginVertical: 15
    },
    selectedUser: {
        ...fonts.regular,
        marginTop: 5
    },
    contactsHeading: {
        ...fonts.semibold,  
        marginTop: 15, 
        marginBottom: 5 
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
    },
    floatingBtn: {
        position: 'absolute',
        bottom: 15, right: 15,
        width: 52,
        height: 52,
        backgroundColor: colors.primary,
        ...tStyles.centerx,
        ...tStyles.centery,
        borderRadius: 15
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
    topBarMainText: {
        ...lightStyles.topBarMainText,
        color: colors.white
    }, 
    topBarSecText: {
        ...lightStyles.topBarSecText,
        color: colors.gray30
    },
    linkIconHolder: { 
        ...lightStyles.linkIconHolder
    },
    linkAvatar: {
        ...lightStyles.linkAvatar
    },
    avatarHolder: { 
        ...lightStyles.avatarHolder
    },
    selectedContact: {
        ...lightStyles.selectedContact
    },
    selectedUser: {
        ...lightStyles.selectedUser,
        color: colors.gray30
    },
    contactsHeading: {
        ...lightStyles.contactsHeading,
        color: colors.gray30
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
    },
    floatingBtn: {
        ...lightStyles.floatingBtn
    }
});


export const getStyles = (mode) => {
    if(mode == 'light'){
        return lightStyles;
    }else{
        return darkStyles;
    }
}