import { StyleSheet } from "react-native";
import { colors, tStyles, fonts } from "../common/theme";

const lightStyles = StyleSheet.create({
    container: {
        ...tStyles.flex1, 
        backgroundColor: colors.white 
    },
    statusLink: {
        ...tStyles.row,  
        marginVertical: 20
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
    linkMainText: {
        ...fonts.semibold,  
        fontSize: 16 
    },
    linkSecText: {
        ...fonts.regular,  
        marginTop: 2, 
        fontSize: 13 
    },
    avatarHolder: { 
        position: 'absolute', 
        right: -5, bottom: 5, 
        backgroundColor: colors.white, 
        borderRadius: 100 
    },
    statusHeading: {
        ...fonts.semibold,  
        marginTop: 10, 
        fontSize: 16 
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12
    },
    statusAvatar: {
        width: 45, 
        height: 45, 
        borderRadius: 25, 
        position: 'absolute', 
        top: 5, left: 5
    },
    statusUser: {
        ...fonts.medium,  
        fontSize: 16, 
        marginBottom: 2 
    },
    statusTime: {
        ...fonts.regular,  
        fontSize: 13, 
        color: colors.gray75
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
    }
});



const darkStyles = StyleSheet.create({
    container: {
        ...lightStyles.container,
        backgroundColor: colors.dark
    },
    statusLink: {
        ...lightStyles.statusLink
    },
    linkIconHolder: { 
        ...lightStyles.linkIconHolder
    },
    linkAvatar: {
        ...lightStyles.linkAvatar
    },
    linkMainText: {
        ...lightStyles.linkMainText,
        color: colors.white
    },
    linkSecText: {
        ...lightStyles.linkSecText,
        color: colors.gray30
    },
    avatarHolder: { 
        ...lightStyles.avatarHolder
    },
    statusHeading: {
        ...lightStyles.statusHeading,
        color: colors.gray30
    },
    statusContainer: {
        ...lightStyles.statusContainer
    },
    statusAvatar: {
        ...lightStyles.statusAvatar
    },
    statusUser: {
        ...lightStyles.statusUser,
        color: colors.white
    },
    statusTime: {
        ...lightStyles.statusTime,
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