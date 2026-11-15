import Back from '@/src/shared/components/navigation/Back';
import { sharedStyles } from '@/src/shared/theme/styles';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import HouseholdSelectorSheet from '@/src/features/admin/components/HouseholdSelectorSheet';
import { Feather } from '@expo/vector-icons';
import IdDocumentPreview from '@/src/features/profile/components/IdDocumentPreview';
import ResidentProfileFallback from '@/src/assets/icons/user-profile-placeholder.svg';
import PrimaryAdminPromotionIcon from '@/src/assets/icons/primary-admin-promotion.svg';
import AlertIcon from '@/src/assets/icons/alert.svg';
import PromptModal from '@/src/shared/components/feedback/PromptModal';
import { useAdminUserProfile } from '@/src/features/admin/hooks/useAdminUserProfile';

export default function SingleUserMobile() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { userId } = useLocalSearchParams();
  const {
    loading,
    error,
    retry,
    userData,
    isVerifiedProfile,
    isAdminProfile,
    showRoleAction,
    canTransferPrimary,
    hideProfileActions,
    verifiedRoleLabel,
    identificationExpanded,
    toggleIdentification,
    picture,
    identification,
    deactivating,
    processing,
    actionError,
    promotionError,
    clearPromotionError,
    pendingAction,
    setPendingAction,
    confirmationCopy,
    confirmProfileAction,
    showHouseholdSelector,
    setShowHouseholdSelector,
    transferringHousehold,
    handleHouseholdTransfer,
    handleResendEmail,
    handleDeleteUser,
  } = useAdminUserProfile(userId);
  const { uri: profilePictureUrl, state: profilePictureState } = picture;
  const {
    uri: identificationUri,
    contentType: identificationContentType,
    state: identificationState,
  } = identification;
  const profileContentWidth = screenWidth - 40;
  const identificationPreviewWidth = profileContentWidth * (211 / 335);
  const identificationPreviewHeight = identificationPreviewWidth * (138.18 / 211);
  const identificationExpandedHeight = 52 + identificationPreviewHeight + 11.82;
  const residentActionScale = profileContentWidth / 335;

  return (
    <>
      <SafeAreaView
        style={[
          sharedStyles.container,
          {
            backgroundColor: '#F6F7F7',
            paddingTop: 19,
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

          {!loading && !error && isVerifiedProfile && !isAdminProfile && (
            <TouchableOpacity
              onPress={() => setShowHouseholdSelector(true)}
              accessibilityRole="button"
              accessibilityLabel="Transfer User"
              hitSlop={12}
              className="mr-[10px] h-10 w-[74px] items-center justify-center"
            >
              <Text
                className="font-inter-semibold text-primary"
                style={{ fontSize: 11.2, lineHeight: 16 }}
              >
                Transfer User
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <CircleLoader size={36} />
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center px-4">
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 items-center">
              <Text className="text-red-800 font-ubuntu-semibold text-center mb-3">
                Error Loading User
              </Text>
              <Text className="text-red-600 text-center mb-4">{error}</Text>
              <TouchableOpacity className="bg-red-600 px-6 py-2 rounded-lg" onPress={retry}>
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
                    {profilePictureUrl && profilePictureState === 'loaded' ? (
                      <Image
                        source={{ uri: profilePictureUrl }}
                        className="h-full w-full"
                        resizeMode="cover"
                        onError={picture.onRenderError}
                      />
                    ) : (
                      <ResidentProfileFallback width={87} height={87} />
                    )}
                  </View>

                  {isVerifiedProfile && (
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
                          lineHeight: 33,
                          width: Platform.OS === 'android' ? 160 : undefined,
                        }}
                      >
                        {verifiedRoleLabel}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View
                className={`${isVerifiedProfile ? 'mt-8' : 'mt-14'} ${isVerifiedProfile ? '' : 'flex-1'}`}
              >
                <View className="h-[41px] w-full flex-row items-center justify-between rounded-2xl bg-white px-4">
                  <Text
                    className="font-inter-medium text-[#878686]"
                    style={{ fontSize: 14, lineHeight: 18 }}
                  >
                    Name
                  </Text>
                  <Text
                    className="max-w-[65%] font-inter-light text-[#878686]"
                    numberOfLines={1}
                    style={{ fontSize: 14, lineHeight: 18 }}
                  >
                    {`${userData.first_name} ${userData.last_name}`.trim()}
                  </Text>
                </View>

                <View className="mt-2 h-[41px] w-full flex-row items-center justify-between rounded-2xl bg-white px-4">
                  <Text
                    className="font-inter-medium text-[#878686]"
                    style={{ fontSize: 14, lineHeight: 18 }}
                  >
                    Phone Number
                  </Text>
                  <Text
                    className="max-w-[55%] font-inter-light text-[#878686]"
                    numberOfLines={1}
                    style={{ fontSize: 14, lineHeight: 18 }}
                  >
                    {userData.phone_number}
                  </Text>
                </View>

                <View className="mt-2 h-[41px] w-full flex-row items-center justify-between rounded-2xl bg-white px-4">
                  <Text
                    className="font-inter-medium text-[#878686]"
                    style={{ fontSize: 14, lineHeight: 18 }}
                  >
                    Email Address
                  </Text>
                  <Text
                    className="max-w-[55%] font-inter-light text-[#878686]"
                    numberOfLines={1}
                    style={{ fontSize: 14, lineHeight: 18 }}
                  >
                    {userData.email}
                  </Text>
                </View>

                <View className="mt-2 h-[41px] w-full flex-row items-center justify-between rounded-2xl bg-white px-4">
                  <Text
                    className="font-inter-medium text-[#878686]"
                    style={{ fontSize: 14, lineHeight: 18 }}
                  >
                    House Hold
                  </Text>
                  <Text
                    className="max-w-[55%] font-inter-light text-[#878686]"
                    numberOfLines={1}
                    style={{ fontSize: 14, lineHeight: 18 }}
                  >
                    {userData.household_name || 'No household assigned'}
                  </Text>
                </View>

                <View className="mt-2 h-[41px] w-full flex-row items-center justify-between rounded-2xl bg-white px-4">
                  <Text
                    className="font-inter-medium text-[#878686]"
                    style={{ fontSize: 14, lineHeight: 18 }}
                  >
                    Address
                  </Text>
                  <Text
                    className="max-w-[65%] font-inter-light text-[#878686]"
                    numberOfLines={1}
                    style={{ fontSize: 14, lineHeight: 18 }}
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
                      onPress={toggleIdentification}
                      activeOpacity={0.7}
                      className="ml-4 mr-[18px] mt-3 h-6 flex-row items-center justify-between"
                    >
                      <Text
                        className="font-inter-medium text-[#878686]"
                        style={{ fontSize: 14, lineHeight: 18 }}
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
                          <IdDocumentPreview
                            uri={identificationUri}
                            contentType={identificationContentType}
                          />
                        ) : identificationUri ? (
                          <Image
                            source={{ uri: identificationUri }}
                            className="h-full w-full"
                            resizeMode="cover"
                            onError={identification.onRenderError}
                          />
                        ) : identificationState === 'loading' ? (
                          <View className="h-full w-full items-center justify-center">
                            <CircleLoader size={32} />
                          </View>
                        ) : (
                          <View className="h-full w-full items-center justify-center">
                            <Text
                              className="font-inter-regular text-[#878686]"
                              style={{ fontSize: 14, lineHeight: 18 }}
                            >
                              No ID to preview
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>

              {actionError ? (
                <Text className="mb-4 text-center text-[13px] text-[#B42318] font-inter-regular">
                  {actionError}
                </Text>
              ) : null}
              {hideProfileActions ? null : isVerifiedProfile ? (
                <View className="mt-[81px]">
                  <View
                    className="flex-row"
                    style={{
                      columnGap: 10 * residentActionScale,
                      marginLeft: -3 * residentActionScale,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setPendingAction('deactivate')}
                      disabled={deactivating || processing}
                      className={`h-12 items-center justify-center rounded-3xl bg-[#E5F6FF] ${
                        deactivating || processing ? 'opacity-70' : ''
                      }`}
                      style={{ width: (showRoleAction ? 168 : 337) * residentActionScale }}
                    >
                      <Text
                        className="font-ubuntu-semibold text-primary"
                        style={{ fontSize: 14, lineHeight: 18, letterSpacing: -0.24 }}
                      >
                        Deactivate
                      </Text>
                    </TouchableOpacity>

                    {showRoleAction && (
                      <TouchableOpacity
                        onPress={() => {
                          clearPromotionError();
                          setPendingAction(isAdminProfile ? 'demote' : 'promote');
                        }}
                        disabled={deactivating || processing}
                        className={`h-12 items-center justify-center rounded-3xl border border-primary bg-primary ${
                          deactivating || processing ? 'opacity-70' : ''
                        }`}
                        style={{ width: 159 * residentActionScale }}
                      >
                        <Text
                          className="font-ubuntu-semibold text-white"
                          style={{ fontSize: 14, lineHeight: 18, letterSpacing: -0.24 }}
                        >
                          {isAdminProfile ? 'Make Resident' : 'Make Admin'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {canTransferPrimary && (
                    <TouchableOpacity
                      onPress={() => setPendingAction('transferPrimary')}
                      disabled={deactivating || processing}
                      accessibilityRole="button"
                      accessibilityLabel="Promote to Primary Admin"
                      className="mt-[6px] h-12 w-full max-w-[278px] self-center items-center justify-center"
                    >
                      <Text className="font-inter-semibold text-primary" style={{ fontSize: 11.2 }}>
                        Promote to Primary Admin
                      </Text>
                    </TouchableOpacity>
                  )}
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
                      <CircleLoader size={32} />
                    ) : (
                      <Text
                        className="font-ubuntu-semibold text-primary"
                        style={{ fontSize: 14, lineHeight: 18, letterSpacing: -0.24 }}
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
                      <CircleLoader size={22} tone="light" />
                    ) : (
                      <Text
                        className="font-ubuntu-semibold text-white"
                        style={{ fontSize: 14, lineHeight: 18, letterSpacing: -0.24 }}
                      >
                        Resend Email
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

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
              onClose={() => !transferringHousehold && setShowHouseholdSelector(false)}
              onSelect={handleHouseholdTransfer}
            />
            <PromptModal
              visible={pendingAction === 'transferPrimary'}
              icon={<PrimaryAdminPromotionIcon width={40} height={40} />}
              title="Promote"
              message="Promoting this user will revoke your primary admin rights and sign you out. Are you sure you want to proceed?"
              confirmLabel="Promote User"
              onConfirm={() => void confirmProfileAction()}
              onClose={() => setPendingAction(null)}
            />
            <Modal
              visible={pendingAction !== null && pendingAction !== 'transferPrimary'}
              transparent
              animationType="fade"
              statusBarTranslucent
              onRequestClose={() => setPendingAction(null)}
            >
              <View className="flex-1 items-center justify-center bg-black/40 px-6">
                <View className="w-full max-w-[360px] rounded-[24px] bg-[#F6F7F7] px-6 py-7">
                  <Text className="text-center font-ubuntu-semibold text-[21px] text-primary">
                    {confirmationCopy.title}
                  </Text>
                  <Text className="mt-3 text-center font-inter-regular text-[14px] leading-[21px] text-[#646B70]">
                    {confirmationCopy.message}
                  </Text>
                  <View className="mt-7 flex-row gap-[10px]">
                    <TouchableOpacity
                      onPress={() => setPendingAction(null)}
                      className="h-12 flex-1 items-center justify-center rounded-3xl bg-[#E5F6FF]"
                    >
                      <Text className="font-ubuntu-semibold text-[14px] text-primary">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => void confirmProfileAction()}
                      className="h-12 flex-1 items-center justify-center rounded-3xl bg-primary"
                    >
                      <Text className="font-ubuntu-semibold text-[14px] text-white">
                        {confirmationCopy.button}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            <PromptModal
              visible={Boolean(promotionError)}
              icon={<AlertIcon width={44} height={44} />}
              message={promotionError}
              confirmLabel="Got it"
              onConfirm={clearPromotionError}
              onClose={clearPromotionError}
            />
          </>
        )}
      </SafeAreaView>
    </>
  );
}
