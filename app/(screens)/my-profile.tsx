import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuthContext';
import { Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/components/Back';
import { useUserStore } from '@/lib/stores/userStore';

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

const ProfileScreen = () => {
	const { signOut } = useAuth();

	const first_name = useUserStore((state) => state.first_name);
	const last_name = useUserStore((state) => state.last_name);
	const address = useUserStore((state) => state.home_address);
	const estate_name = useUserStore((state) => state.estate_name);
	const email = useUserStore((state) => state.email);
	const phone_number = useUserStore((state) => state.phone_number);

	return (
		<SafeAreaView style={styles.container}>
			<Back />

			<View>
				<Text style={styles.title}>My Profiles</Text>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>
						PERSONAL DETAILS
						<TouchableOpacity style={styles.editIcon} onPress={() => router.push('/edit-profile-request')}>
							<Image
								source={require('@/assets/icons/edit-button.png')}
								style={{
									width: 20,
									height: 15,
									resizeMode: 'contain',
									marginTop: 9,
									left: 10,
									top: 2,
								}}
							/>
						</TouchableOpacity>
					</Text>

					<View style={styles.card}>
						<SingleDetail label="Name" value={`${first_name} ${last_name} `} />
						<SingleDetail label="Address" value={`${estate_name}, ${address} `} />
						<SingleDetail label="Email Address" value={email} />
						<SingleDetail label="Phone Number" value={phone_number} />
					</View>
				</View>

				<TouchableOpacity style={styles.logoutButton} onPress={signOut}>
					<Text style={styles.logoutText}>Log Out </Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
};

// Styles
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FBFEFF',
		paddingHorizontal: 20,
		paddingTop: 20,
		elevation: 0,
		shadowOpacity: 0,
		borderBottomWidth: 0,
	},

	backButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 50,
		marginLeft: -5,
	},

	backText: {
		color: '#113E55',
		fontSize: 16,
		marginLeft: 5,
		fontFamily: 'UbuntuSans',
		fontWeight: 'bold',
	},

	value: {
		flexWrap: 'wrap',
		width: '20%',
	},

	backIcon: {
		width: 25,
		height: 25,
		resizeMode: 'contain',
	},

	title: {
		fontSize: 22,
		fontWeight: 700,
		color: '#113E55',
		marginBottom: 20,
		fontFamily: 'UbuntuSans',
	},

	section: {
		marginTop: 20,
		marginBottom: 20,
	},

	sectionTitle: {
		fontSize: 14,
		fontWeight: 400,
		color: '#113E55',
		marginBottom: 10,
		flexDirection: 'row',
	},

	editIcon: {
		marginLeft: 10,
		borderRadius: 20,
	},

	card: {
		marginTop: 12,
		backgroundColor: '#FFFFFF',
		padding: 15,
		borderRadius: 10,
		width: '100%',
		borderWidth: 0.1,
	},

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

	detailValue: {
		color: '#113E55',
		fontSize: 14,
		fontWeight: 400,
		fontFamily: 'UbuntuSans',
	},

	logoutButton: {
		alignSelf: 'center',
		marginTop: 30,
	},

	logoutText: {
		top: 130,
		color: '#E63946',
		fontSize: 16,
		fontWeight: 'bold',
	},

	expire: {
		marginTop: 10,
		marginBottom: 10,
	},
});

export default ProfileScreen;
