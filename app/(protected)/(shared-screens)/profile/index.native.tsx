import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '@/src/hooks/useAuthContext';
import { Image } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/lib/stores/userStore';
import images from '@/src/constants/images';
import Back from '@/src/components/mobile/Back';

export const SingleDetail = ({ label, value }: { label: String; value: String | null }) => (
	<View className="gap-1 justify-between mb-5">
		<Text className="text-sm text-grey font-UbuntuSans">{label}</Text>

		<Text
			numberOfLines={2}
			ellipsizeMode="head"
			style={{
				flexWrap: 'wrap',
				fontSize: 15,
			}}
		>
			{value}
		</Text>
	</View>
);

const ProfileScreen = () => {
	const { signOut } = useAuth();

	const first_name = useUserStore((state) => state.first_name);
	const last_name = useUserStore((state) => state.last_name);
	const address = useUserStore((state) => state.home_address);
	const estate_name = useUserStore((state) => state.estate_name);
	const email = useUserStore((state) => state.email);
	const phone_number = useUserStore((state) => state.phone_number);

	return (
		<SafeAreaView className="container" style={{ flex: 1 }}>
			<Stack.Screen options={{ headerShown: false }} />

			<Back />

			<View style={{ marginTop: 50 }}>
				<Text className="text-2xl font-bold text-primary mb-5 font-UbuntuSans">My Profile</Text>

				<View className="my-5">
					<TouchableOpacity className="" onPress={() => router.push('/profile/edit')}>
						<Text className="text-base font-normal mb-3 gap-2 flex flex-row text-primary">
							PERSONAL DETAILS
							<Image
								source={images.editButtonImg}
								style={{
									width: 20,
									height: 15,
									resizeMode: 'contain',
									left: 10,
									top: 2,
								}}
							/>
						</Text>
					</TouchableOpacity>

					<View className="mt-3 bg-white p-4 rounded-lg w-full border-micro">
						<SingleDetail label="Name" value={`${first_name} ${last_name} `} />
						<SingleDetail label="Address" value={`${estate_name}, ${address} `} />
						<SingleDetail label="Email Address" value={email} />
						<SingleDetail label="Phone Number" value={phone_number} />
					</View>
				</View>

				<TouchableOpacity className="self-center mt-10 p-10" onPress={signOut}>
					<Text className="text-danger top-5 font-bold text-lg p-5">Log Out </Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
};

export default ProfileScreen;
