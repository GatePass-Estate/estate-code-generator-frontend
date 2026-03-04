import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import { SingleDetail } from '@/src/components/mobile/SIngleDetail';
import { ReceiverType } from '@/src/types/codes';
import images from '@/src/constants/images';
import { GenderType } from '@/src/types/general';
import { variantStyles } from '@/src/components/web/AccessCodeCard';

export default function ValidationResult() {
	let params = useLocalSearchParams();
	const code = String(params.code || '');
	const resident_name = String(params.resident_name || '');
	const resident_address = String(params.resident_address || '');
	const resident_email = String(params.resident_email || '');
	const resident_phone_number = String(params.resident_phone_number || '');
	const receiver = params.receiver as ReceiverType;
	const visitor_fullname = String(params.visitor_fullname || '');
	const gender = params.gender as GenderType;
	const relationship_with_resident = String(params.relationship_with_resident || '');
	const isError = Boolean(params.error);

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
				{!isError ? (
					<>
						<Text className="text-center text-orange-500 font-inter-semibold text-sm text-tertiary">SECURITY CODE</Text>
						<Text className="text-center text-7xl font-ubuntu-semibold text-teal-900 mt-2 mb-6 text-primary">
							{code.slice(0, 3)} {code.slice(3)}{' '}
						</Text>

						{receiver === 'visitor' && (
							<>
								<Text className={`text-sm font-inter-semibold mb-3 mt-5 ${styles.text}`}>GUEST DETAILS</Text>
								<View className={`bg-orange-50 p-4 rounded-xl border border-orange-200 mb-6 ${styles.container}`}>
									<SingleDetail label="Name" value={visitor_fullname ? visitor_fullname.charAt(0).toUpperCase() + visitor_fullname.slice(1) : ''} />
									<SingleDetail label="Gender" value={formattedGender} />
									<SingleDetail label="Relationship" value={relationship_with_resident ? relationship_with_resident.charAt(0).toUpperCase() + relationship_with_resident.slice(1) : ''} />
								</View>
							</>
						)}

						<Text className="text-sm font-inter-semibold mb-3 text-teal">RESIDENT DETAILS</Text>
						<View className={`bg-teal-50 p-4 rounded-xl bg-light-teal border-teal/80 border-[0.5px]`}>
							<SingleDetail label="Name" value={resident_name} />
							<SingleDetail label="Address" value={resident_address} />
							<SingleDetail label="Email Address" value={resident_email} />
							<SingleDetail label="Phone Number" value={resident_phone_number} />
						</View>
					</>
				) : (
					<View className="items-center mt-20">
						<Image source={images.brokenCard} />

						<Text className="text-center text-5xl font-ubuntu-medium text-primary my-6">Opps!!</Text>

						<Text className="text-center font-inter-medium text-xl text-primary">Invalid Access Code. This doesnt exist or has expired.</Text>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
