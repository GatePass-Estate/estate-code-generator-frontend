import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import ValidationBack from '@/src/assets/icons/validation-back.svg';
import ProfileExpandedOverlay from '@/src/assets/icons/profile-expanded-overlay.svg';
import ProfileOverlayClose from '@/src/assets/icons/profile-overlay-close.svg';
import ResidentProfileInnerGroup from '@/src/assets/icons/resident-profile-inner-group.svg';
import ResidentProfileInnerVector from '@/src/assets/icons/resident-profile-inner-vector.svg';
import { sharedStyles } from '@/src/theme/styles';
import { useSecurityResponsiveLayout } from '@/src/lib/securityResponsive';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { getUserDocumentViewUri } from '@/src/lib/api/userDocuments';

const getParam = (value: string | string[] | undefined, fallback = 'N/A') => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue && rawValue.trim() ? rawValue : fallback;
};

const formatAccessCode = (value: string) => {
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
};

const getNameInitials = (name: string) => {
  const parts = name
    .replace(/[^a-zA-Z\s'-]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0 || name === 'N/A') return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const toTitleCase = (value: string) => {
  if (!value || value === 'N/A') return value;

  return value
    .split(' ')
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(' ');
};

function ResidentInitialsBadge({
  initials,
  useFallbackIcon,
}: {
  initials: string;
  useFallbackIcon: boolean;
}) {
  return (
    <View style={styles.profileInitialsBadge}>
      {useFallbackIcon ? (
        <View style={styles.fallbackProfileIcon}>
          <ResidentProfileInnerGroup
            width={41.66666793823242}
            height={41.66666793823242}
            style={styles.fallbackProfileInnerGroup}
          />
          <ResidentProfileInnerVector
            width={16.66666603088379}
            height={16.66666603088379}
            style={styles.fallbackProfileInnerVector}
          />
        </View>
      ) : (
        <Text style={styles.profileInitialsText}>{initials}</Text>
      )}
    </View>
  );
}

function AccessCodeCard({ code, isResidentCode }: { code: string; isResidentCode: boolean }) {
  return (
    <View style={[styles.accessCodeFrame, isResidentCode && styles.residentAccessCodeFrame]}>
      <Text style={styles.accessCodeLabel}>Access Code</Text>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.76}
        numberOfLines={1}
        style={styles.accessCodeValue}
      >
        {formatAccessCode(code)}
      </Text>
    </View>
  );
}

function DetailRow({
  label,
  labelWidth,
  value,
  valueWidth,
  valueAlign = 'right',
}: {
  label: string;
  labelWidth: number;
  value: string;
  valueWidth: number;
  valueAlign?: 'left' | 'right';
}) {
  return (
    <View style={styles.detailPill}>
      <View style={styles.detailContentFrame}>
        <View style={[styles.detailLabelSlot, { width: labelWidth }]}>
          <Text allowFontScaling={false} numberOfLines={1} style={styles.detailLabel}>
            {label}
          </Text>
        </View>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.detailValue, { textAlign: valueAlign, width: valueWidth }]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ValidationResult() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const securityLayout = useSecurityResponsiveLayout();
  const [pictureOpen, setPictureOpen] = useState(false);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [fetchedProfilePictureUrl, setFetchedProfilePictureUrl] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.access_token);

  const receiver = String(params.receiver || '');
  const isResidentCode = receiver === 'resident';
  const guestName = getParam(params.visitor_fullname);
  const relationship = toTitleCase(getParam(params.relationship_with_resident));
  const guestGender = toTitleCase(getParam(params.gender));
  const residentName = getParam(params.resident_name);
  const residentAddress = getParam(params.resident_address);
  const residentHousehold = getParam(params.resident_household);
  const residentEmail = getParam(params.resident_email);
  const residentPhone = getParam(params.resident_phone_number);
  const validatedCode = getParam(params.code, '');
  const residentUserId = getParam(params.resident_user_id, '');
  const residentProfilePictureUrl = getParam(params.resident_profile_picture_url, '');
  const activeResidentProfilePictureUrl =
    residentProfilePictureUrl || fetchedProfilePictureUrl || '';
  const profileInitials = getNameInitials(isResidentCode ? residentName : guestName);
  const residentProfilePictureSource = activeResidentProfilePictureUrl
    ? /^https?:\/\//i.test(activeResidentProfilePictureUrl)
      ? {
          uri: activeResidentProfilePictureUrl,
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        }
      : { uri: activeResidentProfilePictureUrl }
    : null;
  const shouldShowProfileImage = Boolean(
    isResidentCode && residentProfilePictureSource && !profileImageFailed
  );

  useEffect(() => {
    let isMounted = true;

    if (!isResidentCode || !residentUserId) {
      setFetchedProfilePictureUrl(null);
      return;
    }

    setProfileImageFailed(false);
    getUserDocumentViewUri(residentUserId, 'profile_picture')
      .then((url) => {
        if (isMounted) setFetchedProfilePictureUrl(url);
      })
      .catch(() => {
        if (isMounted) setFetchedProfilePictureUrl(null);
      });

    return () => {
      isMounted = false;
    };
  }, [isResidentCode, residentUserId]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/security');
  };

  return (
    <SafeAreaView style={[sharedStyles.container, styles.container]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={securityLayout.frameStyle}>
        <View style={securityLayout.canvasStyle}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              isResidentCode ? styles.residentScrollContent : styles.guestScrollContent,
            ]}
            showsVerticalScrollIndicator={false}
            style={styles.resultScrollView}
          >
            <View style={styles.backButtonSlot}>
              <Pressable
                accessibilityLabel="Go back"
                onPress={handleBack}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              >
                <ValidationBack width={30} height={30} />
              </Pressable>
            </View>

            <View style={[styles.profileEllipse, isResidentCode && styles.residentProfileEllipse]}>
              {shouldShowProfileImage && residentProfilePictureSource ? (
                <Image
                  onError={() => setProfileImageFailed(true)}
                  source={residentProfilePictureSource}
                  style={styles.residentProfileImage}
                />
              ) : (
                <ResidentInitialsBadge
                  initials={profileInitials}
                  useFallbackIcon={isResidentCode}
                />
              )}
              {isResidentCode ? (
                <Pressable
                  accessibilityLabel="Open resident picture"
                  onPress={() => setPictureOpen(true)}
                  style={styles.profileTapTarget}
                />
              ) : null}
            </View>

            <View style={[styles.codeCard, isResidentCode && styles.residentCodeCard]}>
              <AccessCodeCard code={validatedCode} isResidentCode={isResidentCode} />
            </View>

            {!isResidentCode ? (
              <View style={styles.guestDetailsGroup}>
                <View style={styles.guestDetailsCard}>
                  <View style={styles.guestSectionDivider} />
                  <View style={styles.sectionHeading}>
                    <View style={styles.sectionLine} />
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      style={styles.guestDetailsTitle}
                    >
                      Guest Details
                    </Text>
                    <View style={styles.sectionLine} />
                  </View>
                  <View style={styles.detailList}>
                    <View style={styles.guestDetailNameRow}>
                      <DetailRow label="Name" labelWidth={40} value={guestName} valueWidth={129} />
                    </View>
                    <View style={styles.guestDetailGenderRow}>
                      <DetailRow
                        label="Gender"
                        labelWidth={50}
                        value={guestGender}
                        valueWidth={88}
                      />
                    </View>
                    <View style={styles.guestDetailRelationshipRow}>
                      <DetailRow
                        label="Relationship"
                        labelWidth={83}
                        value={relationship}
                        valueWidth={94}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={[styles.residentDetailsGroup, isResidentCode && styles.residentOnlyGroup]}>
              <View style={styles.residentDetailsCard}>
                <View style={styles.residentSectionDivider} />
                <View style={[styles.sectionHeading, styles.residentSectionHeading]}>
                  <View style={[styles.sectionLine, styles.residentSectionLine]} />
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={styles.residentDetailsTitle}
                  >
                    Resident Details
                  </Text>
                  <View style={[styles.sectionLine, styles.residentSectionLine]} />
                </View>
                <View style={styles.residentDetailList}>
                  <View style={styles.residentDetailNameRow}>
                    <DetailRow label="Name" labelWidth={40} value={residentName} valueWidth={125} />
                  </View>
                  <View style={styles.residentDetailAddressRow}>
                    <DetailRow
                      label="Address"
                      labelWidth={56}
                      value={residentAddress}
                      valueWidth={161}
                    />
                  </View>
                  <View style={styles.residentDetailHouseholdRow}>
                    <DetailRow
                      label="Household"
                      labelWidth={72}
                      value={residentHousehold}
                      valueWidth={94}
                    />
                  </View>
                  <View style={styles.residentDetailPhoneRow}>
                    <DetailRow
                      label="Phone Number"
                      labelWidth={100}
                      value={residentPhone}
                      valueWidth={85}
                    />
                  </View>
                  <View style={styles.residentDetailEmailRow}>
                    <DetailRow
                      label="Email Address"
                      labelWidth={95}
                      value={residentEmail}
                      valueAlign="left"
                      valueWidth={128}
                    />
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {shouldShowProfileImage && residentProfilePictureSource ? (
        <View pointerEvents="none" style={styles.expandedProfilePreloadSlot}>
          <Image
            onError={() => setProfileImageFailed(true)}
            source={residentProfilePictureSource}
            style={styles.expandedProfilePreloadImage}
          />
        </View>
      ) : null}

      {pictureOpen ? (
        <Modal
          visible
          transparent
          animationType="fade"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setPictureOpen(false)}
        >
          <Pressable
            accessibilityLabel="Close expanded picture"
            onPress={() => setPictureOpen(false)}
            style={[styles.pictureOverlayBackdrop, { paddingTop: securityLayout.scaleValue(263) }]}
          >
            <View
              style={[
                styles.expandedPictureFrame,
                {
                  height: securityLayout.scaleValue(287),
                  width: securityLayout.scaleValue(287),
                },
              ]}
            >
              {shouldShowProfileImage && residentProfilePictureSource ? (
                <Image
                  onError={() => setProfileImageFailed(true)}
                  source={residentProfilePictureSource}
                  style={[
                    styles.expandedProfileImage,
                    {
                      borderRadius: securityLayout.scaleValue(143.5),
                      height: securityLayout.scaleValue(287),
                      width: securityLayout.scaleValue(287),
                    },
                  ]}
                />
              ) : (
                <ProfileExpandedOverlay
                  width={securityLayout.scaleValue(287)}
                  height={securityLayout.scaleValue(287)}
                />
              )}
            </View>

            <View style={{ height: securityLayout.scaleValue(47) }} />

            <Pressable
              accessibilityLabel="Close expanded picture"
              onPress={() => setPictureOpen(false)}
              style={({ pressed }) => [
                styles.overlayCloseButton,
                { height: securityLayout.scaleValue(32), width: securityLayout.scaleValue(32) },
                pressed && styles.pressed,
              ]}
            >
              <ProfileOverlayClose
                width={securityLayout.scaleValue(32)}
                height={securityLayout.scaleValue(32)}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F8F7',
    paddingTop: 0,
  },
  backButtonSlot: {
    left: 17,
    position: 'absolute',
    top: 88,
    zIndex: 2,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#EFF1F1',
    borderRadius: 10000,
    flexDirection: 'row',
    gap: 4,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  scrollContent: {
    paddingBottom: 34,
    paddingTop: 134,
  },
  resultScrollView: {
    height: '100%',
    width: '100%',
  },
  guestScrollContent: {
    minHeight: Platform.OS === 'android' ? 840 : undefined,
    paddingBottom: Platform.OS === 'android' ? 120 : 16,
    paddingTop: 134,
  },
  residentScrollContent: {
    paddingBottom: 140,
    paddingTop: 137,
  },
  profileEllipse: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    elevation: 3,
    height: 50,
    justifyContent: 'center',
    marginLeft: 163,
    position: 'relative',
    width: 50,
    zIndex: 3,
  },
  profileInitialsBadge: {
    alignItems: 'center',
    backgroundColor: '#F4FFFE',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 50,
  },
  profileInitialsText: {
    color: '#167A6F',
    fontFamily: 'UbuntuSans-Regular',
    fontSize: 24,
    height: Platform.OS === 'ios' ? 50 : 29,
    includeFontPadding: Platform.OS === 'android' ? false : undefined,
    left: Platform.OS === 'ios' ? 0 : 10,
    letterSpacing: -0.24,
    lineHeight: Platform.OS === 'ios' ? 50 : 29,
    position: 'absolute',
    textAlign: 'center',
    textAlignVertical: 'center',
    top: Platform.OS === 'ios' ? 0 : 10,
    width: Platform.OS === 'ios' ? 50 : 30,
  },
  fallbackProfileIcon: {
    height: 50,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 50,
  },
  fallbackProfileInnerGroup: {
    left: 4.17,
    position: 'absolute',
    top: 4.17,
  },
  fallbackProfileInnerVector: {
    left: 16.67,
    position: 'absolute',
    top: 12.5,
  },
  residentProfileEllipse: {
    padding: 4,
    overflow: 'hidden',
  },
  residentProfileImage: {
    borderRadius: 21,
    height: 42,
    width: 42,
  },
  profileTapTarget: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  eyebrow: {
    color: '#F46036',
    fontFamily: 'Inter_18pt-SemiBold',
    fontSize: 12,
    letterSpacing: 0,
    textAlign: 'center',
  },
  title: {
    color: '#113E55',
    fontFamily: 'UbuntuSans-SemiBold',
    fontSize: 28,
    lineHeight: 34,
    marginTop: 8,
    textAlign: 'center',
  },
  codeCard: {
    alignItems: 'center',
    borderRadius: 24,
    height: 114,
    marginLeft: 42,
    marginBottom: 24,
    marginTop: -20,
    alignSelf: 'flex-start',
    width: 291,
    zIndex: 1,
  },
  accessCodeFrame: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 114,
    justifyContent: 'center',
    paddingBottom: 8,
    paddingHorizontal: 45,
    paddingTop: 30,
    width: 291,
  },
  residentAccessCodeFrame: {
    paddingTop: 30,
  },
  accessCodeLabel: {
    color: '#F46036',
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 11.2,
    height: 14,
    lineHeight: 14,
    marginBottom: 10,
    textAlign: 'center',
    width: 201,
  },
  accessCodeValue: {
    color: '#113E55',
    fontFamily: 'UbuntuSans-SemiBold',
    fontSize: 47.78,
    height: 52,
    letterSpacing: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    width: 201,
  },
  guestDetailsGroup: {
    alignSelf: 'center',
    height: 170,
    width: 335,
  },
  guestDetailsCard: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 16,
    borderWidth: 0,
    height: 170,
    paddingHorizontal: 0,
    paddingTop: 13,
    width: 335,
  },
  guestSectionDivider: {
    backgroundColor: '#167A6F',
    height: 0.5,
    left: 17,
    position: 'absolute',
    top: 19.5,
    width: 300.5,
  },
  residentSectionDivider: {
    backgroundColor: '#F46036',
    height: 0.5,
    left: 17,
    position: 'absolute',
    top: 19.5,
    width: 300.5,
  },
  residentDetailsGroup: {
    alignSelf: 'center',
    height: 262,
    marginTop: 24,
    width: 335,
  },
  residentDetailsCard: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 16,
    borderWidth: 0,
    height: 262,
    paddingHorizontal: 16,
    paddingTop: 13,
    width: 335,
  },
  residentOnlyGroup: {
    marginLeft: 2,
    marginTop: 24,
  },
  residentCodeCard: {
    marginLeft: 42,
  },
  sectionHeading: {
    alignItems: 'center',
    backgroundColor: '#F6F8F7',
    flexDirection: 'row',
    gap: 10,
    height: 34,
    justifyContent: 'center',
    left: 119,
    padding: 10,
    position: 'absolute',
    top: 0,
    width: 91,
  },
  residentSectionHeading: {
    backgroundColor: '#F6F7F7',
    left: 114.5,
    width: 106,
  },
  sectionLine: {
    backgroundColor: 'rgba(27, 153, 139, 0.45)',
    display: 'none',
    height: 0.5,
    width: 0,
  },
  guestDetailsTitle: {
    color: '#167A6F',
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 11.2,
    height: 14,
    lineHeight: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    width: 71,
  },
  residentSectionLine: {
    backgroundColor: 'rgba(244, 96, 54, 0.45)',
  },
  residentDetailsTitle: {
    color: '#F46036',
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 11.2,
    height: 14,
    lineHeight: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    width: 86,
  },
  detailList: {
    ...StyleSheet.absoluteFillObject,
  },
  guestDetailNameRow: {
    left: 0,
    position: 'absolute',
    top: 37,
  },
  guestDetailGenderRow: {
    left: 0,
    position: 'absolute',
    top: 83,
  },
  guestDetailRelationshipRow: {
    left: 0,
    position: 'absolute',
    top: 129,
  },
  residentDetailList: {
    ...StyleSheet.absoluteFillObject,
  },
  residentDetailNameRow: {
    left: 0,
    position: 'absolute',
    top: 37,
  },
  residentDetailAddressRow: {
    left: 0,
    position: 'absolute',
    top: 83,
  },
  residentDetailHouseholdRow: {
    left: 0,
    position: 'absolute',
    top: 129,
  },
  residentDetailPhoneRow: {
    left: 0,
    position: 'absolute',
    top: 175,
  },
  residentDetailEmailRow: {
    left: 0,
    position: 'absolute',
    top: 221,
  },
  detailPill: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 1,
    height: 41,
    justifyContent: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#113E55',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    width: 335,
  },
  detailContentFrame: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 17,
    justifyContent: 'space-between',
    width: 303,
  },
  detailLabel: {
    color: '#878686',
    fontFamily: 'Inter_18pt-Medium',
    fontSize: 14,
    lineHeight: 14,
  },
  detailLabelSlot: {
    height: 17,
    justifyContent: 'center',
  },
  detailValue: {
    color: '#878686',
    fontFamily: 'Inter_18pt-Light',
    fontSize: 14,
    lineHeight: 14,
    paddingTop: 1,
    textAlign: 'right',
    textAlignVertical: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
  pictureOverlayBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    flex: 1,
    paddingTop: 263,
  },
  expandedPictureFrame: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 10000,
    borderWidth: 4,
    height: 287,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 287,
  },
  expandedProfileImage: {
    resizeMode: 'cover',
  },
  expandedProfilePreloadSlot: {
    height: 1,
    left: -1000,
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: -1000,
    width: 1,
  },
  expandedProfilePreloadImage: {
    height: 287,
    width: 287,
  },
  pictureCloseSpacer: {
    height: 47,
  },
  overlayCloseButton: {
    alignItems: 'center',
    borderRadius: 10000,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});
