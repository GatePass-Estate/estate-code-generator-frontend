import { useGoBack } from '@/src/shared/hooks/useGoBack';
import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, type TextInputProps } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast, ToastType } from '@/src/shared/components/feedback/Toast';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/shared/components/Button';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import { sharedStyles } from '@/src/shared/theme/styles';
import { useUserStore } from '@/src/store/userStore';
import { Stack, useNavigation } from 'expo-router';
import { fetchProfilePendingFields } from '@/src/features/profile/utils/profilePendingFields';
import {
  submitProfileEdits,
  type ProfileEditPendingValues,
} from '@/src/features/profile/utils/submitProfileEdits';

function EditField({ label, ...inputProps }: { label: string } & TextInputProps) {
  return (
    <View className="gap-2">
      <Text className="text-2xs font-inter-medium text-[#878686]">{label}</Text>
      <TextInput
        className="rounded-[16px] bg-[#EFF1F1] px-4 py-4 font-inter-light text-primary"
        style={{ fontSize: 14 }}
        placeholderTextColor="#878686"
        {...inputProps}
      />
    </View>
  );
}

export default function EditRequest() {
  const goBack = useGoBack();
  const navigation = useNavigation();
  const user = useUserStore.getState();

  const [formData, setFormData] = useState({
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email || '',
    address: user.home_address || '',
    phoneNumber: user.phone_number || '',
  });

  // The form is pre-filled with these, so "unchanged" is measured against them.
  const [pendingValues, setPendingValues] = useState<ProfileEditPendingValues>({});
  const [loading, setLoading] = useState(false);
  const [loadingPending, setLoadingPending] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    []
  );

  useEffect(() => {
    let isMounted = true;
    const current = useUserStore.getState();

    const loadPendingValues = async () => {
      if (!current.user_id) {
        setLoadingPending(false);
        return;
      }

      try {
        const pendingDetails = await fetchProfilePendingFields(current.user_id);
        if (!isMounted) return;

        const pending = (field: keyof ProfileEditPendingValues) =>
          pendingDetails[field].hasPending ? pendingDetails[field].newValue : null;
        setPendingValues({
          firstName: pending('firstName'),
          lastName: pending('lastName'),
          email: pending('email'),
          address: pending('address'),
        });

        setFormData({
          firstName:
            pendingDetails.firstName.hasPending && pendingDetails.firstName.newValue
              ? pendingDetails.firstName.newValue
              : current.first_name || '',
          lastName:
            pendingDetails.lastName.hasPending && pendingDetails.lastName.newValue
              ? pendingDetails.lastName.newValue
              : current.last_name || '',
          email:
            pendingDetails.email.hasPending && pendingDetails.email.newValue
              ? pendingDetails.email.newValue
              : current.email || '',
          address:
            pendingDetails.address.hasPending && pendingDetails.address.newValue
              ? pendingDetails.address.newValue
              : current.home_address || '',
          phoneNumber: current.phone_number || '',
        });
      } catch {
      } finally {
        if (isMounted) setLoadingPending(false);
      }
    };

    loadPendingValues();

    return () => {
      isMounted = false;
    };
  }, [user.user_id]);

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const result = await submitProfileEdits(user, formData, pendingValues);
      if (result.status === 'unchanged') {
        showToast('No changes detected', 'info');
        return;
      }
      if (result.status !== 'saved') {
        showToast(result.errors[0], 'error');
        return;
      }

      showToast(result.message, 'success');
      leaveTimer.current = setTimeout(() => goBack(), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        onBack={() => navigation.goBack()}
        title="Edit Profile"
        subtitle="Send a request to change your details"
        titleClassName="text-heading"
        subtitleClassName="text-[#878686]"
        containerClassName="mb-[19px]"
      />

      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: BUTTON_MARGIN_BOTTOM }}
        keyboardShouldPersistTaps="handled"
      >
        {loadingPending ? (
          <View className="mt-12 items-center">
            <CircleLoader size={32} />
          </View>
        ) : (
          <>
            <View style={{ gap: 19 }}>
              <EditField
                label="First Name"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                editable={!loading}
              />
              <EditField
                label="Last Name"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                editable={!loading}
              />
              <EditField
                label="Email Address"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                editable={!loading}
              />
              <EditField
                label="Address"
                placeholder="Enter your address"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                editable={!loading}
              />
              <EditField
                label="Phone Number"
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                editable={!loading}
              />
            </View>

            <View className="mt-auto w-full items-center pt-10">
              <Button label="Send Request" loading={loading} onPress={handleSendRequest} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
