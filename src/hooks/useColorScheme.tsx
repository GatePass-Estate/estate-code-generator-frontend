import * as NavigationBar from "expo-navigation-bar";
import { usePathname } from "expo-router";
import { useColorScheme as useNativewindColorScheme } from "nativewind";
import * as React from "react";
import { Appearance, AppState, ColorSchemeName, Platform } from "react-native";

import { COLORS } from "@/src/theme/colors";

/** Android 3-button nav bar: our rule — not the system default. */
const ANDROID_NAV_BAR = {
  light: {
    background: "#FFFFFF",
    buttons: "dark" as const,
    style: "light" as const,
  },
  dark: {
    background: "#000000",
    buttons: "light" as const,
    style: "dark" as const,
  },
} as const;

function resolveDeviceColorScheme(
  scheme: ColorSchemeName | undefined,
): "light" | "dark" {
  return scheme === "dark" ? "dark" : "light";
}

function applyAndroidNavBar(colorScheme: "light" | "dark") {
  const theme = ANDROID_NAV_BAR[colorScheme];
  NavigationBar.setButtonStyleAsync(theme.buttons).catch(() => {});
  NavigationBar.setStyle(theme.style);
}

export { applyAndroidNavBar };

export function getAndroidNavBarBackground(
  scheme: ColorSchemeName | undefined,
): string {
  return ANDROID_NAV_BAR[resolveDeviceColorScheme(scheme)].background;
}

function useColorScheme() {
  const { colorScheme, setColorScheme: setNativeWindColorScheme } =
    useNativewindColorScheme();

  async function setColorScheme(nextScheme: "light" | "dark") {
    setNativeWindColorScheme(nextScheme);
    if (Platform.OS !== "android") return;
    applyAndroidNavBar(nextScheme);
  }

  function toggleColorScheme() {
    return setColorScheme(colorScheme === "light" ? "dark" : "light");
  }

  return {
    colorScheme: colorScheme ?? "light",
    isDarkColorScheme: colorScheme === "dark",
    setColorScheme,
    toggleColorScheme,
    colors: COLORS[colorScheme ?? "light"],
  };
}

function useInitialAndroidBarSync() {
  const pathname = usePathname();
  const { setColorScheme: setNativeWindColorScheme } =
    useNativewindColorScheme();

  const applyDeviceTheme = React.useCallback(
    (scheme: ColorSchemeName) => {
      const resolved = resolveDeviceColorScheme(scheme);
      setNativeWindColorScheme(resolved);
      applyAndroidNavBar(resolved);
    },
    [setNativeWindColorScheme],
  );

  React.useEffect(() => {
    if (Platform.OS !== "android") return;
    applyDeviceTheme(Appearance.getColorScheme());
  }, [pathname, applyDeviceTheme]);

  React.useEffect(() => {
    if (Platform.OS !== "android") return;

    applyDeviceTheme(Appearance.getColorScheme());

    const appearanceSubscription = Appearance.addChangeListener(
      ({ colorScheme }) => applyDeviceTheme(colorScheme),
    );

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "active") {
          applyDeviceTheme(Appearance.getColorScheme());
        }
      },
    );

    return () => {
      appearanceSubscription.remove();
      appStateSubscription.remove();
    };
  }, [applyDeviceTheme]);
}

export { useColorScheme, useInitialAndroidBarSync };
