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
        ...fonts.medium,
        marginLeft: 15
    },
    profileImageHolder: {
        ...tStyles.centery,
        paddingVertical: 20
    },
    linkIconHolder: { 
        ...tStyles.centerx,
        ...tStyles.centery
    },
    linkAvatar: {
        width: 150, 
        height: 150, 
        borderRadius: 75
    },
    avatarHolder: { 
        position: 'absolute', 
        right: -5, bottom: 5, 
        backgroundColor: colors.primary, 
        borderRadius: 100,
        padding: 10
    },
    profileDetail: {
        ...tStyles.row,
        paddingVertical: 25
    },
    profileTextHolder: {
        ...tStyles.flex1
    },
    profileMainText: {
        ...fonts.regular,
        fontSize: 16
    },
    profileSecText: {
        ...fonts.regular,
        color: colors.gray50,
        marginBottom: 3,
        fontSize: 13
    },
    modalContainer: {
        backgroundColor: colors.white,
        width: '100%', height: '100%',
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        paddingVertical: 25,
        paddingHorizontal: 30
    },
    modalHeading: {
        ...fonts.semibold,
        fontSize: 16,
        marginBottom: 10
    },
    modalActionBtn:{
        paddingVertical: 5
    },
    modalActionBtnText: {
        ...fonts.semibold,
        color: colors.primary
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
    profileImageHolder: {
        ...lightStyles.profileImageHolder
    },
    linkIconHolder: { 
        ...tStyles.centerx,
        ...tStyles.centery
    },
    linkAvatar: {
        ...lightStyles.linkAvatar
    },
    avatarHolder: { 
        ...lightStyles.avatarHolder
    },
    profileDetail: {
        ...lightStyles.profileDetail
    },
    profileTextHolder: {
        ...lightStyles.profileTextHolder
    },
    profileMainText: {
        ...lightStyles.profileMainText,
        color: colors.white
    },
    profileSecText: {
        ...lightStyles.profileSecText
    },
    modalContainer: {
        ...lightStyles.modalContainer,
        backgroundColor: colors.darkSecondary
    },
    modalHeading: {
        ...lightStyles.modalHeading,
        color: colors.gray10
    },
    modalActionBtn:{
        ...lightStyles.modalActionBtn
    },
    modalActionBtnText: {
        ...lightStyles.modalActionBtnText
    }
});



export const getStyles = (mode) => {
    if(mode == 'light'){
        return lightStyles;
    }else{
        return darkStyles;
    }
}