import { View, Text } from 'react-native';
import icons from '@/src/constants/icons';
import NavigationContainer from '@/src/components/common/NavigationContainer';
import { sharedStyles } from '@/src/theme/styles';
import { Inter, UbuntuSans } from '@/src/constants/fonts';
import { menuRouteType } from '@/src/types/general';
import {
  GuestsTabIcon,
  HistoryIcon,
  HomeTabIcon,
  PlusTabIcon,
  ReportTabIconSvg,
} from '@/src/assets/svgs';

const ACTIVE_TAB_COLOR = '#113E55';
const INACTIVE_TAB_COLOR = '#6F91A0';

function TabLabel({
  label,
  focused,
  font = 'inter',
  children,
}: {
  label: string;
  focused: boolean;
  font?: 'inter' | 'ubuntu';
  children: React.ReactNode;
}) {
  const fontFamily =
    font === 'ubuntu'
      ? focused
        ? UbuntuSans.semiBold
        : UbuntuSans.regular
      : focused
        ? Inter.semiBold
        : Inter.regular;

  return (
    <View className="w-full items-center" style={{ gap: 4 }}>
      {children}
      <Text
        style={{
          fontFamily,
          fontSize: 9,
          color: focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR,
          textTransform: 'capitalize',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export const FloatingButton: React.FC<{
  focused?: boolean;
  isMobile?: boolean;
}> = ({ focused = false, isMobile = true }) => {
  const plus = (
    <PlusTabIcon width={32} height={32} color={focused ? '#F6F7F7' : ACTIVE_TAB_COLOR} />
  );

  if (!isMobile) {
    return (
      <View
        style={[sharedStyles.fabInner, focused && { backgroundColor: ACTIVE_TAB_COLOR }]}
        className="items-center justify-center"
      >
        {plus}
      </View>
    );
  }

  return (
    <View style={sharedStyles.fab}>
      <View style={sharedStyles.fabOuter}>
        <View style={[sharedStyles.fabInner, focused && { backgroundColor: ACTIVE_TAB_COLOR }]}>
          {plus}
        </View>
      </View>
    </View>
  );
};

export const HomeIcon: React.FC<{ focused?: boolean; isMobile?: boolean }> = ({
  focused = false,
}) => {
  const color = focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR;

  return (
    <TabLabel label="Home" focused={focused}>
      <HomeTabIcon width={20} height={20} color={color} focused={focused} />
    </TabLabel>
  );
};

export const GuestIcon: React.FC<{ focused?: boolean; isMobile?: boolean }> = ({
  focused = false,
}) => {
  const color = focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR;

  return (
    <TabLabel label="Guests" focused={focused}>
      <GuestsTabIcon width={20} height={20} color={color} focused={focused} />
    </TabLabel>
  );
};

export const HistoryTabIcon: React.FC<{ focused?: boolean; isMobile?: boolean }> = ({
  focused = false,
}) => {
  const color = focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR;

  return (
    <TabLabel label="History" focused={focused} font="ubuntu">
      <HistoryIcon width={18} height={18} color={color} />
    </TabLabel>
  );
};

export const ReportTabIcon: React.FC<{ focused?: boolean; isMobile?: boolean }> = ({
  focused = false,
}) => {
  const color = focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR;

  return (
    <TabLabel label="Report" focused={focused} font="ubuntu">
      <ReportTabIconSvg width={20} height={20} color={color} focused={focused} />
    </TabLabel>
  );
};

export const menuRoutes: menuRouteType[] = [
  {
    name: 'index',
    link: '/user',
    title: 'Home',
    TabIcon: HomeIcon,
    for: 'native',
    activeIcon: icons.activeHomeIcon,
    inactiveIcon: icons.inactiveHomeIcon,
  },

  {
    name: 'index',
    link: '/user',
    title: 'Home',
    TabIcon: HomeIcon,
    for: 'web',
    activeIcon: icons.webHomeActiveIcon,
    inactiveIcon: icons.webHomeInActiveIcon,
  },

  {
    name: 'guests/index',
    link: '/user/guests',
    title: 'Guests',
    TabIcon: GuestIcon,
    for: 'native',
  },

  {
    name: 'guests/add/index',
    link: '/user/guests/add',
    title: 'Add Guest',
    TabIcon: FloatingButton,
    for: 'native',
  },

  {
    name: 'guests/add/index',
    link: '/user/guests/add',
    title: 'Generate Code',
    TabIcon: FloatingButton,
    for: 'web',
    activeIcon: icons.activeCodeIcon,
    inactiveIcon: icons.inactiveCodeIcon,
  },

  {
    name: 'history',
    link: '/user/history',
    title: 'History',
    TabIcon: HistoryTabIcon,
    for: 'native',
  },

  {
    name: 'report/index',
    link: '/user/report',
    title: 'Report',
    TabIcon: ReportTabIcon,
    for: 'native',
  },

  {
    name: 'settings/index',
    link: '/settings',
    title: 'Settings',
    TabIcon: GuestIcon,
    for: 'web',
    activeIcon: icons.activeProfileIcon,
    inactiveIcon: icons.inactiveProfileIcon,
  },

  {
    name: 'admin/index',
    link: '/admin',
    title: 'Admin Access',
    TabIcon: GuestIcon,
    for: 'web',
    activeIcon: icons.activeAdminIcon,
    inactiveIcon: icons.inactiveAdminIcon,
    role: 'admin',
  },

  {
    name: 'admin/index',
    link: '/admin',
    title: 'Admin Access',
    TabIcon: GuestIcon,
    for: 'web',
    activeIcon: icons.activeAdminIcon,
    inactiveIcon: icons.inactiveAdminIcon,
    role: 'primary_admin',
  },
];

export default function UserRootLayout() {
  return <NavigationContainer routes={menuRoutes} tabBarStyle={sharedStyles.tabBar} />;
}
