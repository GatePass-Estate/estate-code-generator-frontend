import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, Image, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/components/Back';
import { SingleDetail } from './my-profile';
import QRCode from 'react-native-qrcode-svg';
import images from '@/constants/images';

export default function InvitePage() {
	let { name = 'Sandra', code = '000 000' } = useLocalSearchParams();
	const navigation = useNavigation();

	const address = 'Flat 1, 18A Something Street';
	const date = '14/08/2023';
	const time = '6:00pm to 7:00pm';

	code = Array.isArray(code) ? code.join(' ') : code ?? '';

	const copyToClipboard = async () => {
		await Clipboard.setStringAsync(code);
		Alert.alert('Copied', 'Code copied to clipboard');
	};

	const handleShare = async () => {
		try {
			await Share.share({
				message: `You're invited!\n\nName: ${name}\nAddress: ${address}\nDate: ${date}\nTime: ${time}\nCode: ${code}`,
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
					<SingleDetail label="Name" value="Sandra Happiness" />
					<SingleDetail label="Address" value="Flat 1, 18A Olayinka Something Street, U3 Estate" />
					<SingleDetail label="Date" value="14/08/2023" />
					<SingleDetail label="Time" value="6:23pm to 7:23pm" />
					<SingleDetail label="Access Code" value="567TE3" />
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
	},

	primaryButton: {
		backgroundColor: '#113E55',
		paddingVertical: 12,
		paddingHorizontal: 30,
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
