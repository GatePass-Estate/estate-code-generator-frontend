import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { sharedStyles } from '@/src/theme/styles';
import { ReceiverType } from '@/src/types/codes';
import { GenderType } from '@/src/types/general';

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailPill}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '-'}</Text>
    </View>
  );
}

export default function ValidationResult() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [pictureOpen, setPictureOpen] = useState(false);

  const code = String(params.code || '');
  const residentName = String(params.resident_name || '');
  const residentAddress = String(params.resident_address || '');
  const residentEmail = String(params.resident_email || '');
  const residentPhoneNumber = String(params.resident_phone_number || '');
  const household = String(params.household || 'Olaburaku');
  const receiver = params.receiver as ReceiverType;
  const visitorFullname = String(params.visitor_fullname || '');
  const gender = params.gender as GenderType;
  const relationshipWithResident = String(params.relationship_with_resident || '');
  const isResidentCode = receiver === 'resident';

  const formattedGender = gender
    ? String(gender)
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
        .join(' ')
    : '';

  const initials = useMemo(() => {
    const parts = residentName.trim().split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }, [residentName]);

  return (
    <SafeAreaView style={[sharedStyles.container, styles.container]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Pressable
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Icon name="chevron-back" size={18} color="#113E55" />
      </Pressable>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileEllipse, isResidentCode && styles.residentProfileEllipse]}>
          {isResidentCode ? (
            <Icon name="person-circle-outline" size={36} color="#5D7F87" />
          ) : (
            <Text style={styles.profileInitials}>{initials || 'SH'}</Text>
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
          <Text style={styles.codeLabel}>Access Code</Text>
          <Text style={styles.codeValue}>
            {code.slice(0, 3)} {code.slice(3)}
          </Text>
        </View>

        {!isResidentCode ? (
          <View style={styles.guestDetailsGroup}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionLine} />
              <Text style={styles.guestDetailsTitle}>Guest Details</Text>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.detailList}>
              <DetailPill label="Name" value={visitorFullname} />
              <DetailPill label="Gender" value={formattedGender} />
              <DetailPill label="Relationship" value={relationshipWithResident} />
            </View>
          </View>
        ) : null}

        <View style={[styles.residentDetailsGroup, isResidentCode && styles.residentOnlyGroup]}>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionLine, styles.residentSectionLine]} />
            <Text style={styles.residentDetailsTitle}>Resident Details</Text>
            <View style={[styles.sectionLine, styles.residentSectionLine]} />
          </View>

          <View style={styles.residentDetailList}>
            <DetailPill label="Name" value={residentName} />
            <DetailPill label="Address" value={residentAddress} />
            <DetailPill label="Household" value={household} />
            <DetailPill label="Phone Number" value={residentPhoneNumber} />
            <DetailPill label="Email Address" value={residentEmail} />
          </View>
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
              <Icon name="person-circle-outline" size={204} color="#FFFFFF" />
            </View>
            <Pressable
              accessibilityLabel="Close expanded picture"
              onPress={() => setPictureOpen(false)}
              style={({ pressed }) => [styles.overlayCloseButton, pressed && styles.pressed]}
            >
              <Icon name="close" size={22} color="#FFFFFF" />
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
    paddingTop: 64,
  },
  profileEllipse: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#F4FFFE',
    borderRadius: 25,
    elevation: 3,
    height: 50,
    justifyContent: 'center',
    position: 'relative',
    width: 50,
    zIndex: 3,
  },
  profileInitials: {
    color: '#1B998B',
    fontFamily: 'UbuntuSans-Regular',
    fontSize: 24,
    height: 34,
    lineHeight: 30,
    textAlign: 'center',
    width: 42,
  },
  residentProfileEllipse: {
    backgroundColor: '#FFFFFF',
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
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    gap: 10,
    height: 114,
    marginBottom: 24,
    marginTop: -20,
    paddingBottom: 8,
    paddingHorizontal: 45,
    paddingTop: 30,
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
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(27, 153, 139, 0.08)',
    borderWidth: 0.5,
    height: 167,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: 335,
  },
  residentDetailsGroup: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(244, 96, 54, 0.08)',
    borderWidth: 0.5,
    height: 259,
    marginTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: 335,
  },
  residentOnlyGroup: {
    marginTop: 24,
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
    backgroundColor: '#0A1F29',
    borderRadius: 10000,
    height: 287,
    justifyContent: 'center',
    width: 287,
  },
  overlayCloseButton: {
    alignItems: 'center',
    backgroundColor: '#0A1F29',
    borderRadius: 10000,
    height: 44,
    justifyContent: 'center',
    marginTop: 28,
    width: 44,
  },
});
