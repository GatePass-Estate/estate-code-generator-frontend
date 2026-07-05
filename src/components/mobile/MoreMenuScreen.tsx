import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useState, ReactNode } from 'react';
import { useAuth } from '@/src/hooks/useAuthContext';
import { useUserStore } from '@/src/lib/stores/userStore';
import { deleteAccount } from '@/src/lib/api/user';
import { sharedStyles } from '@/src/theme/styles';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import {
  AccountSecurityIcon,
  DeleteAccountIcon,
  IncidentReportIcon,
  LinkedDevicesIcon,
  LogOutIcon,
  MyProfileIcon,
  NavigateNextIcon,
  PrivacyPolicyIcon,
  TermsOfServiceIcon,
} from '@/src/assets/svgs';

type MoreMenuScreenProps = {
  title?: string;
  subtitle?: string;
};

function SectionTitle({ children, first = false }: { children: string; first?: boolean }) {
  return (
    <Text
      className='mb-2 text-[10px] font-inter-regular uppercase  text-[#113E55]'
    >
      {children}
    </Text>
  );
}

function MoreMenuRow({
  icon,
  label,
  onPress,
  showNavigateNext = true,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  showNavigateNext?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-[8px] border border-[#CEE5ED]  p-4"
    >
      <View className="flex-row items-center gap-4">
        {icon}
        <Text className="text-[13px] font-inter-regular text-primary">{label}</Text>
      </View>
      {showNavigateNext ? <NavigateNextIcon /> : null}
    </Pressable>
  );
}

export default function MoreMenuScreen({
  title = 'More',
  subtitle = 'Adjust Gatepass to your preference, manage account.',
}: MoreMenuScreenProps) {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const user_id = useUserStore((s) => s.user_id);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () => {
    Alert.alert(
      'Delete account',
      'This will permanently remove your account and sign you out. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user_id) return;
            setDeleting(true);
            try {
              await deleteAccount();
              await signOut();
            } catch (e: any) {
              Alert.alert('Could not delete account', e?.message ?? 'Please try again later.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const iconColor = '#113E55';

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable
        onPress={() => navigation.goBack()}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <ScreenHeader title={title} subtitle={subtitle || undefined} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 36, flexGrow: 0, gap: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
        <SectionTitle first>Account</SectionTitle>
        <View className="flex-col gap-2">
          <MoreMenuRow
            icon={<MyProfileIcon color={iconColor} />}
            label="My Profile"
            onPress={() => router.push('/profile')}
          />
          <MoreMenuRow
            icon={<AccountSecurityIcon color={iconColor} />}
            label="Account Security"
            onPress={() => router.push('/account-security')}
          />
          <MoreMenuRow
            icon={<IncidentReportIcon color={iconColor} />}
            label="Incident Report"
            onPress={() => Alert.alert('Coming soon', 'Incident reporting is not available yet.')}
          />
          <MoreMenuRow
            icon={<LinkedDevicesIcon color={iconColor} />}
            label="Linked Devices"
            onPress={() => Alert.alert('Coming soon', 'Linked devices is not available yet.')}
          />
        </View>
        </View>

        <View>
          
       
        <SectionTitle>About</SectionTitle>
        <View className="flex-col gap-2">
          <MoreMenuRow
            icon={<TermsOfServiceIcon color={iconColor} />}
            label="Terms of Service"
            onPress={() =>
              router.push({
                pathname: '/auth/tos',
                params: { readonly: 'true' },
              })
            }
          />
          <MoreMenuRow
            icon={<PrivacyPolicyIcon color={iconColor} />}
            label="Privacy Policy"
            onPress={() =>
              router.push({
                pathname: '/auth/data-protection-policy',
                params: { source: 'settings' },
              })
            }
          />
        </View>
        </View>

        <View>
          
        
        <SectionTitle>Sign out</SectionTitle>
        <View className="flex-col gap-2">
          <MoreMenuRow
            icon={<LogOutIcon color={iconColor} />}
            label="Log Out"
            onPress={signOut}
            showNavigateNext={false}
          />
          <MoreMenuRow
            icon={<LogOutIcon color={iconColor} />}
            label="Log Out of All Devices"
            onPress={signOut}
            showNavigateNext={false}
          />
          </View>
        </View>

        <Pressable
          onPress={confirmDelete}
          disabled={deleting}
          className="flex-row items-center gap-4 rounded-[8px] border border-[#E30404] bg-white p-4"
        >
          {deleting ? (
            <ActivityIndicator color="#ED0808" />
          ) : (
            <>
              <DeleteAccountIcon />
              <Text className="text-[13px] font-inter-regular text-[#E30404]">Delete Account</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
