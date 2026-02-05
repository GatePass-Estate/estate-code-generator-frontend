import { useUserStore } from '@/src/lib/stores/userStore';
import { useRouter } from 'expo-router';
import { View, Text, Pressable, Modal } from 'react-native';
import { useState, useRef } from 'react';

export default function UserIcon({ type = 'admin' }: { type?: string }) {
	const first_name = useUserStore((state) => state.first_name);
	const last_name = useUserStore((state) => state.last_name);
	const role = useUserStore((state) => state.role);
	const router = useRouter();
	const [showDropdown, setShowDropdown] = useState(false);
	const buttonRef = useRef<View>(null);

	const initials = `${first_name?.charAt(0) ?? ''}${last_name?.charAt(0) ?? ''}`;
	const isAdmin = ['admin', 'primary_admin'].includes(role!);

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
			<View ref={buttonRef} className="mr-5">
				<Pressable onPress={handleIconPress} className="flex-row items-center gap-2">
					<View className="w-9 h-9 rounded-full border border-teal justify-center items-center">
						<Text className="uppercase text-teal font-light font-ubuntu text-2xl">{initials}</Text>
					</View>
					{/* {isAdmin && <Image source={icons.downChevron} style={styles.dropdownIcon} />} */}
				</Pressable>
			</View>

			{isAdmin && (
				<Modal visible={showDropdown} transparent={true} animationType="fade" onRequestClose={() => setShowDropdown(false)}>
					<Pressable className="flex-1 bg-black/50 justify-start pt-15 pr-5" onPress={() => setShowDropdown(false)}>
						<View className="self-end bg-white rounded-lg border border-teal shadow-md top-14" style={{ minWidth: 120 }}>
							<Pressable className="py-3 px-4 border-b border-gray-200" onPress={() => handleNavigation('/profile')}>
								<Text className="text-sm text-teal font-inter-medium">Profile</Text>
							</Pressable>

							{type === 'admin' ? (
								<Pressable className="py-3 px-4" onPress={() => handleNavigation('/admin')}>
									<Text className="text-sm text-teal font-inter-medium">Admin</Text>
								</Pressable>
							) : (
								<Pressable className="py-3 px-4" onPress={() => handleNavigation('/user')}>
									<Text className="text-sm text-teal font-inter-medium">Home</Text>
								</Pressable>
							)}
						</View>
					</Pressable>
				</Modal>
			)}
		</>
	);
}
