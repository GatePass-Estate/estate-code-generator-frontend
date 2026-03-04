import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import { SingleDetail } from '@/src/components/mobile/SIngleDetail';
import { ReceiverType } from '@/src/types/codes';
import images from '@/src/constants/images';

export default function ValidationResult() {
	let params = useLocalSearchParams();
	const code = String(params.code || '');
	const resident_name = String(params.resident_name || '');
	const resident_address = String(params.resident_address || '');
	const resident_email = String(params.resident_email || '');
	const resident_phone_number = String(params.resident_phone_number || '');
	const receiver = params.receiver as ReceiverType;
	const isError = Boolean(params.error);

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

						<Text className="text-sm font-inter-semibold mb-3 text-teal mt-7">DATA ASSIGNED TO CODE</Text>
						<View className={`p-4 py-5 rounded-xl border-teal/80 border-[0.5px]`}>
							<SingleDetail label="Name" value={resident_name} />
							<SingleDetail label="Address" value={resident_address} />
							<SingleDetail label="Email Address" value={resident_email} />
							<SingleDetail label="Phone Number" value={resident_phone_number} />
							<SingleDetail label="Category" value={receiver.charAt(0).toUpperCase() + receiver.slice(1)} />
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
