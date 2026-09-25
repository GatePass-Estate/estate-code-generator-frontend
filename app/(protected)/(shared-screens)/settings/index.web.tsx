import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, Platform, Pressable, Text, useWindowDimensions } from 'react-native';
import WebSidebar from '@/src/components/web/WebSidebar';
import { menuRoutes } from '../../user/_layout';
import Back from '@/src/components/mobile/Back';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import { useAuth } from '@/src/hooks/useAuthContext';
import icons from '@/src/constants/icons';

function SettingsRowWeb({
  label,
  onPress,
  showChevron = true,
}: {
  label: string;
  onPress: () => void;
  showChevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row justify-between items-center gap-10 h-14 bg-[#F7F9F9] rounded-[8px] px-5 mb-3"
    >
      <Text className="text-base font-inter-medium text-primary">{label}</Text>
      {showChevron ? (
        <Image source={icons.rightIcon} style={{ width: 14, height: 14 }} resizeMode="contain" />
      ) : null}
    </Pressable>
  );
}

function SectionTitleWeb({ children }: { children: string }) {
  return (
    <Text className="text-xs font-inter-medium uppercase tracking-wider text-grey mt-6 mb-2">
      {children}
    </Text>
  );
}

export default function SettingsWeb() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Settings - GatePass';
  }, []);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route as any)} />
      )}
      <div className="web-body">
        <div className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 md:px-5'}`}>
          {!isLargeScreen && <Back type="short-arrow" />}

          <Text
            className={`text-primary font-ubuntu-bold mt-8 ${isLargeScreen ? 'text-4xl' : 'text-2xl'}`}
          >
            Settings
          </Text>

          <SectionTitleWeb>Account</SectionTitleWeb>
          <SettingsRowWeb label="My Profile" onPress={() => router.push('/profile')} />
          <SettingsRowWeb
            label="Account Security"
            onPress={() => router.push('/account-security')}
          />

          <SectionTitleWeb>About</SectionTitleWeb>
          <SettingsRowWeb
            label="Terms of Use"
            onPress={() =>
              router.push({
                pathname: '/auth/tos',
                params: { readonly: 'true' },
              })
            }
          />
          <SettingsRowWeb
            label="Data Privacy"
            onPress={() =>
              router.push({
                pathname: '/auth/data-protection-policy',
                params: { source: 'settings' },
              })
            }
          />

          <SectionTitleWeb>Sign out</SectionTitleWeb>
          <Pressable
            onPress={signOut}
            className="border border-grey rounded-xl px-4 py-4 bg-white mb-3 cursor-pointer"
          >
            <Text className="text-base font-inter-medium text-primary text-center">Log Out</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/delete-account')}
            className="mt-8 items-center py-2 cursor-pointer"
          >
            <Text className="text-base font-inter-medium text-tertiary">Delete Account</Text>
          </Pressable>
        </div>
      </div>
    </div>
  );
}
