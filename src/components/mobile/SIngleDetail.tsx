import { StyleSheet, Text, View } from 'react-native';

export const SingleDetail = ({ label, value }: { label: String; value: String | null }) => (
	<View style={styles.detailRow}>
		<Text style={styles.detailLabel}>{label}</Text>

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

const styles = StyleSheet.create({
	detailRow: {
		gap: 4,
		justifyContent: 'space-between',
		marginBottom: 20,
	},

	detailLabel: {
		color: '#888888da',
		fontSize: 12,
		fontWeight: 400,
	},
});
