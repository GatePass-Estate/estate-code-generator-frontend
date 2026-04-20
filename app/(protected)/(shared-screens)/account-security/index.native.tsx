import { View, Text, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import icons from '@/src/constants/icons';

export default function AccountSecurityScreen() {
	return (
		<SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
			<Stack.Screen options={{ headerShown: false }} />
			<Back type="short-arrow" />

			<View className="flex-1">
				<Text className="text-2xl text-primary mb-10 font-ubuntu-bold mt-8" style={{ fontSize: 23 }}>
					Account Security
				</Text>

				<View className="flex-row items-center justify-between border-[0.5px] border-grey rounded-lg px-5 py-6">
					<Text className="text-[17px] text-primary">My Password: </Text>
					<Pressable className="flex-row items-center gap-10" onPress={() => router.push('/profile/edit/password')}>
						<Text className="tracking-widest text-[18px] text-primary">**********</Text>

						<Image source={icons.edit} style={{ width: 20, height: 20 }} resizeMode="contain" />
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}
