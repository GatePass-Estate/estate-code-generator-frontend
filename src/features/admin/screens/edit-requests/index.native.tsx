import Back from '@/src/shared/components/navigation/Back';
import { Toast } from '@/src/shared/components/feedback/Toast';
import { sharedStyles } from '@/src/shared/theme/styles';
import { router, Stack } from 'expo-router';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useEditRequestsMobile } from '@/src/features/admin/hooks/useEditRequestsList';
import {
  formatRequestDate,
  formatRequestValue,
  REQUEST_LABELS,
} from '@/src/features/admin/utils/editRequests';

const EditRequestMobile = () => {
  const { requests, loading, refreshing, handleRefresh, toast, hideToast } =
    useEditRequestsMobile();
  if (loading) {
    return (
      <SafeAreaView
        style={[
          sharedStyles.container,
          {
            backgroundColor: '#F6F7F7',
            flex: 1,
            paddingTop: 19,
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
            marginTop: 12,
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
          <CircleLoader size={36} />
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
          paddingTop: 19,
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
          marginTop: 12,
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

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ gap: 8, paddingBottom: 24, paddingHorizontal: 20, paddingTop: 25 }}
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
