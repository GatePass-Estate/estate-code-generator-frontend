import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function QrBox({ value }: { value: string }) {
	return (
		<View style={styles.qrWrapper}>
			<QRCode value={value} size={140} backgroundColor="white" />
		</View>
	);
}

const styles = StyleSheet.create({
	qrWrapper: {
		backgroundColor: '#F95F35',
		padding: 20,
		borderRadius: 12,
		marginVertical: 20,
	},
});
