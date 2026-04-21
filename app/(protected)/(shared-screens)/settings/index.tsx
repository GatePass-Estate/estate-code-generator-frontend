import { Platform } from "react-native";
import SettingsMobile from "./index.native";
import SettingsWeb from "./index.web";

export default function Settings() {
  const Component = Platform.select({
    web: () => <SettingsWeb />,
    default: () => <SettingsMobile />,
  });

  return <Component />;
}
