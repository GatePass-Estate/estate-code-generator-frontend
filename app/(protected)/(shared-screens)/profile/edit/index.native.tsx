import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import Back from '@/src/components/mobile/Back';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/components/mobile/Button';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { sharedStyles } from '@/src/theme/styles';
import { useUserStore } from '@/src/lib/stores/userStore';
import { createRequest, checkPendingRequests, updatePendingRequest } from '@/src/lib/api/requests';
import { updateUserPhone } from '@/src/lib/api/user';
import { RequestType, PendingRequestsResponse } from '@/src/types/requests';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { refreshCurrentUser } from '@/src/hooks/useRefreshUser';
import { fetchProfilePendingFields } from '@/src/lib/profilePendingFields';

function EditField({ label, ...inputProps }: { label: string } & TextInputProps) {
  return (
    <View className="gap-2">
      <Text className="text-[8.96px] font-inter-medium text-[#878686]">{label}</Text>
      <TextInput
        className="rounded-[16px] bg-[#EFF1F1] px-4 py-4 font-inter-light text-[#113E55]"
        style={{ fontSize: 14 }}
        placeholderTextColor="#878686"
        {...inputProps}
      />
    </View>
  );
}

interface ChangedField {
  type: RequestType;
  old: string;
  new: string;
  label: string;
}

export default function EditRequest() {
  const router = useRouter();
  const navigation = useNavigation();
  const user = useUserStore.getState();

  const [formData, setFormData] = useState({
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email || '',
    address: user.home_address || '',
    phoneNumber: user.phone_number || '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingPending, setLoadingPending] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  useEffect(() => {
    let isMounted = true;

    const loadPendingValues = async () => {
      if (!user.user_id) {
        setLoadingPending(false);
        return;
      }

      try {
        const pendingDetails = await fetchProfilePendingFields(user.user_id);
        if (!isMounted) return;

        setFormData({
          firstName:
            pendingDetails.firstName.hasPending && pendingDetails.firstName.newValue
              ? pendingDetails.firstName.newValue
              : user.first_name || '',
          lastName:
            pendingDetails.lastName.hasPending && pendingDetails.lastName.newValue
              ? pendingDetails.lastName.newValue
              : user.last_name || '',
          email:
            pendingDetails.email.hasPending && pendingDetails.email.newValue
              ? pendingDetails.email.newValue
              : user.email || '',
          address:
            pendingDetails.address.hasPending && pendingDetails.address.newValue
              ? pendingDetails.address.newValue
              : user.home_address || '',
          phoneNumber: user.phone_number || '',
        });
      } catch (error) {
        console.log('Failed to load pending profile values', error);
      } finally {
        if (isMounted) setLoadingPending(false);
      }
    };

    loadPendingValues();

    return () => {
      isMounted = false;
    };
  }, [user.user_id]);

  const handleSendRequest = async () => {
    setLoading(true);

    const pendingChecks: Promise<PendingRequestsResponse>[] = [];
    const changedFields: ChangedField[] = [];

    if (formData.firstName !== user.first_name) {
      changedFields.push({
        type: 'first_name_change' as const,
        old: user.first_name || '',
        new: formData.firstName,
        label: 'First Name',
      });
      pendingChecks.push(checkPendingRequests('first_name_change'));
    }

    if (formData.lastName !== user.last_name) {
      changedFields.push({
        type: 'last_name_change' as const,
        old: user.last_name || '',
        new: formData.lastName,
        label: 'Last Name',
      });
      pendingChecks.push(checkPendingRequests('last_name_change'));
    }

    if (formData.email !== user.email) {
      changedFields.push({
        type: 'email_change' as const,
        old: user.email || '',
        new: formData.email,
        label: 'Email Address',
      });
      pendingChecks.push(checkPendingRequests('email_change'));
    }

    if (formData.address !== user.home_address) {
      changedFields.push({
        type: 'home_address_change' as const,
        old: user.home_address || '',
        new: formData.address,
        label: 'Address',
      });
      pendingChecks.push(checkPendingRequests('home_address_change'));
    }

    const phoneChanged = formData.phoneNumber !== (user.phone_number || '');

    if (changedFields.length === 0 && !phoneChanged) {
      setToastMessage('No changes detected');
      setToastType('info');
      setToastVisible(true);
      setLoading(false);
      return;
    }

    try {
      if (phoneChanged) {
        if (!formData.phoneNumber.trim()) {
          setToastMessage('Phone number is required');
          setToastType('error');
          setToastVisible(true);
          setLoading(false);
          return;
        }
        await updateUserPhone(user.user_id, formData.phoneNumber.trim());
      }

      let allRequests: ChangedField[] = [];

      if (changedFields.length > 0) {
        const pendingResults = await Promise.allSettled(pendingChecks);
        const createRequests: ChangedField[] = [];
        const updateRequests: { field: ChangedField; requestId: string }[] = [];
        const errorMessages: string[] = [];

        pendingResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            if (result.value.has_pending_request && result.value.pending_request) {
              updateRequests.push({
                field: changedFields[index],
                requestId: result.value.pending_request.id,
              });
            } else {
              createRequests.push(changedFields[index]);
            }
          } else {
            const error = result.reason;
            const errorMessage = error?.message || '';
            errorMessages.push(`Error checking ${changedFields[index].label}: ${errorMessage}`);
          }
        });

        if (errorMessages.length > 0) {
          setToastMessage(errorMessages[0]);
          setToastType('error');
          setToastVisible(true);
          setLoading(false);
          return;
        }

        allRequests = [...createRequests, ...updateRequests.map((r) => r.field)];

        if (allRequests.length > 0) {
          await Promise.all([
            ...createRequests.map((req) => createRequest(req.type as any, req.old, req.new)),
            ...updateRequests.map((req) => updatePendingRequest(req.requestId, req.field.new)),
          ]);
        }
      }

      await refreshCurrentUser();

      let successMsg = 'Phone number updated successfully.';
      if (allRequests.length > 0 && phoneChanged) {
        successMsg =
          allRequests.length === 1
            ? 'Phone number updated. 1 request submitted for admin approval.'
            : `Phone number updated. ${allRequests.length} requests submitted for admin approval.`;
      } else if (allRequests.length > 0) {
        successMsg =
          allRequests.length === 1
            ? '1 request submitted successfully. Awaiting admin approval.'
            : `${allRequests.length} requests submitted successfully. Awaiting admin approval.`;
      }

      setToastMessage(successMsg);
      setToastType('success');
      setToastVisible(true);

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err: any) {
      const message = err?.message || 'Failed to save changes';
      setToastMessage(message);
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Back type="short-arrow" showText={false} showBorder onPress={() => navigation.goBack()} />

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
            <ActivityIndicator color="#113E55" />
          </View>
        ) : (
          <>
            <ScreenHeader
              title="Edit Profile"
              subtitle="Send a request to change your details"
              titleClassName="text-[27.34px]"
              subtitleClassName="text-[#878686]"
              containerClassName="mb-[19px] mt-6"
            />

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
