import Back from '@/src/components/mobile/Back';
import {
  getUserByIdAdmin,
  promoteToAdmin,
  demoteToResident,
  resendEmailVerification,
  deleteUser,
  deactivateUser,
} from '@/src/lib/api/user';
import { sharedStyles } from '@/src/theme/styles';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Animated,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { User } from '@/src/types/user';
import HouseholdSelectorSheet from '@/src/components/mobile/HouseholdSelectorSheet';
import { transferUserHousehold } from '@/src/lib/api/households';
import type { Household } from '@/src/types/household';
import { getUserDocuments, getUserDocumentViewUri } from '@/src/lib/api/userDocuments';
import { Feather } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import ResidentProfileFallback from '@/src/assets/icons/user-profile-placeholder.svg';

type DocumentLoadState = 'loading' | 'loaded' | 'missing' | 'pending' | 'error';

export default function SingleUserMobile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { userId, userParam } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType] = useState<'success' | 'error'>('success');
  const [promoteActionType, setPromoteActionType] = useState<'promote' | 'demote' | null>(null);
  const [showHouseholdSelector, setShowHouseholdSelector] = useState(false);
  const [transferringHousehold, setTransferringHousehold] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [profilePictureState, setProfilePictureState] = useState<DocumentLoadState>('loading');
  const [identificationExpanded, setIdentificationExpanded] = useState(true);
  const [identificationUri, setIdentificationUri] = useState<string | null>(null);
  const [identificationContentType, setIdentificationContentType] = useState<string | null>(null);
  const [identificationState, setIdentificationState] = useState<DocumentLoadState>('loading');
  const panY = new Animated.Value(0);
  const [userData, setUserData] = useState<User>({
    first_name: '',
    last_name: '',
    home_address: '',
    estate_name: '',
    email: '',
    phone_number: '',
    user_id: userId as string,
    estate_id: '',
    role: 'resident',
    gender: null,
    status: false,
  });
  const isVerifiedProfile =
    userData.status && (userData.role === 'resident' || userData.role === 'security');
  const verifiedRoleLabel = userData.role === 'security' ? 'Security' : 'Resident';
  const profileContentWidth = screenWidth - 40;
  const identificationPreviewWidth = profileContentWidth * (211 / 335);
  const identificationPreviewHeight = identificationPreviewWidth * (138.18 / 211);
  const identificationExpandedHeight = 52 + identificationPreviewHeight + 11.82;
  const residentActionScale = profileContentWidth / 335;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => gestureState.dy > 10,
    onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        setShowDeactivateModal(false);
        panY.setValue(0);
      } else {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        let resident: any = null;
        if (userParam) {
          try {
            resident = JSON.parse(userParam as string);
          } catch {}
        }

        if (!resident) {
          resident = await getUserByIdAdmin(userId as string);
        }

        if (!resident) {
          setError('User not found');
          setUserData({
            first_name: '',
            last_name: '',
            home_address: '',
            estate_name: '',
            email: '',
            phone_number: '',
            user_id: userId as string,
            estate_id: '',
            role: 'resident',
            gender: null,
            status: false,
          });
        } else {
          setUserData(resident);
          setIdentificationExpanded(resident.role === 'resident');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, userParam]);

  useEffect(() => {
    if (!isVerifiedProfile || !userId) {
      setProfilePictureUrl(null);
      setProfilePictureState('missing');
      return;
    }

    let active = true;
    setProfilePictureState('loading');

    void getUserDocuments(userId as string, 'profile_picture', ['active', 'pending'])
      .then(async ({ documents }) => {
        const profilePicture = documents.find(
          (document) =>
            document.document_type === 'profile_picture' && document.document_status === 'active'
        );
        const pendingPicture = documents.find(
          (document) =>
            document.document_type === 'profile_picture' && document.document_status === 'pending'
        );

        if (!profilePicture) {
          if (active) {
            setProfilePictureUrl(null);
            setProfilePictureState(pendingPicture ? 'pending' : 'missing');
          }
          return;
        }

        const uri = await getUserDocumentViewUri(
          userId as string,
          'profile_picture',
          profilePicture.content_type
        );
        if (active) {
          setProfilePictureUrl(uri);
          setProfilePictureState('loaded');
        }
      })
      .catch(() => {
        if (active) {
          setProfilePictureUrl(null);
          setProfilePictureState('error');
        }
      });

    return () => {
      active = false;
    };
  }, [isVerifiedProfile, userId]);

  useEffect(() => {
    if (!isVerifiedProfile || !identificationExpanded || !userId || identificationUri) return;

    let active = true;
    setIdentificationState('loading');

    void getUserDocuments(userId as string, 'id_card', ['active', 'pending'])
      .then(async ({ documents }) => {
        const identification = documents.find(
          (document) =>
            document.document_type === 'id_card' && document.document_status === 'active'
        );
        const pendingIdentification = documents.find(
          (document) =>
            document.document_type === 'id_card' && document.document_status === 'pending'
        );

        if (!identification) {
          if (active) {
            setIdentificationContentType(null);
            setIdentificationUri(null);
            setIdentificationState(pendingIdentification ? 'pending' : 'missing');
          }
          return;
        }

        const contentType = identification?.content_type ?? null;
        const uri = await getUserDocumentViewUri(userId as string, 'id_card', contentType);

        if (active) {
          setIdentificationContentType(contentType);
          setIdentificationUri(uri);
          setIdentificationState('loaded');
        }
      })
      .catch(() => {
        if (active) {
          setIdentificationUri(null);
          setIdentificationState('error');
        }
      });

    return () => {
      active = false;
    };
  }, [identificationExpanded, identificationUri, isVerifiedProfile, userId]);

  const handleDeactivate = async () => {
    setDeactivating(true);

    try {
      await deactivateUser(userId as string);
      setShowDeactivateModal(false);
      panY.setValue(0);
      router.back();
    } catch {
      setDialogType('error');
      setDialogMessage('Failed to deactivate user. Please try again.');
      setDialogVisible(true);
    } finally {
      setDeactivating(false);
    }
  };

  const handleResendEmail = async () => {
    setProcessing(true);
    try {
      await resendEmailVerification(userId as string);
    } catch (err) {
      setDialogType('error');
      setDialogMessage(err instanceof Error ? err.message : 'Failed to resend email.');
      setDialogVisible(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    setProcessing(true);
    try {
      await deleteUser(userId as string);
      router.back();
    } catch (err) {
      setDialogType('error');
      setDialogMessage(err instanceof Error ? err.message : 'Failed to delete user.');
      setDialogVisible(true);
    } finally {
      setProcessing(false);
    }
  };

  const handlePromoteOrDemote = async () => {
    if (!promoteActionType) return;

    setProcessing(true);
    try {
      let message = '';

      if (promoteActionType === 'promote') {
        await promoteToAdmin(userId as string);
        message = `${userData.first_name} has been successfully promoted to Admin.`;
      } else if (promoteActionType === 'demote') {
        await demoteToResident(userId as string);
        message = `${userData.first_name} has been successfully demoted to Resident.`;
      }

      setShowPromoteModal(false);
      setPromoteActionType(null);
      setDialogType('success');
      setDialogMessage(message);
      setDialogVisible(true);

      // Refresh user data after successful action
      setTimeout(async () => {
        const resident = await getUserByIdAdmin(userId as string);
        if (resident) {
          setUserData(resident);
        }
      }, 1500);
    } catch (err) {
      setShowPromoteModal(false);
      setPromoteActionType(null);
      setDialogType('error');
      setDialogMessage(err instanceof Error ? err.message : 'Failed to process action.');
      setDialogVisible(true);
    } finally {
      setProcessing(false);
    }
  };

  const promptPromote = () => {
    setPromoteActionType('promote');
    setShowPromoteModal(true);
  };

  const handleHouseholdTransfer = async (household: Household) => {
    if (household.id === userData.household_id) {
      setShowHouseholdSelector(false);
      setDialogType('error');
      setDialogMessage(`${userData.first_name || 'This user'} is already in ${household.name}.`);
      setDialogVisible(true);
      return;
    }

    setTransferringHousehold(true);
    try {
      const response = await transferUserHousehold({
        user_id: userId as string,
        household_id: household.id,
      });
      setUserData((current) => ({
        ...current,
        household_id: household.id,
        household_name: household.name,
      }));
      setShowHouseholdSelector(false);
      setDialogType('success');
      setDialogMessage(response.message || `${userData.first_name} was transferred successfully.`);
      setDialogVisible(true);
    } catch (err) {
      setDialogType('error');
      setDialogMessage(err instanceof Error ? err.message : 'Failed to transfer household.');
      setDialogVisible(true);
    } finally {
      setTransferringHousehold(false);
    }
  };

  return (
    <>
      <SafeAreaView
        style={[
          sharedStyles.container,
          {
            backgroundColor: '#F6F7F7',
            paddingTop: Math.max(0, 88 - insets.top),
            paddingBottom: isVerifiedProfile ? 0 : Math.max(0, 110 - insets.bottom),
          },
        ]}
      >
        <Stack.Screen
          options={{
            headerShown: false,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: '#F6F7F7' },
          }}
        />

        <View
          className={`w-full flex-row items-center justify-between ${isVerifiedProfile ? 'h-10' : 'h-[30px]'}`}
        >
          <Back
            type="short-arrow"
            showText={false}
            showBorder
            borderSize={30}
            leftOffset={-3}
            iconStyle={{ width: 8.56, height: 12, top: 0 }}
          />

          {!loading && !error && isVerifiedProfile && (
            <TouchableOpacity
              onPress={() => setShowHouseholdSelector(true)}
              accessibilityRole="button"
              accessibilityLabel="Transfer User"
              hitSlop={12}
              className="mr-[10px] h-10 w-[74px] items-center justify-center"
            >
              <Text
                className="font-inter-semibold text-primary"
                style={{ fontSize: 11.2, lineHeight: 11.2 }}
              >
                Transfer User
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#113E55" />
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center px-4">
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 items-center">
              <Text className="text-red-800 font-ubuntu-semibold text-center mb-3">
                Error Loading User
              </Text>
              <Text className="text-red-600 text-center mb-4">{error}</Text>
              <TouchableOpacity
                className="bg-red-600 px-6 py-2 rounded-lg"
                onPress={() => {
                  const fetchUserData = async () => {
                    try {
                      setLoading(true);
                      setError(null);
                      let resident: any = null;
                      if (userParam) {
                        try {
                          resident = JSON.parse(userParam as string);
                        } catch {}
                      }
                      if (!resident) {
                        resident = await getUserByIdAdmin(userId as string);
                      }
                      if (resident) {
                        setUserData(resident);
                        setIdentificationExpanded(resident.role === 'resident');
                      } else {
                        setError('User not found');
                      }
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to load user data');
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchUserData();
                }}
              >
                <Text className="text-white font-ubuntu-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={isVerifiedProfile ? { paddingBottom: 110 } : { flexGrow: 1 }}
            >
              {isVerifiedProfile && (
                <View className="mt-[19px] items-center">
                  <View className="h-[87px] w-[87px] items-center justify-center overflow-hidden rounded-full bg-[#F6F7F7]">
                    {profilePictureState === 'loading' ? (
                      <ActivityIndicator size="small" color="#113E55" />
                    ) : profilePictureUrl ? (
                      <Image
                        source={{ uri: profilePictureUrl }}
                        className="h-full w-full"
                        resizeMode="cover"
                        onError={() => {
                          setProfilePictureUrl(null);
                          setProfilePictureState('error');
                        }}
                      />
                    ) : (
                      <ResidentProfileFallback width={87} height={87} />
                    )}
                  </View>

                  <View
                    className="mt-[13px] h-[33px] items-center"
                    style={{ width: Platform.OS === 'android' ? 160 : 111 }}
                  >
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      className="text-center font-ubuntu-medium text-primary"
                      style={{
                        fontSize: 27.34,
                        lineHeight: 27.34,
                        width: Platform.OS === 'android' ? 160 : undefined,
                      }}
                    >
                      {verifiedRoleLabel}
                    </Text>
                  </View>
                </View>
              )}

              <View
                className={`${isVerifiedProfile ? 'mt-8' : 'mt-14'} ${isVerifiedProfile ? '' : 'flex-1'}`}
              >
                <View className="h-[41px] w-full flex-row items-center justify-between rounded-2xl bg-white px-4">
                  <Text
                    className="font-inter-medium text-[#878686]"
                    style={{ fontSize: 14, lineHeight: 14 }}
                  >
                    Name
                  </Text>
                  <Text
                    className="font-inter-light text-[#878686]"
                    numberOfLines={1}
                    style={{ fontSize: 14, lineHeight: 14 }}
                  >
                    {`${userData.first_name} ${userData.last_name}`.trim()}
                  </Text>
                </View>

                <View className="mt-2 h-[41px] w-full flex-row items-center justify-between rounded-2xl bg-white px-4">
                  <Text
                    className="font-inter-medium text-[#878686]"
                    style={{ fontSize: 14, lineHeight: 14 }}
                  >
                    Phone Number
                  </Text>
                  <Text
                    className="max-w-[55%] font-inter-light text-[#878686]"
                    numberOfLines={1}
                    style={{ fontSize: 14, lineHeight: 14 }}
                  >
                    {userData.phone_number}
                  </Text>
                </View>

                <View className="mt-2 h-[41px] w-full flex-row items-center justify-between rounded-2xl bg-white px-4">
                  <Text
                    className="font-inter-medium text-[#878686]"
                    style={{ fontSize: 14, lineHeight: 14 }}
                  >
                    Email Address
                  </Text>
                  <Text
                    className="max-w-[55%] font-inter-light text-[#878686]"
                    numberOfLines={1}
                    style={{ fontSize: 14, lineHeight: 14 }}
                  >
                    {userData.email}
                  </Text>
                </View>

                <View className="mt-2 h-[41px] w-full flex-row items-center justify-between rounded-2xl bg-white px-4">
                  <Text
                    className="font-inter-medium text-[#878686]"
                    style={{ fontSize: 14, lineHeight: 14 }}
                  >
                    House Hold
                  </Text>
                  <Text
                    className="max-w-[55%] font-inter-light text-[#878686]"
                    numberOfLines={1}
                    style={{ fontSize: 14, lineHeight: 14 }}
                  >
                    {userData.household_name || 'No household assigned'}
                  </Text>
                </View>

                <View className="mt-2 h-[41px] w-full flex-row items-center justify-between rounded-2xl bg-white px-4">
                  <Text
                    className="font-inter-medium text-[#878686]"
                    style={{ fontSize: 14, lineHeight: 14 }}
                  >
                    Address
                  </Text>
                  <Text
                    className="max-w-[65%] font-inter-light text-[#878686]"
                    numberOfLines={1}
                    style={{ fontSize: 14, lineHeight: 14 }}
                  >
                    {userData.home_address}
                  </Text>
                </View>

                {isVerifiedProfile && (
                  <View
                    className="mt-2 w-full overflow-hidden rounded-2xl bg-white"
                    style={{ height: identificationExpanded ? identificationExpandedHeight : 41 }}
                  >
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityState={{ expanded: identificationExpanded }}
                      onPress={() => setIdentificationExpanded((current) => !current)}
                      activeOpacity={0.7}
                      className="ml-4 mr-[18px] mt-3 h-6 flex-row items-center justify-between"
                    >
                      <Text
                        className="font-inter-medium text-[#878686]"
                        style={{ fontSize: 14, lineHeight: 14 }}
                      >
                        Identification Card
                      </Text>
                      <View className="h-6 w-6 items-center justify-center">
                        <Feather
                          name={identificationExpanded ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color="#113E55"
                        />
                      </View>
                    </TouchableOpacity>

                    {identificationExpanded && (
                      <View
                        className="mt-4 overflow-hidden rounded-2xl bg-[#F6F7F7]"
                        style={{
                          height: identificationPreviewHeight,
                          marginLeft: profileContentWidth * (55 / 335),
                          width: identificationPreviewWidth,
                        }}
                      >
                        {identificationUri && identificationContentType === 'application/pdf' ? (
                          <Pdf
                            source={{ uri: identificationUri }}
                            page={1}
                            singlePage
                            fitPolicy={0}
                            spacing={0}
                            enablePaging={false}
                            enableAnnotationRendering={false}
                            style={{
                              height: identificationPreviewHeight,
                              width: identificationPreviewWidth,
                            }}
                            onError={() => {
                              setIdentificationUri(null);
                              setIdentificationState('error');
                            }}
                          />
                        ) : identificationUri ? (
                          <Image
                            source={{ uri: identificationUri }}
                            className="h-full w-full"
                            resizeMode="cover"
                            onError={() => {
                              setIdentificationUri(null);
                              setIdentificationState('error');
                            }}
                          />
                        ) : identificationState === 'loading' ? (
                          <View className="h-full w-full items-center justify-center">
                            <ActivityIndicator size="small" color="#113E55" />
                          </View>
                        ) : (
                          <View className="h-full w-full items-center justify-center">
                            <Feather name="credit-card" size={40} color="#C8CECE" />
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>

              {isVerifiedProfile ? (
                <View
                  className="mt-[81px] flex-row"
                  style={{
                    columnGap: 10 * residentActionScale,
                    marginLeft: -3 * residentActionScale,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setShowDeactivateModal(true)}
                    disabled={deactivating || processing}
                    className={`h-12 items-center justify-center rounded-3xl bg-[#E5F6FF] ${
                      deactivating || processing ? 'opacity-70' : ''
                    }`}
                    style={{ width: 168 * residentActionScale }}
                  >
                    <Text
                      className="font-ubuntu-semibold text-primary"
                      style={{ fontSize: 14, lineHeight: 14, letterSpacing: -0.24 }}
                    >
                      Deactivate
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={promptPromote}
                    disabled={deactivating || processing}
                    className={`h-12 items-center justify-center rounded-3xl border border-primary bg-primary ${
                      deactivating || processing ? 'opacity-70' : ''
                    }`}
                    style={{ width: 159 * residentActionScale }}
                  >
                    <Text
                      className="font-ubuntu-semibold text-white"
                      style={{ fontSize: 14, lineHeight: 14, letterSpacing: -0.24 }}
                    >
                      Make Admin
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="mt-auto flex-row gap-[10px]">
                  <TouchableOpacity
                    onPress={handleDeleteUser}
                    disabled={processing}
                    className={`h-12 items-center justify-center rounded-3xl bg-[#E5F6FF] ${
                      processing ? 'opacity-70' : ''
                    }`}
                    style={{ flex: 168 }}
                  >
                    {processing ? (
                      <ActivityIndicator color="#113E55" size="small" />
                    ) : (
                      <Text
                        className="font-ubuntu-semibold text-primary"
                        style={{ fontSize: 14, lineHeight: 14, letterSpacing: -0.24 }}
                      >
                        Delete User
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleResendEmail}
                    disabled={processing}
                    className={`h-12 items-center justify-center rounded-3xl border border-primary bg-primary ${
                      processing ? 'opacity-70' : ''
                    }`}
                    style={{ flex: 159 }}
                  >
                    {processing ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text
                        className="font-ubuntu-semibold text-white"
                        style={{ fontSize: 14, lineHeight: 14, letterSpacing: -0.24 }}
                      >
                        Resend Email
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* Deactivate Confirmation Bottom Drawer */}
            <Modal
              visible={showDeactivateModal}
              transparent
              animationType="none"
              onDismiss={() => panY.setValue(0)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  setShowDeactivateModal(false);
                  panY.setValue(0);
                }}
                className="flex-1 bg-black/50 justify-end"
              >
                <Animated.View
                  style={{ transform: [{ translateY: panY }] }}
                  {...panResponder.panHandlers}
                  className="bg-white rounded-t-3xl p-6 pb-10"
                >
                  <View className="mb-2">
                    <View className="h-1 w-12 bg-grey rounded-full self-center mb-4" />
                  </View>

                  <Text className="text-2xl font-ubuntu-medium text-grey mb-3 text-center">
                    Are You sure ?
                  </Text>
                  <Text className="text-black text-base font-inter-regular mb-2 text-center">
                    Confirm if you want to deactivate this user from the system
                  </Text>
                  <Text className="text-black text- font-inter-regular mb-6 text-center">
                    This action will be reviewed in 48 hours.
                  </Text>

                  <View className="flex-row gap-3 mt-6">
                    <TouchableOpacity
                      onPress={() => setShowDeactivateModal(false)}
                      disabled={deactivating}
                      className={`flex-1 border-2 bg-teal border-teal py-4 rounded-lg ${deactivating ? 'opacity-70' : ''}`}
                    >
                      <Text className="text-white font-ubuntu-semibold text-center text-md">
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleDeactivate}
                      disabled={deactivating}
                      className={`flex-1 bg-primary py-4 rounded-lg ${deactivating ? 'opacity-70' : ''}`}
                    >
                      {deactivating ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text className="text-white font-ubuntu-semibold text-center text-md">
                          Proceed
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </Modal>

            {/* Promote/Demote Confirmation Bottom Drawer */}
            <Modal
              visible={showPromoteModal}
              transparent
              animationType="none"
              onDismiss={() => panY.setValue(0)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  setShowPromoteModal(false);
                  setPromoteActionType(null);
                }}
                className="flex-1 bg-black/50 justify-end"
              >
                <Animated.View
                  style={{ transform: [{ translateY: panY }] }}
                  className="bg-white rounded-t-3xl p-6 pb-10"
                >
                  <View className="mb-2">
                    <View className="h-1 w-12 bg-grey rounded-full self-center mb-4" />
                  </View>

                  <Text className="text-2xl font-ubuntu-medium text-grey mb-3 text-center">
                    Are You sure ?
                  </Text>
                  <Text className="text-black text-base font-inter-regular mb-2 text-center">
                    {promoteActionType === 'promote'
                      ? `Confirm if you want to promote ${userData.first_name} to admin`
                      : `Confirm if you want to demote ${userData.first_name} to resident`}
                  </Text>

                  <View className="flex-row gap-3 mt-6">
                    <TouchableOpacity
                      onPress={() => {
                        setShowPromoteModal(false);
                        setPromoteActionType(null);
                      }}
                      disabled={processing}
                      className={`flex-1 border-2 bg-teal border-teal py-4 rounded-lg ${processing ? 'opacity-70' : ''}`}
                    >
                      <Text className="text-white font-ubuntu-semibold text-center text-md">
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handlePromoteOrDemote}
                      disabled={processing}
                      className={`flex-1 bg-primary py-4 rounded-lg ${processing ? 'opacity-70' : ''}`}
                    >
                      {processing ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text className="text-white font-ubuntu-semibold text-center text-md">
                          {promoteActionType === 'promote' ? 'Promote' : 'Demote'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </Modal>
            {/* Dialog Box for System Messages */}
            <Modal visible={dialogVisible} transparent animationType="fade">
              <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white rounded-lg p-6 mx-4 max-w-xs">
                  <Text
                    className={`text-lg font-ubuntu-semibold text-center mb-4 ${dialogType === 'success' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {dialogType === 'success' ? 'Success' : 'Error'}
                  </Text>
                  <Text className="text-grey text-base font-ubuntu-regular text-center mb-6">
                    {dialogMessage}
                  </Text>

                  <TouchableOpacity
                    onPress={() => setDialogVisible(false)}
                    className="bg-primary py-3 rounded-lg"
                  >
                    <Text className="text-white font-ubuntu-semibold text-center">OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <HouseholdSelectorSheet
              visible={showHouseholdSelector}
              estateId={userData.estate_id || ''}
              selected={
                userData.household_id
                  ? {
                      id: userData.household_id,
                      name: userData.household_name || 'Current household',
                      estate_id: userData.estate_id || '',
                      head_user_id: null,
                      created_at: '',
                    }
                  : null
              }
              confirmationTitle="Transfer User?"
              confirmationActionLabel="Transfer"
              onClose={() => !transferringHousehold && setShowHouseholdSelector(false)}
              onSelect={handleHouseholdTransfer}
            />
          </>
        )}
      </SafeAreaView>
    </>
  );
}
