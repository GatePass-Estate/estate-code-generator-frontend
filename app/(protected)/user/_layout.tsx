import { View, Text } from 'react-native';
import icons from '@/src/constants/icons';
import NavigationContainer from '@/src/components/common/NavigationContainer';
import { sharedStyles } from '@/src/theme/styles';
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
  children,
}: {
  label: string;
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="items-center mt-6 gap-1 w-full">
      {children}
      <Text
        className="font-inter-regular"
        style={{
          fontSize: 9,
          fontWeight: focused ? '700' : '400',
          color: focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR,
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
}> = ({ focused = false }) => {
  return (
    <View
      style={[
        sharedStyles.fab,
        !focused ? { backgroundColor: '#CEE5ED' } : { backgroundColor: '#113E55' },
      ]}
    >
      <PlusTabIcon color={focused ? '#FFFFFF' : ACTIVE_TAB_COLOR} />
    </View>
  );
};

export const HomeIcon: React.FC<{ focused?: boolean; isMobile?: boolean }> = ({
  focused = false,
}) => {
  const color = focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR;

  return (
    <TabLabel label="Home" focused={focused}>
      <HomeTabIcon width={20} height={20} color={color} />
    </TabLabel>
  );
};

export const GuestIcon: React.FC<{ focused?: boolean; isMobile?: boolean }> = ({
  focused = false,
}) => {
  const color = focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR;

  return (
    <TabLabel label="Guests" focused={focused}>
      <GuestsTabIcon width={20} height={20} color={color} />
    </TabLabel>
  );
};

export const HistoryTabIcon: React.FC<{ focused?: boolean; isMobile?: boolean }> = ({
  focused = false,
}) => {
  const color = focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR;

  return (
    <TabLabel label="History" focused={focused}>
      <HistoryIcon width={20} height={20} color={color} />
    </TabLabel>
  );
};

export const ReportTabIcon: React.FC<{ focused?: boolean; isMobile?: boolean }> = ({
  focused = false,
}) => {
  const color = focused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR;

  return (
    <TabLabel label="Report" focused={focused}>
      <ReportTabIconSvg width={20} height={20} color={color} />
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
    for: 'web',
    activeIcon: icons.activeAdminIcon,
    inactiveIcon: icons.inactiveAdminIcon,
    role: 'admin',
  },

  {
    name: 'admin/index',
    link: '/admin',
    title: 'Admin Access',
    for: 'web',
    activeIcon: icons.activeAdminIcon,
    inactiveIcon: icons.inactiveAdminIcon,
    role: 'primary_admin',
  },
];

export default function UserRootLayout() {
  return <NavigationContainer routes={menuRoutes} tabBarStyle={sharedStyles.tabBar} />;
}
