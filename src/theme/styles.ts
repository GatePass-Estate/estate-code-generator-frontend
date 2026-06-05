import { Platform, StyleSheet } from "react-native";

/** Fallback used only when React Navigation’s `HeaderHeightContext` isn’t available
 *  (e.g. component rendered outside a stack header). System defaults: iOS ~88pt incl. notch, Android ~80dp incl. status bar. */
export const APP_NATIVE_HEADER_HEIGHT = Platform.OS === "ios" ? 88 : 56;

export const TAB_BAR_BASE_HEIGHT = 80;

/** Same light teal as the bottom tab bar (`sharedStyles.tabBar`). */
export const APP_TAB_BAR_COLOR = "#CEE5ED";

export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBFEFF",
    paddingHorizontal: 20,
  },

  title: {
    color: "#113E55",
    fontFamily: "UbuntuSans-SemiBold",
    textAlign: "left",
    fontSize: 23,
  },

  header: {
    backgroundColor: "#FBFEFF",
  },

  modalContainer: {
    paddingTop: 20,
  },

  tabBar: {
    position: "absolute",
    backgroundColor: APP_TAB_BAR_COLOR,
    height: TAB_BAR_BASE_HEIGHT,
    flex: 1,
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    borderTopWidth: 0,
  },

  fab: {
    top: -20,
    width: 90,
    height: 90,
    borderRadius: 50,
    borderColor: "#FBFEFF",
    borderWidth: 6,
    justifyContent: "center",
    alignItems: "center",
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },

  label: {
    fontSize: 12,
    color: "#113E55",
    marginTop: 20,
  },

  input: {
    backgroundColor: "#F7F9F9",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 5,
    height: 50,
    paddingLeft: 15,
  },
});
