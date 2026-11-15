import { useGoBack } from '@/src/shared/hooks/useGoBack';
import { useState } from 'react';
import { View, Text, TextInput, ScrollView, type TextInputProps } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast, ToastType } from '@/src/shared/components/feedback/Toast';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/shared/components/Button';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import { sharedStyles } from '@/src/shared/theme/styles';
import { Stack, useNavigation } from 'expo-router';
import { useProfileEditForm } from '@/src/features/profile/hooks/useProfileEditForm';

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
  const {
    formData,
    setField,
    loadingPending,
    submitting: loading,
    submit,
    leaveAfterSave,
  } = useProfileEditForm({ prefillPending: true });

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleSendRequest = async () => {
    const result = await submit();
    if (result.status === 'unchanged') {
      showToast('No changes detected', 'info');
      return;
    }
    if (result.status !== 'saved') {
      showToast(result.errors[0], 'error');
      return;
    }

    showToast(result.message, 'success');
    leaveAfterSave(() => goBack());
  };

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        onBack={() => navigation.goBack()}
        title="Edit Profile"
        subtitle="Send a request to change your details"
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
                onChangeText={(text) => setField('firstName', text)}
                editable={!loading}
              />
              <EditField
                label="Last Name"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChangeText={(text) => setField('lastName', text)}
                editable={!loading}
              />
              <EditField
                label="Email Address"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => setField('email', text)}
                editable={!loading}
              />
              <EditField
                label="Address"
                placeholder="Enter your address"
                value={formData.address}
                onChangeText={(text) => setField('address', text)}
                editable={!loading}
              />
              <EditField
                label="Phone Number"
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={formData.phoneNumber}
                onChangeText={(text) => setField('phoneNumber', text)}
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
