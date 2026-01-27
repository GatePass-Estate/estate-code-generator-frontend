import icons from '@/src/constants/icons';
import { useUserStore } from '@/src/lib/stores/userStore';
import { Link, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';

export default function UserIcon({ type = 'admin' }: { type?: string }) {
	const first_name = useUserStore((state) => state.first_name);
	const last_name = useUserStore((state) => state.last_name);
	const role = useUserStore((state) => state.role);
	const router = useRouter();

	const initials = `${first_name?.charAt(0) ?? ''}${last_name?.charAt(0) ?? ''}`;

	return (
		<>
			{['admin', 'primary_admin'].includes(role) && (
				<Pressable
					className="mr-6"
					onPress={() => {
						router.replace(`${type === 'user' ? '/user' : '/admin'}`);
					}}
				>
					<Image source={type === 'user' ? icons.webHomeActiveIcon : icons.activeAdminIcon} style={{ width: type === 'user' ? 23.5 : 21, height: 25 }} />
				</Pressable>
			)}

			<Link href="/profile" asChild>
				<Pressable>
					<View style={styles.profileCircle}>
						<Text className="uppercase" style={styles.profileInitials}>
							{initials}
						</Text>
					</View>
				</Pressable>
			</Link>
		</>
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
		marginRight: 20,
	},
	profileInitials: {
		color: '#167a6f',
		fontWeight: '300',
		textTransform: 'uppercase',
		fontFamily: 'UbuntuSans',
		fontSize: 23,
	},
});
