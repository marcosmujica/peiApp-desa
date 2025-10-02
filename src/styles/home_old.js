import { StyleSheet } from "react-native";
import { colors, tStyles, fonts } from "../common/theme";

const lightStyles = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: colors.white 
    },
    searchBar: {
        backgroundColor: colors.gray3,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        marginVertical: 10
    },
    searchBarInput: {
        ...fonts.regular,  
        fontSize: 16, 
        flex: 1, 
        marginLeft: 10 
    },
    chatContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12
    },
    chatAvatar: {
        width: 50, 
        height: 50, 
        borderRadius: 25
    },
    chatMessageHolder: {
        ...tStyles.spacedRow, 
        ...tStyles.flex1, 
        marginLeft: 13
    },
    chatUsername: {
        ...fonts.medium, 
        fontSize: 16, 
        marginBottom: 2
    },
    chatMessage: {
        ...fonts.regular,  
        fontSize: 13, 
        color: colors.gray75, 
        marginLeft: 2
    },
    chatTime: {
        ...fonts.regular,  
        fontSize: 12,
        color: colors.gray75
    },
    activeBadge: {
        minWidth: 20,
        minHeight: 20,
        paddingHorizontal: 4,
        borderRadius: 10,
        ...tStyles.centerx,
        ...tStyles.centery,
        backgroundColor: colors.primary,
        marginTop: 6
    },
    badgeText: {
        ...fonts.medium,  
        color: colors.white, 
        fontSize: 10 
    },
    activeText: {
        color: colors.primary,
        ...fonts.semibold
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
    chatFilter: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: colors.gray5,
        alignSelf: 'flex-start',
        borderRadius: 15,
        marginRight: 5
    },
    chatFilterText: {
        ...fonts.semibold,  
        fontSize: 13, 
        color: colors.gray50 
    },
    activeChatFilter: {
        backgroundColor: colors.lightPrimary
    },
    activeChatFilterText: {
        color: colors.primary
    }
});


const darkStyles = StyleSheet.create({
    container: {
        ...lightStyles.container,
        backgroundColor: colors.dark 
    },
    searchBar: {
        ...lightStyles.searchBar,
        backgroundColor: colors.darkSecondary
    },
    searchBarInput: {
       ...lightStyles.searchBarInput
    },
    chatContainer: {
        ...lightStyles.chatContainer
    },
    chatAvatar: {
        ...lightStyles.chatAvatar
    },
    chatMessageHolder: {
        ...lightStyles.chatMessageHolder
    },
    chatUsername: {
        ...lightStyles.chatUsername,
        color: colors.white
    },
    chatMessage: {
        ...lightStyles.chatMessage,
        color: colors.gray30
    },
    chatTime: {
        ...lightStyles.chatTime,
        color: colors.gray30
    },
    activeBadge: {
        ...lightStyles.activeBadge
    },
    badgeText: {
        ...lightStyles.badgeText
    },
    activeText: {
        ...lightStyles.activeText
    },
    floatingBtn: {
        ...lightStyles.floatingBtn
    },
    chatFilter: {
        ...lightStyles.chatFilter,
        backgroundColor: colors.darkSecondary
    },
    chatFilterText: {
        ...lightStyles.chatFilterText
    },
    activeChatFilter: {
        ...lightStyles.activeChatFilter,
        backgroundColor: colors.darkPrimary
    },
    activeChatFilterText: {
        ...lightStyles.activeChatFilterText
    }
    
});






export const getStyles = (mode) => {
    if(mode == 'light'){
        return lightStyles;
    }else{
        return darkStyles;
    }
}