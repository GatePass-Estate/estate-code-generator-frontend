import { useGoBack } from '@/src/shared/hooks/useGoBack';
import Back from '@/src/shared/components/navigation/Back';
import { Toast, ToastType } from '@/src/shared/components/feedback/Toast';
import {
  getRequestById,
  approveRequests,
  declineRequests,
} from '@/src/features/admin/services/requests';
import { getUserById } from '@/src/features/users/services/user';
import {
  getPendingDocumentViewUri,
  getUserDocuments,
  getUserDocumentViewUri,
} from '@/src/features/profile/services/userDocuments';
import { sharedStyles } from '@/src/shared/theme/styles';
import { RequestItem } from '@/src/features/admin/types/requests';
import { User } from '@/src/features/users/types/user';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import IdDocumentPreview from '@/src/features/profile/components/IdDocumentPreview';

type IdPreview = { uri: string; contentType: string } | null;

async function loadIdPreviews(userId: string): Promise<{
  current: IdPreview;
  pending: IdPreview;
}> {
  const { documents } = await getUserDocuments(userId, 'id_card', ['active', 'pending']);
  const active = documents.find(
    (document) => document.document_type === 'id_card' && document.document_status === 'active'
  );
  const pending = documents.find(
    (document) =>
      document.document_type === 'id_card' &&
      document.document_status === 'pending' &&
      document.document_id
  );
  const [current, next] = await Promise.all([
    active
      ? getUserDocumentViewUri(userId, 'id_card', active.content_type)
          .then((uri) => ({ uri, contentType: active.content_type }))
          .catch(() => null)
      : Promise.resolve(null),
    pending?.document_id
      ? getPendingDocumentViewUri(pending.document_id, pending.content_type)
          .then((uri) => ({ uri, contentType: pending.content_type }))
          .catch(() => null)
      : Promise.resolve(null),
  ]);
  return { current, pending: next };
}

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
  const goBack = useGoBack();
  const { requestId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<'approve' | 'decline' | null>(null);
  // Set once the request is approved/declined: the buttons stay disabled until we navigate back,
  // and the delayed back is cancelled if the admin leaves first (no double pop).
  const [done, setDone] = useState(false);
  const backTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (backTimerRef.current) clearTimeout(backTimerRef.current);
    },
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<RequestItem | null>(null);
  const [requestingUser, setRequestingUser] = useState<User | null>(null);
  const [currentId, setCurrentId] = useState<IdPreview>(null);
  const [newId, setNewId] = useState<IdPreview>(null);
  const [previewId, setPreviewId] = useState<'current' | 'new' | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const selectedId = previewId === 'current' ? currentId : previewId === 'new' ? newId : null;

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
              const previews = await loadIdPreviews(data.resident_id);
              setCurrentId(previews.current);
              setNewId(previews.pending);
            } catch {
              setCurrentId(null);
              setNewId(null);
            }
          }
          try {
            const user = await getUserById(data.resident_id);
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
        setDone(true);

        backTimerRef.current = setTimeout(() => {
          goBack();
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
        setDone(true);

        backTimerRef.current = setTimeout(() => {
          goBack();
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
          <CircleLoader size={48} />
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
                          const previews = await loadIdPreviews(data.resident_id);
                          setCurrentId(previews.current);
                          setNewId(previews.pending);
                        } catch {
                          setCurrentId(null);
                          setNewId(null);
                        }
                      }
                      try {
                        const user = await getUserById(data.resident_id);
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
                  color: '#113E55',
                  fontFamily: 'UbuntuSans-Medium',
                  fontSize: 16,
                  lineHeight: 20,
                  marginLeft: 6,
                  marginBottom: 16,
                }}
              >
                {[requestingUser?.first_name, requestingUser?.last_name]
                  .filter(Boolean)
                  .join(' ') || 'Unknown resident'}
              </Text>
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Preview current user ID"
                accessibilityState={{ disabled: !currentId }}
                disabled={!currentId}
                onPress={() => setPreviewId('current')}
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
                {currentId?.contentType === 'application/pdf' ? (
                  <Feather name="file-text" size={40} color="#878686" />
                ) : currentId ? (
                  <Image
                    source={{ uri: currentId.uri }}
                    resizeMode="cover"
                    style={{ height: '100%', width: '100%' }}
                    onError={() => setCurrentId(null)}
                  />
                ) : (
                  <Feather name="credit-card" size={40} color="#C8CECE" />
                )}
                {currentId ? (
                  <View className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-white">
                    <Feather name="eye" size={18} color="#113E55" />
                  </View>
                ) : null}
              </Pressable>
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Preview new user ID"
                accessibilityState={{ disabled: !newId }}
                disabled={!newId}
                onPress={() => setPreviewId('new')}
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
                {newId?.contentType === 'application/pdf' ? (
                  <Feather name="file-text" size={40} color="#878686" />
                ) : newId ? (
                  <Image
                    source={{ uri: newId.uri }}
                    resizeMode="cover"
                    style={{ height: '100%', width: '100%' }}
                    onError={() => setNewId(null)}
                  />
                ) : (
                  <Feather name="credit-card" size={40} color="#C8CECE" />
                )}
                {newId ? (
                  <View className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-white">
                    <Feather name="eye" size={18} color="#113E55" />
                  </View>
                ) : null}
              </Pressable>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  marginHorizontal: -1,
                  marginTop: 49,
                }}
              >
                <TouchableOpacity
                  disabled={processing || done}
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
                    <CircleLoader size={32} />
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
                  disabled={processing || done}
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
                    <CircleLoader size={22} tone="light" />
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
                  disabled={processing || done}
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
                    <CircleLoader size={32} />
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
                  disabled={processing || done}
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
                    <CircleLoader size={22} tone="light" />
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

      <Modal
        visible={Boolean(selectedId)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPreviewId(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <Pressable
            onPress={() => setPreviewId(null)}
            accessibilityRole="button"
            accessibilityLabel="Close identification preview"
            style={StyleSheet.absoluteFill}
          />
          <View className="h-[70%] w-full max-w-[360px] overflow-hidden rounded-[24px] bg-white p-4">
            {selectedId ? (
              <View className="flex-1 overflow-hidden rounded-[16px]">
                <IdDocumentPreview uri={selectedId.uri} contentType={selectedId.contentType} />
              </View>
            ) : null}
            <Pressable
              onPress={() => setPreviewId(null)}
              accessibilityRole="button"
              className="mt-4 h-11 items-center justify-center rounded-3xl bg-primary"
            >
              <Text className="font-ubuntu-semibold text-[14px] text-white">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
