import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import ValidationBack from '@/src/assets/icons/validation-back.svg';
import ValidationCodeFrame from '@/src/assets/icons/validation-code-frame.svg';
import ProfileExpandedOverlay from '@/src/assets/icons/profile-expanded-overlay.svg';
import ProfileOverlayClose from '@/src/assets/icons/profile-overlay-close.svg';
import ValidationProfileInitials from '@/src/assets/icons/validation-profile-initials.svg';
import ValidationProfileEllipse from '@/src/assets/icons/validation-profile-ellipse.svg';
import ValidationResidentCodeFrame from '@/src/assets/icons/validation-resident-code-frame.svg';
import ValidationResidentProfile from '@/src/assets/icons/validation-resident-profile.svg';
import { sharedStyles } from '@/src/theme/styles';
import { useSecurityResponsiveLayout } from '@/src/lib/securityResponsive';
import { useAuthStore } from '@/src/lib/stores/authStore';

const getParam = (value: string | string[] | undefined, fallback = 'N/A') => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue && rawValue.trim() ? rawValue : fallback;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailPill}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

export default function ValidationResult() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const securityLayout = useSecurityResponsiveLayout();
  const [pictureOpen, setPictureOpen] = useState(false);
  const accessToken = useAuthStore((state) => state.access_token);

  const receiver = String(params.receiver || '');
  const isResidentCode = receiver === 'resident';
  const guestName = getParam(params.visitor_fullname);
  const relationship = getParam(params.relationship_with_resident);
  const guestGender = getParam(params.gender);
  const residentName = getParam(params.resident_name);
  const residentAddress = getParam(params.resident_address);
  const residentHousehold = getParam(params.resident_household);
  const residentEmail = getParam(params.resident_email);
  const residentPhone = getParam(params.resident_phone_number);
  const residentProfilePictureUrl = getParam(params.resident_profile_picture_url, '');
  const residentProfilePictureSource = residentProfilePictureUrl
    ? {
        uri: residentProfilePictureUrl,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      }
    : null;

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
          <View style={styles.backButtonSlot}>
            <View style={styles.backButtonSpacer} />
            <Pressable
              accessibilityLabel="Go back"
              onPress={handleBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <ValidationBack width={30} height={30} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              !isResidentCode && styles.guestScrollContent,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.profileEllipse, isResidentCode && styles.residentProfileEllipse]}>
              {isResidentCode ? (
                residentProfilePictureSource ? (
                  <Image
                    source={residentProfilePictureSource}
                    style={styles.residentProfileImage}
                  />
                ) : (
                  <ValidationResidentProfile width={50} height={50} />
                )
              ) : (
                <>
                  <ValidationProfileEllipse
                    width={50}
                    height={50}
                    style={styles.profileEllipseSvg}
                  />
                  <ValidationProfileInitials
                    width={30}
                    height={29}
                    style={styles.profileInitials}
                  />
                </>
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
              {isResidentCode ? (
                <ValidationResidentCodeFrame width={291} height={114} />
              ) : (
                <ValidationCodeFrame width={291} height={114} />
              )}
            </View>

            {!isResidentCode ? (
              <View style={styles.guestDetailsGroup}>
                <View style={styles.guestDetailsCard}>
                  <View style={styles.sectionHeading}>
                    <View style={styles.sectionLine} />
                    <Text style={styles.guestDetailsTitle}>Guest Details</Text>
                    <View style={styles.sectionLine} />
                  </View>
                  <View style={styles.detailList}>
                    <DetailRow label="Full Name" value={guestName} />
                    <DetailRow label="Gender" value={guestGender} />
                    <DetailRow label="Relationship" value={relationship} />
                  </View>
                </View>
              </View>
            ) : null}

            <View style={[styles.residentDetailsGroup, isResidentCode && styles.residentOnlyGroup]}>
              <View style={styles.residentDetailsCard}>
                <View style={styles.sectionHeading}>
                  <View style={[styles.sectionLine, styles.residentSectionLine]} />
                  <Text style={styles.residentDetailsTitle}>Resident Details</Text>
                  <View style={[styles.sectionLine, styles.residentSectionLine]} />
                </View>
                <View style={styles.residentDetailList}>
                  <DetailRow label="Full Name" value={residentName} />
                  <DetailRow label="Address" value={residentAddress} />
                  <DetailRow label="Household" value={residentHousehold} />
                  <DetailRow label="Phone" value={residentPhone} />
                  <DetailRow label="Email Address" value={residentEmail} />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

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
              {residentProfilePictureSource ? (
                <Image
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
    paddingTop: 0,
  },
  backButtonSlot: {
    left: 17,
    position: 'absolute',
    top: 88,
    zIndex: 2,
  },
  backButtonSpacer: {
    height: 24,
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
  guestScrollContent: {
    paddingBottom: 16,
    paddingTop: 106,
  },
  profileEllipse: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 25,
    elevation: 3,
    height: 50,
    justifyContent: 'center',
    marginLeft: 157,
    position: 'relative',
    width: 50,
    zIndex: 3,
  },
  profileEllipseSvg: {
    height: 50,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 50,
  },
  profileInitials: {
    height: 29,
    left: 10,
    position: 'absolute',
    top: 10,
    width: 30,
  },
  residentProfileEllipse: {
    overflow: 'hidden',
    transform: [{ translateY: 3 }],
  },
  residentProfileImage: {
    borderRadius: 25,
    height: 50,
    width: 50,
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
    marginLeft: 36.5,
    marginBottom: 24,
    marginTop: -20,
    alignSelf: 'flex-start',
    width: 291,
    zIndex: 1,
  },
  codeLabel: {
    color: '#F46036',
    fontFamily: 'Inter_18pt-Medium',
    fontSize: 9,
    lineHeight: 11,
  },
  codeValue: {
    color: '#113E55',
    fontFamily: 'UbuntuSans-SemiBold',
    fontSize: 38,
    lineHeight: 44,
  },
  guestDetailsGroup: {
    alignSelf: 'center',
    height: 170,
    width: 335,
  },
  guestDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'transparent',
    borderRadius: 16,
    borderWidth: 0.5,
    height: 170,
    paddingHorizontal: 16,
    paddingTop: 13,
    width: 335,
  },
  residentDetailsGroup: {
    alignSelf: 'center',
    height: 262,
    marginTop: 24,
    width: 335,
  },
  residentDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'transparent',
    borderRadius: 16,
    borderWidth: 0.5,
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
    marginLeft: 36.5,
    transform: [{ translateY: 3 }],
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    height: 14,
    justifyContent: 'center',
  },
  sectionLine: {
    backgroundColor: 'rgba(27, 153, 139, 0.45)',
    height: 0.5,
    width: 86,
  },
  guestDetailsTitle: {
    color: '#1B998B',
    fontFamily: 'UbuntuSans-SemiBold',
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    width: 86,
  },
  residentSectionLine: {
    backgroundColor: 'rgba(244, 96, 54, 0.45)',
  },
  residentDetailsTitle: {
    color: '#F46036',
    fontFamily: 'UbuntuSans-SemiBold',
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    width: 94,
  },
  detailList: {
    gap: 7,
    marginTop: 12,
  },
  residentDetailList: {
    gap: 7,
    marginTop: 12,
  },
  detailPill: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 1,
    flexDirection: 'row',
    height: 34,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: '#113E55',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    width: 315,
  },
  detailLabel: {
    color: '#113E55',
    fontFamily: 'UbuntuSans-Regular',
    fontSize: 12,
    lineHeight: 15,
  },
  detailValue: {
    color: 'rgba(17, 62, 85, 0.58)',
    flex: 1,
    fontFamily: 'UbuntuSans-Regular',
    fontSize: 12,
    lineHeight: 15,
    marginLeft: 12,
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.78,
  },
  pictureOverlayBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 31, 41, 0.18)',
    flex: 1,
    paddingTop: 263,
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
    resizeMode: 'cover',
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
