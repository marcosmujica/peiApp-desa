import { StyleSheet } from "react-native";
import { tStyles, fonts, colors } from "../common/theme";

const lightStyles = StyleSheet.create({
    container: {
        ...tStyles.flex1, 
        backgroundColor: colors.white 
    },
    topBar: {
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
    chatListing:{ 
        minHeight: '100%',
        paddingBottom: 60, 
        paddingHorizontal: 15, 
        backgroundColor: colors.gray5,
        paddingTop: 15,
    },
    chatBubble: {
        ...tStyles.selfleft,
        padding: 8, 
        backgroundColor: colors.white,
        marginBottom: 10,
        maxWidth:"80%",
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10
    }, 
    chatBubbleMe: {
        backgroundColor: colors.lightPrimary,
        ...tStyles.selfright,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 0,
    },
    chatText: {
        ...fonts.regular
    },
    replyContainer: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderLeftWidth: 3,
        borderColor: colors.primary,
        borderRadius: 5,
        marginBottom: 10,
        backgroundColor: 'rgba(0,0,0,0.04)'
    },
    replyUser: {
        color: colors.primary,
        ...fonts.medium,
        fontSize: 12,
        marginBottom: 2
    },
    replyMessage: {
        ...fonts.regular,
        fontSize: 10,
        color: colors.gray75
    },
    chatTime: {
        ...fonts.regular, 
        fontSize: 10, 
        color: colors.gray75
    },
    chatInputHolder: {
        ...tStyles.row,  
        paddingHorizontal: 15, 
        position: 'absolute', 
        bottom: 0,
        width: "100%",
        paddingVertical: 10,
        backgroundColor: colors.gray5
    },
    chatInput: {
        ...tStyles.flex1, 
        ...tStyles.row,  
        backgroundColor: colors.white,
        marginRight: 10,
        height: 47,
        paddingHorizontal: 12,
        borderRadius: 30
    },
    chatInputText: {
        ...tStyles.flex1, 
        ...fonts.regular, 
        marginHorizontal: 10, 
        fontSize: 15
    },
    sendBtn: {
        width: 47,
        height: 47,
        borderRadius: 25,
        backgroundColor: colors.primary,
        ...tStyles.centerx,
        ...tStyles.centery
    }
});


const darkStyles = StyleSheet.create({
    container: {
        ...lightStyles.container,
        backgroundColor: colors.dark
    },
    topBar: {
        ...lightStyles.topBar
    },
    topBarMainText: {
        ...lightStyles.topBarMainText,
        color: colors.white
    }, 
    topBarSecText: {
        ...lightStyles.topBarSecText,
        color: colors.gray30
    },
    chatListing:{ 
        ...lightStyles.chatListing,
        backgroundColor: colors.dark
    },
    chatBubble: {
        ...lightStyles.chatBubble,
        backgroundColor: colors.darkSecondary
    },
    chatBubbleMe: {
        ...lightStyles.chatBubbleMe,
        backgroundColor: colors.darkPrimary2
    },
    chatText: {
        ...lightStyles.chatText,
        color: colors.gray10
    },
    replyContainer: {
        ...lightStyles.replyContainer,
        backgroundColor: 'rgba(0,0,0, 0.2)'
    },
    replyUser: {
        ...lightStyles.replyUser
    },
    replyMessage: {
        ...lightStyles.replyMessage,
        color: colors.gray30
    },
    chatTime: {
        ...lightStyles.chatTime,
        color: colors.gray40
    },
    chatInputHolder: {
        ...lightStyles.chatInputHolder,
        backgroundColor: colors.dark
    },
    chatInput: {
        ...lightStyles.chatInput,
        backgroundColor: colors.darkSecondary
    },
    chatInputText: {
        ...lightStyles.chatInputText,
        color: colors.gray30
    },
    sendBtn: {
        ...lightStyles.sendBtn
    }
});


export const getStyles = (mode) => {
    if(mode == 'light'){
        return lightStyles;
    }else{
        return darkStyles;
    }
}