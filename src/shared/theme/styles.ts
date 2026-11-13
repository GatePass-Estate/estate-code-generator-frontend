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

  /** Space below the safe area before the first title or back button. */
  modalContainer: {
    paddingTop: 19,
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

  // Figma admin register 5056:3714 — empty labels are grey; filled labels go navy.
  registrationLabel: {
    color: '#878686',
    fontFamily: 'Inter_18pt-Medium',
    fontSize: 8.96,
    lineHeight: 8.96,
  },

  registrationLabelFilled: {
    color: '#113E55',
  },

  registrationLabelError: {
    color: '#E30404',
  },

  // Empty: #EFF1F1, no visible border. Filled: #F6F7F7 + #CEE5ED (5056:3715).
  // Same shell for Register text inputs and SelectorField so heights match.
  registrationInput: {
    backgroundColor: '#EFF1F1',
    borderColor: 'transparent',
    borderRadius: 16,
    borderWidth: 0.5,
    color: '#113E55',
    fontFamily: 'Inter_18pt-Light',
    fontSize: 14,
    height: 48,
    includeFontPadding: false,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },

  registrationInputFilled: {
    backgroundColor: '#F6F7F7',
    borderColor: '#CEE5ED',
    color: '#113E55',
  },

  // Error 5056:3716 — #FFE6E6 / #FF0D0D / #C40707.
  registrationInputError: {
    backgroundColor: '#FFE6E6',
    borderColor: '#FF0D0D',
    color: '#C40707',
  },
});
