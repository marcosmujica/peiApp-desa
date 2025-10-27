import { StyleSheet } from "react-native";
import { tStyles, fonts, colors } from "../common/theme";


const lightStyles = StyleSheet.create({
    headerNav: {
        backgroundColor:  colors.white 
    },
    tabHeader: { 
        flexDirection: 'row', 
        width: '100%', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    tabHeaderText: {
        ...fonts.semibold,  
        fontSize: 20, 
        color: colors.primary
    },
    tabBarContainer: {
        flexDirection: 'row', 
        paddingBottom: 15, 
        backgroundColor: colors.white
    },
    tabBarIconHolder: {
        paddingHorizontal: 20, 
        paddingVertical: 3
    },
    tabBarFocused: {
        backgroundColor: colors.lightPrimary,
        borderRadius: 20
    }, 
    tabBarText:{
        ...fonts.semibold, 
        marginTop: 8
    },
    tabBarFocusedText: {
        marginTop: 8,
        ...fonts.black
    },
    lineTextInput: {
        padding: 5,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
        ...fonts.medium
    },
    topBarHolder: {
        ...tStyles.row, 
        paddingHorizontal: 15, 
        paddingBottom: 15,
        paddingTop: 55,
        backgroundColor: colors.white,
        overflow: 'visible',
        zIndex: 1,
        minHeight: 85
    },
    topBarMainText: {
        ...fonts.medium,
        marginLeft: 50
    },
    avatar: {
        ...tStyles.selfcenter,
        width: 120, 
        height: 120, 
        borderRadius: 60,
        position: 'absolute',
        top: 80,
        zIndex: 2,
        overflow: 'hidden'
    },
    slideOptionsContainer: {
        position: 'absolute',
        right: 15,
        paddingHorizontal: 25,
        paddingVertical: 15,
        backgroundColor: colors.white,
        borderRadius: 8,
        ...tStyles.shadow,
        minWidth: 200
    },
    slideOptionsText: {
        ...fonts.regular,  
        fontSize: 15
    }
});


const darkStyles = StyleSheet.create({
    headerNav: {
        ...lightStyles.headerNav,
        backgroundColor: colors.dark
    },
    tabHeader: {
        ...lightStyles.tabHeader
    },
    tabHeaderText: {
        ...lightStyles.tabHeaderText,
        color: colors.white
    },
    tabBarContainer: {
        ...lightStyles.tabBarContainer,
        backgroundColor: colors.dark
    },
    tabBarIconHolder: {
        ...lightStyles.tabBarIconHolder
    },
    tabBarFocused: {
        ...lightStyles.tabBarFocused,
        backgroundColor: colors.darkPrimary
    },
    tabBarText:{
       ...lightStyles.tabBarText,
       color: colors.gray30
    },
    tabBarFocusedText: {
        ...lightStyles.tabBarFocusedText,
        color: colors.white
    },
    lineTextInput: {
        ...lightStyles.lineTextInput
    },
    topBarHolder: {
        ...lightStyles.topBarHolder,
        backgroundColor: colors.dark
    },
    topBarMainText: {
        ...lightStyles.topBarMainText,
        color: colors.white
    },
    avatar: {
        ...lightStyles.avatar
    },
    slideOptionsContainer: {
        ...lightStyles.slideOptionsContainer,
        backgroundColor: colors.darkSecondary
    },
    slideOptionsText: {
        ...lightStyles.slideOptionsText,
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