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
import Svg, { Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import KeyboardArrowLeft from '@/src/assets/icons/keyboard-arrow-left.svg';
import ProfileExpandedOverlay from '@/src/assets/icons/profile-expanded-overlay.svg';
import ProfileOverlayClose from '@/src/assets/icons/profile-overlay-close.svg';
import ResidentProfileHead from '@/src/assets/icons/resident-profile-head.svg';
import ResidentProfileOutline from '@/src/assets/icons/resident-profile-outline.svg';
import { sharedStyles } from '@/src/theme/styles';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { getUserDocumentViewUri } from '@/src/lib/api/userDocuments';
import { MaterialIcons } from '@expo/vector-icons';

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

const resultHeaderTopGap = 24.14;

function ResidentInitialsBadge({
  initials,
  useFallbackIcon,
}: {
  initials: string;
  useFallbackIcon: boolean;
}) {
  return (
    <View style={[styles.profileInitialsBadge, useFallbackIcon && styles.fallbackProfileBadge]}>
      {useFallbackIcon ? (
        <>
          <ResidentProfileOutline
            width={41.67}
            height={41.67}
            style={styles.fallbackProfileOutline}
          />
          <ResidentProfileHead width={16.67} height={16.67} style={styles.fallbackProfileHead} />
        </>
      ) : (
        <View style={styles.profileInitialsTextFrame}>
          <Svg width={50} height={50} style={styles.profileInitialsSvg}>
            <SvgText
              alignmentBaseline="middle"
              fill="#167A6F"
              fontFamily="UbuntuSans-Regular"
              fontSize={24}
              letterSpacing={-0.24}
              textAnchor="middle"
              x={25}
              y={25}
            >
              {initials}
            </SvgText>
          </Svg>
        </View>
      )}
    </View>
  );
}

function AccessCodeCard({ code, isResidentCode }: { code: string; isResidentCode: boolean }) {
  return (
    <View style={[styles.accessCodeFrame, isResidentCode && styles.residentAccessCodeFrame]}>
      <Text allowFontScaling={false} numberOfLines={1} style={styles.accessCodeLabel}>
        Access Code
      </Text>
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
  valueAlign = 'right',
}: {
  label: string;
  labelWidth: number;
  value: string;
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
        <View style={styles.detailValueSlot}>
          <Text
            allowFontScaling={false}
            ellipsizeMode="tail"
            numberOfLines={1}
            style={[styles.detailValue, { textAlign: valueAlign }]}
          >
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ValidationResult() {
  const params = useLocalSearchParams();
  const router = useRouter();
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
    <SafeAreaView
      className="relative flex-1 bg-[#F6F7F7]"

    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isResidentCode ? styles.residentScrollContent : styles.guestScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
        className="h-full w-full"
      >
        <View
          className="relative self-center"
          style={[{ width: '100%' }, isResidentCode ? styles.residentCanvas : styles.guestCanvas]}
        >
           <Pressable onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
          </Pressable>

          <View style={styles.resultContent}>
            <View style={styles.accessBlock}>
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

              <View style={styles.codeCard}>
                <AccessCodeCard code={validatedCode} isResidentCode={isResidentCode} />
              </View>
            </View>

            {!isResidentCode ? (
              <View style={styles.guestDetailsGroup}>
                <View style={styles.guestDetailsCard}>
                  <View style={styles.guestSectionDivider} />
                  <View style={styles.sectionHeadingRow}>
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
                  </View>
                  <View style={styles.detailList}>
                    <View style={styles.guestDetailNameRow}>
                      <DetailRow label="Name" labelWidth={40} value={guestName} />
                    </View>
                    <View style={styles.guestDetailGenderRow}>
                      <DetailRow label="Gender" labelWidth={50} value={guestGender} />
                    </View>
                    <View style={styles.guestDetailRelationshipRow}>
                      <DetailRow label="Relationship" labelWidth={83} value={relationship} />
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={[styles.residentDetailsGroup, isResidentCode && styles.residentOnlyGroup]}>
              <View style={styles.residentDetailsCard}>
                <View style={styles.residentSectionDivider} />
                <View style={styles.sectionHeadingRow}>
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
                </View>
                <View style={styles.residentDetailList}>
                  <View style={styles.residentDetailNameRow}>
                    <DetailRow label="Name" labelWidth={40} value={residentName} />
                  </View>
                  <View style={styles.residentDetailAddressRow}>
                    <DetailRow label="Address" labelWidth={56} value={residentAddress} />
                  </View>
                  <View style={styles.residentDetailHouseholdRow}>
                    <DetailRow label="Household" labelWidth={72} value={residentHousehold} />
                  </View>
                  <View style={styles.residentDetailPhoneRow}>
                    <DetailRow label="Phone Number" labelWidth={100} value={residentPhone} />
                  </View>
                  <View style={styles.residentDetailEmailRow}>
                    <DetailRow label="Email Address" labelWidth={95} value={residentEmail} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {shouldShowProfileImage && residentProfilePictureSource ? (
        <View pointerEvents="none" style={styles.expandedProfilePreloadSlot}>
          <Image source={residentProfilePictureSource} style={styles.expandedProfilePreloadImage} />
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
            style={styles.pictureOverlayBackdrop}
          >
            <View style={styles.pictureOverlayCanvas}>
              <View style={styles.expandedPictureFrame}>
                {shouldShowProfileImage && residentProfilePictureSource ? (
                  <Image
                    key={activeResidentProfilePictureUrl}
                    onError={() => setProfileImageFailed(true)}
                    onLoad={() => setProfileImageFailed(false)}
                    source={residentProfilePictureSource}
                    style={styles.expandedProfileImage}
                  />
                ) : (
                  <ProfileExpandedOverlay width={287} height={287} />
                )}
              </View>

              <View style={{ height: 47 }} />

              <Pressable
                accessibilityLabel="Close expanded picture"
                onPress={() => setPictureOpen(false)}
                style={({ pressed }) => [styles.overlayCloseButton, pressed && styles.pressed]}
              >
                <ProfileOverlayClose width={32} height={32} />
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F7F7',
    paddingTop: 0,
  },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 30,
    marginTop: resultHeaderTopGap,
    paddingLeft: 17,
  },
  resultContent: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  accessBlock: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#EFF1F1',
    borderRadius: 10000,
    height: 30,
    justifyContent: 'center',
    marginLeft: 17,
    marginTop: 44,
    width: 30,
  },
  backButtonIconFrame: {
    height: 24,
    left: 0,
    position: 'absolute',
    top: 3,
    width: 28,
  },
  backButtonVector: {
    left: 9.2,
    position: 'absolute',
    top: 6,
  },
  scrollContent: {
    alignItems: 'stretch',
    paddingBottom: 34,
    paddingHorizontal: 0,
  },
  guestScrollContent: {
    minHeight: Platform.OS === 'android' ? 840 : undefined,
    paddingBottom: Platform.OS === 'android' ? 120 : 16,
  },
  residentScrollContent: {
    paddingBottom: 140,
  },
  guestCanvas: {
    minHeight: Platform.OS === 'android' ? 840 : 760,
    width: '100%',
  },
  residentCanvas: {
    minHeight: 900,
    width: '100%',
  },
  profileEllipse: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
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
  fallbackProfileBadge: {
    backgroundColor: '#537B85',
  },
  fallbackProfileOutline: {
    left: 4.17,
    position: 'absolute',
    top: 4.17,
  },
  fallbackProfileHead: {
    left: 16.67,
    position: 'absolute',
    top: 12.5,
  },
  profileInitialsTextFrame: {
    height: 29,
    left: 10,
    overflow: 'visible',
    position: 'absolute',
    top: 10,
    width: 30,
  },
  profileInitialsSvg: {
    left: -10,
    position: 'absolute',
    top: -10,
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
  codeCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 24,
    height: 114,
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: -20,
    paddingHorizontal: 22,
    width: '100%',
    zIndex: 1,
  },
  accessCodeFrame: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 114,
    justifyContent: 'center',
    paddingBottom: 8,
    paddingTop: 30,
    width: '100%',
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
    textAlignVertical: 'center',
    width: 201,
  },
  accessCodeValue: {
    color: '#113E55',
    fontFamily: 'UbuntuSans-SemiBold',
    fontWeight: '600',
    fontSize: 47.78,
    height: 52,
    letterSpacing: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    width: 201,
  },
  guestDetailsGroup: {
    alignSelf: 'stretch',
    height: 170,
    width: '100%',
  },
  guestDetailsCard: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 16,
    borderWidth: 0,
    height: 170,
    paddingHorizontal: 0,
    paddingTop: 13,
    width: '100%',
  },
  guestSectionDivider: {
    backgroundColor: '#167A6F',
    height: 0.5,
    left: 17,
    position: 'absolute',
    right: 17,
    top: 19.5,
  },
  residentSectionDivider: {
    backgroundColor: '#F46036',
    height: 0.5,
    left: 17,
    position: 'absolute',
    right: 17,
    top: 19.5,
  },
  residentDetailsGroup: {
    alignSelf: 'stretch',
    height: 262,
    marginTop: 24,
    width: '100%',
  },
  residentDetailsCard: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 16,
    borderWidth: 0,
    height: 262,
    paddingHorizontal: 0,
    paddingTop: 13,
    width: '100%',
  },
  residentOnlyGroup: {
    marginTop: -1,
  },
  sectionHeading: {
    alignItems: 'center',
    backgroundColor: '#F6F7F7',
    flexDirection: 'row',
    gap: 10,
    height: 34,
    justifyContent: 'center',
    padding: 10,
    position: 'absolute',
    top: 0,
    width: 91,
  },
  sectionHeadingRow: {
    alignItems: 'center',
    left: 17,
    position: 'absolute',
    right: 17,
    top: 0,
  },
  residentSectionHeading: {
    backgroundColor: '#F6F7F7',
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
    right: 0,
    top: 37,
  },
  guestDetailGenderRow: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 83,
  },
  guestDetailRelationshipRow: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 129,
  },
  residentDetailList: {
    ...StyleSheet.absoluteFillObject,
  },
  residentDetailNameRow: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 37,
  },
  residentDetailAddressRow: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 83,
  },
  residentDetailHouseholdRow: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 129,
  },
  residentDetailPhoneRow: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 175,
  },
  residentDetailEmailRow: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 221,
  },
  detailPill: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 41,
    justifyContent: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: '100%',
  },
  detailContentFrame: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 17,
    justifyContent: 'space-between',
    width: '100%',
  },
  detailLabel: {
    color: '#878686',
    fontFamily: 'Inter_18pt-Medium',
    fontSize: 14,
    height: 17,
    lineHeight: 17,
    textAlignVertical: 'center',
  },
  detailLabelSlot: {
    height: 17,
    justifyContent: 'center',
  },
  detailValue: {
    color: '#878686',
    fontFamily: 'Inter_18pt-Light',
    fontSize: 14,
    height: 17,
    lineHeight: 17,
    textAlignVertical: 'center',
  },
  detailValueSlot: {
    flex: 1,
    height: 17,
    justifyContent: 'center',
    marginLeft: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  pressed: {
    opacity: 0.78,
  },
  pictureOverlayBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    flex: 1,
  },
  pictureOverlayCanvas: {
    alignItems: 'center',
    paddingTop: 263,
    width: '100%',
  },
  expandedPictureFrame: {
    alignItems: 'center',
    borderRadius: 10000,
    height: 287,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 287,
  },
  expandedProfileImage: {
    borderRadius: 10000,
    height: 287,
    resizeMode: 'cover',
    width: 287,
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
  overlayCloseButton: {
    alignItems: 'center',
    borderRadius: 10000,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});
