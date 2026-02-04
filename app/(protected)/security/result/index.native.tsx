import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import { variantStyles } from '@/src/components/web/AccessCodeCard';
import { SingleDetail } from '@/src/components/mobile/SIngleDetail';
import { GenderType } from '@/src/types/general';

export default function ValidationResult() {
	let params = useLocalSearchParams();
	const code = String(params.code || '');
	const visitor_fullname = String(params.visitor_fullname || '');
	const gender = params.gender as GenderType;
	const relationship_with_resident = String(params.relationship_with_resident || '');
	const resident_name = String(params.resident_name || '');
	const resident_address = String(params.resident_address || '');
	const resident_email = String(params.resident_email || '');
	const resident_phone_number = String(params.resident_phone_number || '');

	const styles = variantStyles[gender!];

	const formattedGender = gender
		? String(gender)
				.replace(/_/g, ' ')
				.split(' ')
				.map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
				.join(' ')
		: '';

	return (
		<SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
			<Stack.Screen options={{ headerShown: false }} />
			<Back type="short-arrow" />

			<ScrollView contentContainerClassName="px-2 pt-16 pb-10" showsVerticalScrollIndicator={false}>
				<Text className="text-center text-orange-500 font-inter-semibold text-sm text-tertiary">SECURITY CODE</Text>
				<Text className="text-center text-7xl font-ubuntu-semibold text-teal-900 mt-2 mb-6 text-primary">
					{code.slice(0, 3)} {code.slice(3)}{' '}
				</Text>

				<Text className={`text-sm font-inter-semibold mb-3 mt-5 ${styles.text}`}>GUEST DETAILS</Text>
				<View className={`bg-orange-50 p-4 rounded-xl border border-orange-200 mb-6 ${styles.container}`}>
					<SingleDetail label="Name" value={visitor_fullname ? visitor_fullname.charAt(0).toUpperCase() + visitor_fullname.slice(1) : ''} />
					<SingleDetail label="Gender" value={formattedGender} />
					<SingleDetail label="Relationship" value={relationship_with_resident ? relationship_with_resident.charAt(0).toUpperCase() + relationship_with_resident.slice(1) : ''} />
				</View>

				<Text className="text-sm font-inter-semibold mb-3 text-teal">RESIDENT DETAILS</Text>
				<View className={`bg-teal-50 p-4 rounded-xl bg-light-teal border-teal/80 border-[0.5px]`}>
					<SingleDetail label="Name" value={resident_name} />
					<SingleDetail label="Address" value={resident_address} />
					<SingleDetail label="Email Address" value={resident_email} />
					<SingleDetail label="Phone Number" value={resident_phone_number} />
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
