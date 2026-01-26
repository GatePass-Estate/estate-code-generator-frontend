import { View, Text, TouchableOpacity, Share, Alert, Image, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { SingleDetail } from '@/src/components/mobile/SIngleDetail';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import icons from '@/src/constants/icons';

export default function InvitePage() {
	let { name, code, date, timeframe, address } = useLocalSearchParams();
	const navigation = useNavigation();

	code = Array.isArray(code) ? code.join(' ') : code ?? '';

	const copyToClipboard = async () => {
		await Clipboard.setStringAsync(code);
	};

	const handleShare = async () => {
		try {
			await Share.share({
				message: `You're invited!\n\nName: ${name}\nAddress: ${address}\nDate: ${date}\nTime: ${timeframe}\nCode: ${code}`,
			});
		} catch (error) {
			Alert.alert('Failed to share');
		}
	};

	return (
		<SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
			<Stack.Screen
				options={{
					headerShown: false,
					headerShadowVisible: false,
				}}
			/>

			<Back type="short-arrow" />

			<View className="mb-5 items-center mt-10">
				<View className="bg-tertiary p-5 rounded-2xl my-5">
					<QRCode value={code} size={150} backgroundColor="white" color="#F46036" />
				</View>

				<View className="flex-row items-center mb-5">
					<Text className="text-[26px] uppercase font-ubuntu-extrabold text-primary tracking-[6px] mr-2">{code.replace(/\s+/g, '')}</Text>

					<Pressable onPress={copyToClipboard}>
						<Image source={icons.copyIcon} className="w-6 h-6" />
					</Pressable>
				</View>

				<View className="mt-3 bg-white p-4 rounded-lg w-full border-[0.2px] mb-8">
					<SingleDetail label="Name" value={name as string} />
					<SingleDetail label="Address" value={address as string} />
					<SingleDetail label="Date" value={date as string} />
					<SingleDetail label="Time" value={timeframe as string} />
					<SingleDetail label="Access Code" value={code.toUpperCase() as string} />
				</View>

				<TouchableOpacity className="bg-primary py-4 px-16 rounded-lg mb-5" onPress={handleShare}>
					<Text className="text-white text-[16px] font-semibold"> {'Share Invite'} </Text>
				</TouchableOpacity>

				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text className="text-primary text-[17px] font-ubuntu-medium">Cancel Invite </Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}
