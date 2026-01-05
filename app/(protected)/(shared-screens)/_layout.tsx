import { sharedStyles } from "@/src/theme/styles";
import { menuRoutes } from "../user/_layout";
import NavigationContainer from "@/src/components/common/NavigationContainer";

export default function SharedScreenLayout() {
  return (
    <NavigationContainer
      routes={menuRoutes}
      tabBarStyle={sharedStyles.tabBar}
      enableForMobile={false}
    />
  );
}
