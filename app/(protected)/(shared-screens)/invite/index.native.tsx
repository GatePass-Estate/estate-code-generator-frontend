import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, Image, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import images from '@/src/constants/images';
import { SingleDetail } from '@/src/components/mobile/SIngleDetail';
import Back from '@/src/components/mobile/Back';

export default function InvitePage() {
	let { name, code, date, timeframe, address } = useLocalSearchParams();
	const navigation = useNavigation();

	code = Array.isArray(code) ? code.join(' ') : code ?? '';

	const copyToClipboard = async () => {
		await Clipboard.setStringAsync(code);
		Alert.alert('Copied', 'Code copied to clipboard');
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
		<SafeAreaView style={styles.container}>
			<Stack.Screen
				options={{
					headerShown: false,
					headerShadowVisible: false,
				}}
			/>

			<Back />

			<View className="mb-5 items-center">
				<View style={styles.qrWrapper}>
					<QRCode value={code} size={150} backgroundColor="white" color="#F95F35" />
				</View>

				<View style={styles.codeRow}>
					<Text style={styles.code}>{code.replace(/\s+/g, '')}</Text>
					<Pressable onPress={copyToClipboard}>
						<Image source={images.copyImg} className="w-5 h-5" />
					</Pressable>
				</View>

				<View style={styles.card}>
					<SingleDetail label="Name" value={name as string} />
					<SingleDetail label="Address" value={address as string} />
					<SingleDetail label="Date" value={date as string} />
					<SingleDetail label="Time" value={timeframe as string} />
					<SingleDetail label="Access Code" value={code as string} />
				</View>

				<TouchableOpacity style={styles.primaryButton} onPress={handleShare}>
					<Text style={styles.primaryButtonText}> {'Share Invite'} </Text>
				</TouchableOpacity>

				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.cancelText}>Cancel Invite</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		paddingHorizontal: 20,
		paddingTop: 20,
	},

	codeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},

	code: {
		fontSize: 25,
		fontWeight: 'bold',
		letterSpacing: 6,
		color: '#113E55',
		marginRight: 10,
		textTransform: 'uppercase',
	},

	primaryButton: {
		backgroundColor: '#113E55',
		paddingVertical: 14,
		paddingHorizontal: 60,
		borderRadius: 8,
		marginBottom: 20,
	},

	primaryButtonText: {
		color: 'white',
		fontSize: 16,
	},

	cancelText: {
		color: '#113E55',
		textDecorationLine: 'none',
		fontSize: 14,
	},

	card: {
		marginTop: 12,
		backgroundColor: '#FFFFFF',
		padding: 15,
		borderRadius: 10,
		width: '100%',
		borderWidth: 0.1,
		marginBottom: 30,
	},

	qrWrapper: {
		backgroundColor: '#F95F35',
		padding: 20,
		borderRadius: 12,
		marginVertical: 20,
	},
});
