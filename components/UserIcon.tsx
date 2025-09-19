import { useUserStore } from '@/lib/stores/userStore';
import { Link } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function UserIcon() {
	const first_name = useUserStore((state) => state.first_name);
	const last_name = useUserStore((state) => state.last_name);

	const initials = `${first_name?.charAt(0) ?? ''}${last_name?.charAt(0) ?? ''}`;

	return (
		<Link href="/(screens)/my-profile" asChild>
			<Pressable className="opacity-80">
				{() => (
					<View style={styles.profileCircle}>
						<Text style={styles.profileInitials}>{initials}</Text>
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
		borderColor: '#167a6f',
		justifyContent: 'center',
		alignItems: 'center',
	},
	profileInitials: {
		color: '#167a6f',
		fontWeight: '300',
		textTransform: 'capitalize',
		fontFamily: 'UbuntuSans',
		fontSize: 23,
	},
});
