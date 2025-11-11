import { StyleSheet } from "react-native";
import { useWindowDimensions } from "react-native";
import { PixelRatio } from "react-native";

const getSystemFontSize = () => {
  // Default font size is 16, scale by system font settings
  const fontScale = PixelRatio.getFontScale();
  return Math.round(16 * fontScale);
};
import { colors, tStyles, fonts } from "../common/theme";

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  sectionTitle: {
    ...fonts.regular,
    fontSize: 16,
    marginTop: 1,
    color: colors.gray75
  },
  topBarHolder: {
    ...tStyles.spacedRow,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  dropDownCombo: {
    backgroundColor: colors.gray50,
  },
  topBarMainText: {
    ...fonts.fontSize,
    fontSize: 18,
    color: colors.primary,
  },
  topBarSecText: {
    ...fonts.regular,
    fontSize: 15,
    marginTop: 1,
    color: colors.dark,
  },
  textInput: {
    ...fonts.regular,
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
    color: colors.gray50,
  },

  bgStrip: {
        borderBottomWidth:5,
        borderBottomColor: colors.gray10,
        borderTopColor: colors.gray10,
        borderTopWidth: 10,
        width: '100%',
        marginTop: 10,
        paddingHorizontal: 15,
        paddingVertical: 18,
        backgroundColor: colors.white,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
  searchBar: {
    backgroundColor: colors.gray5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 0,
    borderRadius: 15,
    marginVertical: 10,
  },
  searchBarInput: {
    ...fonts.regular,
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
    color: colors.gray50,
  },
  simpleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
    color: colors.darkSecondary,
    borderWidth: 1,
    borderColor: colors.gray75,
    borderRadius: 25,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 5,
    color: colors.white,
    backgroundColor: colors.gray50,
    borderRadius: 25,
  },
  iconBtn: {
    backgroundColor: colors.gray10,
    color: colors.dark,
    padding: 8,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  dateBtnMove: {
    justifyContent: "center",
    margin: 0,
    padding: 10,
    alignItems: "center",
    backgroundColor: colors.dark,
    width: 35,
    height: 35,
    borderRadius: 75,
    marginHorizontal: 3,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    color: colors.gray90,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    elevation: 10,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 0,
    borderBottomColor: "#ccc",
  },
  chatContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
  },
  avatarHolder: {
    position: "absolute",
    right: -5,
    bottom: 5,
    backgroundColor: colors.white,
    borderRadius: 100,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  chatMessageHolder: {
    ...tStyles.spacedRow,
    ...tStyles.flex1,
    marginLeft: 13,
  },
  screenTitle: {
    ...fonts.medium,
    fontSize: 18,
    marginBottom: 2,
  },
  screenSubTitle: {
    ...fonts.regular,
    fontSize: 14,
    margin: 3,
  },
  chatUsername: {
    ...fonts.medium,
    fontSize: 16,
    marginBottom: 2
  },
  chatUsernameSmall: {
    ...fonts.regular,
    fontSize: 12,
    margin: 2,
  },
  listMainText: {
  ...fonts.regular,
    fontSize: 15,
    marginTop: 1,
    color: colors.gray75
  },
  
  listSecondText: {
  ...fonts.regular,
    fontSize: 11,
    color: colors.gray75,
  },

  chatMessage: {
    ...fonts.regular,
    fontSize: 13,
    color: colors.gray75,
    marginLeft: 2,
  },
  chatTime: {
    ...fonts.regular,
    fontSize: 12,
    color: colors.gray75,
  },
 
  titleBadge: {
    backgroundColor: colors.gray7,
    paddingHorizontal: 15,
    borderRadius:20,
    paddingVertical: 4,
    alignSelf: 'center',
    color:colors.gray40,
    fontSize:12
  },
  activeBadge: {
    minWidth: 15,
    minHeight: 15,
    paddingHorizontal: 4,
    borderRadius: 10,
    ...tStyles.centerx,
    ...tStyles.centery,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  badgeText: {
    ...fonts.medium,
    color: colors.white,
    fontSize: 10
  },
  normalText: {
    ...fonts.medium,
    fontSize: 16,
    color: colors.gray75,
  },
  subNormalText: {
    ...fonts.regular,
    fontSize: 11,
    color: colors.gray75,
  },
  smallText: {
    ...fonts.regular,
    fontSize: 9,
    color: colors.gray75,
  },
  switchText: {
    color: colors.darkPrimary,
    fontSize: 15,
  },

  activeText: {
    color: colors.primary,
    ...fonts.semibold,
  },
  noSearchResultText: {
    ...fonts.medium,
    fontSize: 16,
    marginBottom: 2,
  },
  floatingBtn: {
    position: "absolute",
    bottom: 15,
    right: 15,
    width: 52,
    height: 52,
    zIndex: 10000,
    backgroundColor: colors.primary,
    ...tStyles.centerx,
    ...tStyles.centery,
    borderRadius: 15,
  },
  chatFilter: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.gray5,
    alignSelf: "flex-start",
    borderRadius: 15,
    marginRight: 5,
  },
  chatFilterText: {
    ...fonts.semibold,
    fontSize: 13,
    color: colors.gray50,
  },
  activeChatFilter: {
    backgroundColor: colors.lightPrimary,
  },
  activeChatFilterText: {
    color: colors.primary,
  },
  agreeBtn: {
    width: "100%",
    backgroundColor: colors.primary,
    ...tStyles.centery,
    paddingVertical: 12,
    borderRadius: 30,
  },
  cancelBtn: {
    width: "100%",
    backgroundColor: colors.primary,
    ...tStyles.centery,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: colors.cancel,
  },
  infoBtn: {
    width: "100%",
    backgroundColor: colors.darkPrimary2,
    ...tStyles.centery,
    color: colors.dark,
    paddingVertical: 12,
    borderRadius: 30,
  },
  info: {
        backgroundColor: colors.white,
        paddingBottom: 20,
        paddingTop: 140,
        overflow: 'visible'
    },
  bigText: {
    ...fonts.regular,
    color: colors.dark,
    fontSize: 24,
    marginTop: 1,
  },
});

const darkStyles = StyleSheet.create({
  container: {
    ...lightStyles.container,
    backgroundColor: colors.dark,
  },
  topBarHolder: {
    ...lightStyles.topBarHolder,
  },
  topBarMainText: {
    ...lightStyles.topBarMainText,
    color: colors.gray5,
  },
  sectionTitle: {
    ...lightStyles.sectionTitle,
    color: colors.gray25
    },
  topBarSecText: {
    ...lightStyles.topBarSecText,
    color: colors.gray5,
  },
  avatarHolder: {
    ...lightStyles.avatarHolder,
  },
  textInput: {
    ...lightStyles.textInput,
    backgroundColor: colors.darkSecondary,
  },
  searchBar: {
    ...lightStyles.searchBar,
    backgroundColor: colors.darkSecondary,
  },
  searchBarInput: {
    ...lightStyles.searchBarInput,
  },
  chatContainer: {
    ...lightStyles.chatContainer,
  },
  chatAvatar: {
    ...lightStyles.chatAvatar,
  },
  chatMessageHolder: {
    ...lightStyles.chatMessageHolder,
  },
  screenTitle: {
    ...lightStyles.screenTitle,
    color: colors.white,
  },
  screenSubTitle: {
    ...lightStyles.screenSubTitle,
    color: colors.white,
  },
  chatUsername: {
    ...lightStyles.chatUsername,
    color: colors.white,
  },
  chatUsernameSmall: {
    ...lightStyles.chatUsernameSmall,
    color: colors.white,
  },
  chatMessage: {
    ...lightStyles.chatMessage,
    color: colors.gray30,
  },

  loading: {
    ...lightStyles.loading,
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.dark,
    color: colors.white,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    elevation: 10,
  },
  normalText: {
    ...lightStyles.normalText,
    color: colors.white,
  },
  subNormalText: {
    ...lightStyles.subNormalText,
    color: colors.gray30,
  },
  listSecondText: {
    ...lightStyles.listSecondText,
    color: colors.gray50,
  },
  listMainText: {
    ...lightStyles.listMainText,
    color: colors.gray30,
  },
  smallText: {
    ...lightStyles.smallText,
    color: colors.gray30,
  },
  chatTime: {
    ...lightStyles.chatTime,
    color: colors.gray30,
  },
  activeBadge: {
    ...lightStyles.activeBadge,
  },
  badgeText: {
    ...lightStyles.badgeText,
  },
  switchText: {
    ...lightStyles.switchText,
    color: colors.white,
  },
  activeText: {
    ...lightStyles.activeText,
  },
  floatingBtn: {
    ...lightStyles.floatingBtn,
  },
  chatFilter: {
    ...lightStyles.chatFilter,
    backgroundColor: colors.darkSecondary,
  },
  chatFilterText: {
    ...lightStyles.chatFilterText,
  },
  activeChatFilter: {
    ...lightStyles.activeChatFilter,
    backgroundColor: colors.darkPrimary,
  },
  activeChatFilterText: {
    ...lightStyles.activeChatFilterText,
  },

  dateBtn: {
    ...lightStyles.dateBtn,
    backgroundColor: colors.darkSecondary,
  },
  dateBtnMove: {
    ...lightStyles.dateBtnMove,
  },
  row: {
    ...lightStyles.row,
  },
  cancelBtn: {
    ...lightStyles.cancelBtn,
  },
  agreeBtn: {
    ...lightStyles.agreeBtn,
  },
  infoBtn: {
    ...lightStyles.infoBtn,
    color: colors.white,
  },
  bigText: {
    ...lightStyles.bigText,
    color: colors.white,
  },
  simpleBtn: {
    ...lightStyles.simpleBtn,
    color: colors.white,
  },
  iconBtn: {
    ...lightStyles.iconBtn,
    backgroundColor: colors.gray75,
    color: colors.white,
  },
  bgStrip: {
    ...lightStyles.bgStrip,
    backgroundColor: colors.dark,
    borderBottomColor: colors.gray75,
    borderTopColor: colors.gray75,
  },
  info: {
          ...lightStyles.info,
          backgroundColor: colors.dark
  },
  titleBadge: {
    ...lightStyles.titleBadge,
    backgroundColor: colors.gray75,
    color:colors.gray7,
  },

});


export const getStyles = (mode) => {
  let aux = mode;
  if (aux == "light") {
    return lightStyles;
  } else {
    return darkStyles;
  }
};
