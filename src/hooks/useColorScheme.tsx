import * as NavigationBar from "expo-navigation-bar";
import { useColorScheme as useNativewindColorScheme } from "nativewind";
import * as React from "react";
import { Appearance, AppState, ColorSchemeName, Platform } from "react-native";

import { COLORS } from "@/src/theme/colors";
import { APP_TAB_BAR_COLOR } from "@/src/theme/styles";

function useColorScheme() {
  const { colorScheme, setColorScheme: setNativeWindColorScheme } =
    useNativewindColorScheme();

  async function setColorScheme(nextScheme: "light" | "dark") {
    setNativeWindColorScheme(nextScheme);
    if (Platform.OS !== "android") return;
    try {
      applyBrandSystemBars();
    } catch (error) {
      console.log('useColorScheme.tsx", "setColorScheme', error);
    }
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

function resolveDeviceColorScheme(
  scheme: ColorSchemeName | undefined,
): "light" | "dark" {
  return scheme === "dark" ? "dark" : "light";
}

function applyBrandSystemBars() {
  /** Edge-to-edge: skip setBackgroundColorAsync — use bottom strip View instead. */
  NavigationBar.setButtonStyleAsync("dark").catch(() => {});
  NavigationBar.setStyle("light");
}

export function getAndroidNavBarBackground(): string {
  return APP_TAB_BAR_COLOR;
}

function useInitialAndroidBarSync() {
  const { setColorScheme: setNativeWindColorScheme } =
    useNativewindColorScheme();

  React.useEffect(() => {
    if (Platform.OS !== "android") return;

    const applyDeviceTheme = (scheme: ColorSchemeName) => {
      setNativeWindColorScheme(resolveDeviceColorScheme(scheme));
      applyBrandSystemBars();
    };

    applyDeviceTheme(Appearance.getColorScheme());

    const appearanceSubscription = Appearance.addChangeListener(
      ({ colorScheme }) => {
        applyDeviceTheme(colorScheme);
      },
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
  }, [setNativeWindColorScheme]);
}

export { useColorScheme, useInitialAndroidBarSync };
