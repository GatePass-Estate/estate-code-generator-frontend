import * as NavigationBar from "expo-navigation-bar";
import { useColorScheme as useNativewindColorScheme } from "nativewind";
import * as React from "react";
import { Appearance, AppState, ColorSchemeName, Platform } from "react-native";

import { COLORS } from "@/src/theme/colors";

function useColorScheme() {
  const { colorScheme, setColorScheme: setNativeWindColorScheme } =
    useNativewindColorScheme();

  async function setColorScheme(nextScheme: "light" | "dark") {
    setNativeWindColorScheme(nextScheme);
    if (Platform.OS !== "android") return;
    try {
      await applySystemNavigationBar();
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

/** Let Android pick nav bar background + icon color from the system theme. */
function applySystemNavigationBar() {
  NavigationBar.setStyle("auto");
}

/** Follow the phone's light/dark setting. */
function useInitialAndroidBarSync() {
  const { setColorScheme: setNativeWindColorScheme } =
    useNativewindColorScheme();

  React.useEffect(() => {
    if (Platform.OS !== "android") return;

    const applyDeviceTheme = (scheme: ColorSchemeName) => {
      setNativeWindColorScheme(resolveDeviceColorScheme(scheme));
      applySystemNavigationBar();
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
