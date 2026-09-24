import { Platform, StyleSheet } from 'react-native';

/** Fallback used only when React Navigation’s `HeaderHeightContext` isn’t available
 *  (e.g. component rendered outside a stack header). System defaults: iOS ~88pt incl. notch, Android ~80dp incl. status bar. */
export const APP_NATIVE_HEADER_HEIGHT = Platform.OS === 'ios' ? 88 : 56;

/** iOS tab bar content height (safe-area inset is added at runtime). */
export const TAB_BAR_BASE_HEIGHT = 49;

/** Plus button hangs this far above the 49px teal strip so it sits on the screen. */
export const TAB_BAR_FAB_OVERHANG = 40;

/** Same light teal as the bottom tab bar (`sharedStyles.tabBar`). */
export const APP_TAB_BAR_COLOR = '#CEE5ED';

export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFEFF',
    paddingHorizontal: 20,
  },

  title: {
    color: '#113E55',
    fontFamily: 'UbuntuSans-SemiBold',
    textAlign: 'left',
    fontSize: 23,
  },

  header: {
    backgroundColor: '#FBFEFF',
  },

  modalContainer: {
    paddingTop: 20,
  },

  tabBar: {
    position: 'absolute',
    backgroundColor: APP_TAB_BAR_COLOR,
    height: TAB_BAR_BASE_HEIGHT,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    borderTopWidth: 0.5,
    borderTopColor: '#F6F7F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'visible',
  },

  /** Add guest FAB: 89×88 frame → 77 white ring → 64 teal fill. */
  fab: {
    width: 89,
    height: 88,
    alignItems: 'center',
  },

  fabOuter: {
    marginTop: 4,
    width: 77,
    height: 77,
    borderRadius: 38.5,
    backgroundColor: '#F6F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: APP_TAB_BAR_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },

  label: {
    fontSize: 12,
    color: '#113E55',
    marginTop: 20,
  },

  input: {
    backgroundColor: '#F7F9F9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 5,
    paddingLeft: 15,
  },
});
