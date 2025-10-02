import { StyleSheet } from "react-native";
import { tStyles, fonts, colors } from "../common/theme";

const lightStyles = StyleSheet.create({
    container: {
        ...tStyles.flex1,  
        backgroundColor: colors.white 
    },
    callLink: {
        ...tStyles.row, 
        marginVertical: 20
    },
    linkIconHolder: { 
        width: 45, 
        height: 45, 
        borderRadius: 25, 
        backgroundColor: colors.primary,
        ...tStyles.centerx,
        ...tStyles.centery
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
    callHeading: {
        ...fonts.semibold,  
        marginTop: 10, 
        fontSize: 16 
    },
    callContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12
    },
    callAvatar: {
        width: 50, 
        height: 50, 
        borderRadius: 25
    },
    callMainHolder: {
        ...tStyles.spacedRow, 
        ...tStyles.flex1, 
        marginLeft: 13 
    },
    callUser: {
        ...fonts.medium,  
        fontSize: 16, 
        marginBottom: 2 
    },
    callTime: {
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
    }
});


const darkStyles = StyleSheet.create({
    container: {
        ...lightStyles.container,
        backgroundColor: colors.dark
    },
    callLink: {
        ...lightStyles.callLink
    },
    linkIconHolder: { 
        ...lightStyles.linkIconHolder
    },
    linkMainText: {
        ...lightStyles.linkMainText,
        color: colors.white
    },
    linkSecText: {
        ...lightStyles.linkSecText,
        color: colors.gray30
    },
    callHeading: {
        ...lightStyles.callHeading,
        color: colors.gray30
    },
    callContainer: {
        ...lightStyles.callContainer
    },
    callAvatar: {
        ...lightStyles.callAvatar
    },
    callMainHolder: {
        ...lightStyles.callMainHolder
    },
    callUser: {
        ...lightStyles.callUser,
        color: colors.white
    },
    callTime: {
        ...lightStyles.callTime,
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