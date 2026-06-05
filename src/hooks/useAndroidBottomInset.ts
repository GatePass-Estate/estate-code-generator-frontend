import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TAB_BAR_BASE_HEIGHT } from "@/src/theme/styles";

/** Typical 3-button nav bar height when safe-area insets are not reported. */
const ANDROID_NAV_BAR_FALLBACK = 48;

export function useAndroidBottomInset() {
  const { bottom } = useSafeAreaInsets();
  const systemBottom =
    Platform.OS === "android"
      ? bottom > 0
        ? bottom
        : ANDROID_NAV_BAR_FALLBACK
      : 0;

  return {
    systemBottom,
    tabBarHeight: TAB_BAR_BASE_HEIGHT,
    tabContentPadding: TAB_BAR_BASE_HEIGHT + systemBottom,
  };
}
