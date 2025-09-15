import { Link } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function UserIcon() {
	return (
		<Link href="/modal" asChild>
			<Pressable className="opacity-80">
				{({ pressed }) => (
					<View style={styles.profileCircle}>
						<Text style={styles.profileInitials}>GD</Text>
					</View>
				)}
			</Pressable>
		</Link>
	);
}

const styles = StyleSheet.create({
	profileCircle: {
		width: 35,
		height: 35,
		borderRadius: 17,
		borderWidth: 1,
		// marginRight: 30,
		borderColor: '#167a6f',
		justifyContent: 'center',
		alignItems: 'center',
	},
	profileInitials: {
		color: '#167a6f',
		fontWeight: '300',
		fontFamily: 'UbuntuSans',
		fontSize: 23,
	},
});
