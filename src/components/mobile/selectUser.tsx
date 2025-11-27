import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, ModalProps, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type UserRole = 'Resident' | 'Security Personnel';

const roles: UserRole[] = ['Resident', 'Security Personnel'];

interface UserTypeModalProps extends ModalProps {
	visible: boolean;
	onClose: () => void;
}

const UserRoleModal: React.FC<UserTypeModalProps> = ({ visible, onClose }) => {
	const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);

	const toggleRole = (role: UserRole) => {
		setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
				<TouchableWithoutFeedback onPress={onClose}>
					<View style={styles.overlay}>
						<TouchableWithoutFeedback onPress={() => null}>
							<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
								<View style={styles.handleBar} />

								<FlatList
									data={roles}
									keyExtractor={(item) => item}
									renderItem={({ item }) => {
										const isSelected = selectedRoles.includes(item);
										return (
											<TouchableOpacity style={styles.option} onPress={() => toggleRole(item)}>
												<Text style={styles.optionText}>{item}</Text>
												{isSelected && <Ionicons name="checkmark-circle" size={20} color="#113E55" />}
											</TouchableOpacity>
										);
									}}
								/>
							</KeyboardAvoidingView>
						</TouchableWithoutFeedback>
					</View>
				</TouchableWithoutFeedback>
			</Modal>
		</SafeAreaView>
	);
};

export default UserRoleModal;

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#111',
	},
	overlay: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'rgba(0,0,0,0.5)',
	},
	modalContainer: {
		backgroundColor: '#F9FAFB',
		borderTopLeftRadius: 30,
		borderTopRightRadius: 30,
		padding: 20,
		paddingBottom: 40,
	},
	handleBar: {
		alignSelf: 'center',
		width: 130,
		height: 5,
		borderRadius: 10,
		backgroundColor: '#A1A1AA',
		marginBottom: 20,
	},
	option: {
		backgroundColor: '#F5F5F5',
		borderRadius: 12,
		padding: 16,
		marginBottom: 14,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	optionText: {
		color: '#1E3A8A',
		fontSize: 15,
	},
});
