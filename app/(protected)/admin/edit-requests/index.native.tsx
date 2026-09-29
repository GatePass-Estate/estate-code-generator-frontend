import Back from '@/src/components/mobile/Back';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import { getRequests } from '@/src/lib/api/requests';
import { sharedStyles } from '@/src/theme/styles';
import { EditRequestView, RequestType } from '@/src/types/requests';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

export const fetchEditRequests = async (): Promise<EditRequestView[]> => {
  const data = await getRequests({ page: 1, limit: 50, status: 'pending' });

  return data.items.map((item) => ({
    id: item.id,
    requestType: item.request_type,
    oldValue: item.old_value,
    newValue: item.new_value,
    createdAt: item.created_at,
  }));
};

const REQUEST_LABELS: Record<RequestType, string> = {
  first_name_change: 'First Name Edit',
  last_name_change: 'Last Name Edit',
  email_change: 'Email Address Edit',
  home_address_change: 'Address Edit',
  gender_change: 'Gender Edit',
  vacate_residence: 'Residence Edit',
  phone_number_change: 'Phone Number Edit',
  id_change: 'ID Edit',
};

const formatRequestValue = (value: string | null, type: RequestType, isNewValue = false) => {
  if (type === 'id_change') return isNewValue ? 'No Preview...' : 'No preview...';
  return value?.trim() || 'Not provided';
};

const formatRequestDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const EditRequestMobile = () => {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<EditRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchEditRequests();
      setRequests(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to refresh edit requests';
      setToastMessage(errorMessage);
      setToastType('error');
      setToastVisible(true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await fetchEditRequests();
        setRequests(data);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load edit requests';
        setToastMessage(errorMessage);
        setToastType('error');
        setToastVisible(true);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          sharedStyles.container,
          {
            backgroundColor: '#F6F7F7',
            flex: 1,
            paddingTop: Math.max(0, 88 - insets.top),
          },
        ]}
      >
        <Stack.Screen
          options={{
            headerShown: false,
            headerShadowVisible: false,
          }}
        />

        <Back type="short-arrow" showText={false} showBorder borderSize={30} leftOffset={-3} />

        <Text
          style={{
            color: '#113E55',
            fontFamily: 'UbuntuSans-SemiBold',
            fontSize: 21.88,
            lineHeight: 26,
            marginBottom: 8,
            marginLeft: 6,
            marginTop: 40,
          }}
        >
          Edit Requests
        </Text>
        <Text
          style={{
            color: '#878686',
            fontFamily: 'Inter_18pt-Light',
            fontSize: 14,
            lineHeight: 17,
            marginLeft: 6,
            maxWidth: 307,
          }}
        >
          You can view all edit request sent by your residents.
        </Text>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#113E55" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        sharedStyles.container,
        {
          backgroundColor: '#F6F7F7',
          paddingBottom: 50,
          flex: 1,
          paddingTop: Math.max(0, 88 - insets.top),
        },
      ]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          headerShadowVisible: false,
        }}
      />

      <Back type="short-arrow" showText={false} showBorder borderSize={30} leftOffset={-3} />

      <Text
        style={{
          color: '#113E55',
          fontFamily: 'UbuntuSans-SemiBold',
          fontSize: 21.88,
          lineHeight: 26,
          marginBottom: 8,
          marginLeft: 6,
          marginTop: 40,
        }}
      >
        Edit Requests
      </Text>
      <Text
        style={{
          color: '#878686',
          fontFamily: 'Inter_18pt-Light',
          fontSize: 14,
          lineHeight: 17,
          marginLeft: 6,
          maxWidth: 307,
        }}
      >
        You can view all edit request sent by your residents.
      </Text>

      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ gap: 8, paddingBottom: 24, paddingHorizontal: 28, paddingTop: 25 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-grey text-center text-md font-ubuntu-medium">
              No edit requests at the moment
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isGenderFrame = item.requestType === 'gender_change';

          return (
            <Pressable
              onPress={() => router.push(`/admin/edit-requests/${item.id}`)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                height: isGenderFrame ? 78.5 : 79,
                width: '100%',
              }}
            >
              <Text
                style={{
                  color: '#878686',
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 8.96,
                  left: 22.5,
                  lineHeight: 11,
                  position: 'absolute',
                  top: 8,
                }}
              >
                {REQUEST_LABELS[item.requestType]}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  color: '#1B998B',
                  fontFamily: 'Inter_18pt-Light',
                  fontSize: 14,
                  left: 22.5,
                  lineHeight: 17,
                  position: 'absolute',
                  right: 50,
                  top: 23,
                }}
              >
                {formatRequestValue(item.oldValue, item.requestType)}
              </Text>
              <View
                style={{
                  alignItems: 'center',
                  height: 24,
                  justifyContent: 'center',
                  position: 'absolute',
                  right: 22.5,
                  top: 12,
                  width: 24,
                }}
              >
                <Feather name="chevron-right" size={16} color="#113E55" />
              </View>
              <View
                style={{
                  borderTopColor: '#E0D9D9',
                  borderTopWidth: 0.5,
                  left: 21.5,
                  position: 'absolute',
                  right: 29,
                  top: 44,
                }}
              />
              <Text
                numberOfLines={1}
                style={{
                  color: '#1B998B',
                  fontFamily: 'Inter_18pt-Light',
                  fontSize: 14,
                  left: isGenderFrame ? 21.5 : 22,
                  lineHeight: 17,
                  position: 'absolute',
                  right: 90,
                  top: isGenderFrame ? 53.5 : 54,
                }}
              >
                {formatRequestValue(item.newValue, item.requestType, true)}
              </Text>
              <Text
                style={{
                  color: '#878686',
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 8.96,
                  lineHeight: 11,
                  position: 'absolute',
                  right: 21.5,
                  textAlign: 'center',
                  top: 56.5,
                }}
              >
                {formatRequestDate(item.createdAt)}
              </Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
};

export default EditRequestMobile;
