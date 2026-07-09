import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import ValidationBack from '@/src/assets/icons/validation-back.svg';
import ValidationCodeFrame from '@/src/assets/icons/validation-code-frame.svg';
import ValidationGuestDetails from '@/src/assets/icons/validation-guest-details.svg';
import ProfileExpandedOverlay from '@/src/assets/icons/profile-expanded-overlay.svg';
import ProfileOverlayClose from '@/src/assets/icons/profile-overlay-close.svg';
import ValidationProfileInitials from '@/src/assets/icons/validation-profile-initials.svg';
import ValidationProfileEllipse from '@/src/assets/icons/validation-profile-ellipse.svg';
import ValidationResidentCodeFrame from '@/src/assets/icons/validation-resident-code-frame.svg';
import ValidationResidentDetails from '@/src/assets/icons/validation-resident-details.svg';
import ValidationResidentOnlyDetails from '@/src/assets/icons/validation-resident-only-details.svg';
import ValidationResidentProfile from '@/src/assets/icons/validation-resident-profile.svg';
import { sharedStyles } from '@/src/theme/styles';

export default function ValidationResult() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [pictureOpen, setPictureOpen] = useState(false);

  const receiver = String(params.receiver || '');
  const isResidentCode = receiver === 'resident';

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
      <Pressable
        accessibilityLabel="Go back"
        onPress={handleBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <ValidationBack width={30} height={30} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, !isResidentCode && styles.guestScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileEllipse, isResidentCode && styles.residentProfileEllipse]}>
          {isResidentCode ? (
            <ValidationResidentProfile width={50} height={50} />
          ) : (
            <>
              <ValidationProfileEllipse width={50} height={50} style={styles.profileEllipseSvg} />
              <ValidationProfileInitials width={27} height={18} style={styles.profileInitials} />
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
            <ValidationGuestDetails width={335} height={167} />
          </View>
        ) : null}

        <View style={[styles.residentDetailsGroup, isResidentCode && styles.residentOnlyGroup]}>
          {isResidentCode ? (
            <ValidationResidentOnlyDetails width={335} height={259} />
          ) : (
            <ValidationResidentDetails width={335} height={259} />
          )}
        </View>
      </ScrollView>

      {pictureOpen ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setPictureOpen(false)}
        >
          <View style={styles.pictureOverlayBackdrop}>
            <View style={styles.expandedPictureFrame}>
              <ProfileExpandedOverlay width={287} height={287} />
            </View>
            <Pressable
              accessibilityLabel="Close expanded picture"
              onPress={() => setPictureOpen(false)}
              style={({ pressed }) => [styles.overlayCloseButton, pressed && styles.pressed]}
            >
              <ProfileOverlayClose width={32} height={32} />
            </Pressable>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#EFF1F1',
    borderRadius: 10000,
    flexDirection: 'row',
    gap: 4,
    height: 30,
    justifyContent: 'center',
    left: 17,
    position: 'absolute',
    top: 112,
    width: 30,
    zIndex: 2,
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
    height: 18,
    left: 11.5,
    position: 'absolute',
    top: 16,
    width: 27,
  },
  residentProfileEllipse: {
    transform: [{ translateY: 3 }],
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
    height: 167,
    width: 335,
  },
  residentDetailsGroup: {
    alignSelf: 'center',
    height: 259,
    marginTop: 24,
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
    height: 29,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    shadowColor: '#113E55',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    width: 303,
  },
  detailLabel: {
    color: '#113E55',
    fontFamily: 'UbuntuSans-Medium',
    fontSize: 10,
    lineHeight: 12,
  },
  detailValue: {
    color: 'rgba(17, 62, 85, 0.58)',
    fontFamily: 'UbuntuSans-Medium',
    fontSize: 10,
    lineHeight: 12,
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
    width: 287,
  },
  overlayCloseButton: {
    alignItems: 'center',
    borderRadius: 10000,
    height: 32,
    justifyContent: 'center',
    marginTop: 47,
    width: 32,
  },
});
