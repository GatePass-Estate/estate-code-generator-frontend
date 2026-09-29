import Back from '@/src/components/mobile/Back';
import { Toast, ToastType } from '@/src/components/mobile/Toast';
import { getRequestById, approveRequests, declineRequests } from '@/src/lib/api/requests';
import { getUserByIdAdmin } from '@/src/lib/api/user';
import {
  getPendingDocumentViewUri,
  getUserDocuments,
  getUserDocumentViewUri,
} from '@/src/lib/api/userDocuments';
import { sharedStyles } from '@/src/theme/styles';
import { RequestItem } from '@/src/types/requests';
import { User } from '@/src/types/user';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const ComparisonRow = ({ label, value }: { label: string; value: string }) => (
  <View
    style={{
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      flexDirection: 'row',
      height: 41,
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      width: '100%',
    }}
  >
    <Text
      style={{
        color: '#878686',
        fontFamily: 'Inter_18pt-Medium',
        fontSize: 14,
        lineHeight: 17,
      }}
    >
      {label}
    </Text>
    <Text
      numberOfLines={1}
      style={{
        color: '#878686',
        flex: 1,
        fontFamily: 'Inter_18pt-Light',
        fontSize: 14,
        lineHeight: 17,
        marginLeft: 16,
        textAlign: 'right',
      }}
    >
      {value}
    </Text>
  </View>
);

export default function EditSingleRequestMobile() {
  const insets = useSafeAreaInsets();
  const { requestId } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<'approve' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<RequestItem | null>(null);
  const [requestingUser, setRequestingUser] = useState<User | null>(null);
  const [currentIdUri, setCurrentIdUri] = useState<string | null>(null);
  const [newIdUri, setNewIdUri] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  useEffect(() => {
    const loadRequest = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRequestById(requestId as string);

        if (!data) {
          setError('Edit request not found');
        } else {
          setRequestData(data);
          if (data.request_type === 'id_change') {
            try {
              setCurrentIdUri(await getUserDocumentViewUri(data.resident_id, 'id_card'));
            } catch {
              setCurrentIdUri(null);
            }
            try {
              const pendingDocuments = await getUserDocuments(data.resident_id, 'id_card', [
                'pending',
              ]);
              const pendingId = pendingDocuments.documents.find(
                (document) => document.document_type === 'id_card' && document.document_id
              );
              setNewIdUri(
                pendingId?.document_id
                  ? await getPendingDocumentViewUri(pendingId.document_id, pendingId.content_type)
                  : null
              );
            } catch {
              setNewIdUri(null);
            }
          }
          try {
            const user = await getUserByIdAdmin(data.resident_id);
            setRequestingUser(user);
          } catch {
            setRequestingUser(null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load edit request');
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [requestId]);

  const handleApprove = async () => {
    if (!requestData?.new_value) {
      setToastMessage('Cannot approve request: new value is missing');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    setProcessing(true);
    setProcessingAction('approve');

    try {
      const response = await approveRequests(requestId as string);

      if (response && response.id) {
        setToastMessage('Edit request approved successfully!');
        setToastType('success');
        setToastVisible(true);

        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        setToastMessage('Failed to approve request. Please try again.');
        setToastType('error');
        setToastVisible(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while approving request';
      setToastMessage(errorMessage);
      setToastType('error');
      setToastVisible(true);
    } finally {
      setProcessing(false);
      setProcessingAction(null);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    setProcessingAction('decline');

    try {
      const response = await declineRequests(requestId as string);

      if (response && response.id) {
        setToastMessage('Edit request declined successfully!');
        setToastType('success');
        setToastVisible(true);

        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        setToastMessage('Failed to decline request. Please try again.');
        setToastType('error');
        setToastVisible(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while declining request';
      setToastMessage(errorMessage);
      setToastType('error');
      setToastVisible(true);
    } finally {
      setProcessing(false);
      setProcessingAction(null);
    }
  };

  return (
    <SafeAreaView
      style={[
        sharedStyles.container,
        {
          backgroundColor: '#F6F7F7',
          flex: 1,
          paddingBottom: 50,
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
          height: 26,
          lineHeight: 26,
          marginLeft: 6,
          marginTop: 44,
          width: 133,
        }}
      >
        Edit Request
      </Text>

      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#113E55" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-4">
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 items-center">
            <Text className="text-red-800 font-ubuntu-semibold text-center mb-3">
              Error Loading Request
            </Text>
            <Text className="text-red-600 text-center mb-4">{error}</Text>
            <TouchableOpacity
              className="bg-red-600 px-6 py-2 rounded-lg"
              onPress={() => {
                const loadRequest = async () => {
                  try {
                    setLoading(true);
                    setError(null);
                    const data = await getRequestById(requestId as string);
                    if (data) {
                      setRequestData(data);
                      if (data.request_type === 'id_change') {
                        try {
                          setCurrentIdUri(
                            await getUserDocumentViewUri(data.resident_id, 'id_card')
                          );
                        } catch {
                          setCurrentIdUri(null);
                        }
                        try {
                          const pendingDocuments = await getUserDocuments(
                            data.resident_id,
                            'id_card',
                            ['pending']
                          );
                          const pendingId = pendingDocuments.documents.find(
                            (document) =>
                              document.document_type === 'id_card' && document.document_id
                          );
                          setNewIdUri(
                            pendingId?.document_id
                              ? await getPendingDocumentViewUri(
                                  pendingId.document_id,
                                  pendingId.content_type
                                )
                              : null
                          );
                        } catch {
                          setNewIdUri(null);
                        }
                      }
                      try {
                        const user = await getUserByIdAdmin(data.resident_id);
                        setRequestingUser(user);
                      } catch {
                        setRequestingUser(null);
                      }
                    } else {
                      setError('Edit request not found');
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to load edit request');
                  } finally {
                    setLoading(false);
                  }
                };
                loadRequest();
              }}
            >
              <Text className="text-white font-ubuntu-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : requestData ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: requestData.request_type === 'id_change' ? 23 : 24,
          }}
        >
          {requestData.request_type === 'id_change' ? (
            <>
              <Text
                style={{
                  color: '#878686',
                  fontFamily: 'Inter_18pt-Light',
                  fontSize: 14,
                  height: 17,
                  lineHeight: 17,
                  marginLeft: 6,
                  width: 267,
                }}
              >
                Current User ID
              </Text>
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 24,
                  height: 179,
                  justifyContent: 'center',
                  marginHorizontal: -1,
                  marginTop: 15,
                  overflow: 'hidden',
                }}
              >
                {currentIdUri ? (
                  <Image
                    source={{ uri: currentIdUri }}
                    resizeMode="cover"
                    style={{ height: '100%', width: '100%' }}
                  />
                ) : (
                  <Feather name="file-text" size={40} color="#113E55" />
                )}
              </View>
              <Text
                style={{
                  color: '#878686',
                  fontFamily: 'Inter_18pt-Light',
                  fontSize: 14,
                  height: 17,
                  lineHeight: 17,
                  marginLeft: 6,
                  marginTop: 25,
                  width: 267,
                }}
              >
                New User ID
              </Text>
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 24,
                  height: 179,
                  justifyContent: 'center',
                  marginHorizontal: -1,
                  marginTop: 10,
                  overflow: 'hidden',
                }}
              >
                {newIdUri ? (
                  <Image
                    source={{ uri: newIdUri }}
                    resizeMode="cover"
                    style={{ height: '100%', width: '100%' }}
                  />
                ) : (
                  <Feather name="file-text" size={40} color="#113E55" />
                )}
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  marginHorizontal: -1,
                  marginTop: 49,
                }}
              >
                <TouchableOpacity
                  disabled={processing}
                  onPress={handleDecline}
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#E5F6FF',
                    borderRadius: 24,
                    flex: 168,
                    height: 48,
                    justifyContent: 'center',
                    opacity: processing ? 0.7 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  {processingAction === 'decline' ? (
                    <ActivityIndicator color="#113E55" size="small" />
                  ) : (
                    <Text
                      style={{
                        color: '#113E55',
                        fontFamily: 'UbuntuSans-SemiBold',
                        fontSize: 14,
                        letterSpacing: -0.24,
                        lineHeight: 17,
                      }}
                    >
                      Decline
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={processing}
                  onPress={handleApprove}
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#113E55',
                    borderColor: '#113E55',
                    borderRadius: 24,
                    borderWidth: 1,
                    flex: 159,
                    height: 48,
                    justifyContent: 'center',
                    opacity: processing ? 0.7 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  {processingAction === 'approve' ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text
                      style={{
                        color: '#F6F7F7',
                        fontFamily: 'UbuntuSans-SemiBold',
                        fontSize: 14,
                        letterSpacing: -0.24,
                        lineHeight: 17,
                      }}
                    >
                      Approve
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={{ gap: 8 }}>
                <ComparisonRow label="Old" value={requestData.old_value || 'Not provided'} />
                <ComparisonRow label="New" value={requestData.new_value || 'Not provided'} />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  marginHorizontal: -1,
                  marginTop: 40,
                }}
              >
                <TouchableOpacity
                  disabled={processing}
                  onPress={handleDecline}
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#E5F6FF',
                    borderRadius: 24,
                    flex: 168,
                    height: 48,
                    justifyContent: 'center',
                    opacity: processing ? 0.7 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  {processingAction === 'decline' ? (
                    <ActivityIndicator color="#113E55" size="small" />
                  ) : (
                    <Text
                      style={{
                        color: '#113E55',
                        fontFamily: 'UbuntuSans-SemiBold',
                        fontSize: 14,
                        letterSpacing: -0.24,
                        lineHeight: 17,
                      }}
                    >
                      Decline
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={processing}
                  onPress={handleApprove}
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#113E55',
                    borderColor: '#113E55',
                    borderRadius: 24,
                    borderWidth: 1,
                    flex: 159,
                    height: 48,
                    justifyContent: 'center',
                    opacity: processing ? 0.7 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  {processingAction === 'approve' ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text
                      style={{
                        color: '#F6F7F7',
                        fontFamily: 'UbuntuSans-SemiBold',
                        fontSize: 14,
                        letterSpacing: -0.24,
                        lineHeight: 17,
                      }}
                    >
                      Approve
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View
                style={{
                  alignItems: 'center',
                  height: 34,
                  justifyContent: 'center',
                  marginTop: 60,
                  position: 'relative',
                }}
              >
                <View
                  style={{
                    borderTopColor: '#878686',
                    borderTopWidth: 0.5,
                    left: 17,
                    position: 'absolute',
                    right: 17.5,
                    top: 19.5,
                  }}
                />
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: '#F6F7F7',
                    height: 34,
                    justifyContent: 'center',
                    padding: 10,
                    width: 128,
                  }}
                >
                  <Text
                    style={{
                      color: '#878686',
                      fontFamily: 'Inter_18pt-Regular',
                      fontSize: 11.2,
                      height: 14,
                      lineHeight: 14,
                      textAlign: 'center',
                      width: 108,
                    }}
                  >
                    Current User Details
                  </Text>
                </View>
              </View>

              <View style={{ gap: 5, marginTop: 3 }}>
                <ComparisonRow
                  label="Name"
                  value={
                    [requestingUser?.first_name, requestingUser?.last_name]
                      .filter(Boolean)
                      .join(' ') || 'Not provided'
                  }
                />
                <ComparisonRow
                  label="Address"
                  value={requestingUser?.home_address || 'Not provided'}
                />
                <ComparisonRow
                  label="Household"
                  value={requestingUser?.household_name || 'Not provided'}
                />
                <ComparisonRow
                  label="Phone Number"
                  value={requestingUser?.phone_number || 'Not provided'}
                />
                <ComparisonRow
                  label="Email Address"
                  value={requestingUser?.email || 'Not provided'}
                />
              </View>
            </>
          )}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
