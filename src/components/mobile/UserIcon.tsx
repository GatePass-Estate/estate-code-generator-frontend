import { useUserStore } from '@/src/lib/stores/userStore';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useState, useRef } from 'react';

export default function UserIcon({ type = 'admin' }: { type?: string }) {
	const first_name = useUserStore((state) => state.first_name);
	const last_name = useUserStore((state) => state.last_name);
	const role = useUserStore((state) => state.role);
	const router = useRouter();
	const [showDropdown, setShowDropdown] = useState(false);
	const buttonRef = useRef<View>(null);

	const initials = `${first_name?.charAt(0) ?? ''}${last_name?.charAt(0) ?? ''}`;
	const isAdmin = ['admin', 'primary_admin'].includes(role);

	const handleNavigation = (path: string) => {
		setShowDropdown(false);
		if (path === '/profile') {
			router.push(path);
		} else {
			router.replace(path);
		}
	};

	const handleIconPress = () => {
		if (isAdmin) {
			setShowDropdown(true);
		} else {
			handleNavigation('/profile');
		}
	};

	return (
		<>
			<View ref={buttonRef} style={styles.container}>
				<Pressable onPress={handleIconPress} style={styles.userIconWrapper}>
					<View style={styles.profileCircle}>
						<Text className="uppercase" style={styles.profileInitials}>
							{initials}
						</Text>
					</View>
					{/* {isAdmin && <Image source={icons.downChevron} style={styles.dropdownIcon} />} */}
				</Pressable>
			</View>

			{isAdmin && (
				<Modal visible={showDropdown} transparent={true} animationType="fade" onRequestClose={() => setShowDropdown(false)}>
					<Pressable style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
						<View style={styles.dropdownMenu}>
							<Pressable style={styles.menuItem} onPress={() => handleNavigation('/profile')}>
								<Text style={styles.menuItemText}>Profile</Text>
							</Pressable>

							{type === 'admin' ? (
								<Pressable style={styles.menuItem} onPress={() => handleNavigation('/admin')}>
									<Text style={styles.menuItemText}>Admin</Text>
								</Pressable>
							) : (
								<Pressable style={styles.menuItem} onPress={() => handleNavigation('/user')}>
									<Text style={styles.menuItemText}>Home</Text>
								</Pressable>
							)}
						</View>
					</Pressable>
				</Modal>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		marginRight: 20,
	},
	userIconWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
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
		textTransform: 'uppercase',
		fontFamily: 'UbuntuSans',
		fontSize: 23,
	},
	dropdownIcon: {
		width: 18,
		height: 18,
		tintColor: '#167a6f',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		justifyContent: 'flex-start',
		paddingTop: 60,
		paddingRight: 20,
	},
	dropdownMenu: {
		alignSelf: 'flex-end',
		backgroundColor: '#fff',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#167a6f',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 5,
		minWidth: 120,
	},
	menuItem: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
	},
	menuItemText: {
		fontSize: 14,
		color: '#167a6f',
		fontFamily: 'Inter',
		fontWeight: '500',
	},
});
