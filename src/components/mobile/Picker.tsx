import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface PickerItem {
	label: string;
	value: string;
}

interface PickerProps {
	label: string;
	selectedValue: string | null;
	onValueChange: (value: string) => void;
	items: PickerItem[];
	placeholder?: string;
	enabled?: boolean;
}

/**
 * Cross-platform Picker component with modal-based selection
 * Uses a custom scrollable list that works consistently on iOS and Android
 */
export function Picker({ label, selectedValue, onValueChange, items, placeholder = 'Select an option', enabled = true }: PickerProps) {
	const [isModalVisible, setIsModalVisible] = useState(false);

	// Find the selected item's label for display
	const selectedItem = items.find((item) => item.value === selectedValue);
	const displayLabel = selectedItem?.label || placeholder;
	const hasValue = !!selectedValue;

	const handleSelect = (value: string) => {
		onValueChange(value);
		setIsModalVisible(false);
	};

	return (
		<View>
			{label ? <Text className="input-label">{label}</Text> : null}
			<Pressable className="input-style flex-row items-center justify-between" onPress={() => enabled && setIsModalVisible(true)} disabled={!enabled} style={{ opacity: enabled ? 1 : 0.5 }}>
				<Text
					style={{
						color: hasValue ? '#000' : '#9CA3AF',
						flex: 1,
					}}
					numberOfLines={1}
				>
					{displayLabel}
				</Text>
				<Ionicons name="chevron-down" size={20} color="#9CA3AF" />
			</Pressable>

			<Modal transparent={true} visible={isModalVisible} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
				<Pressable style={styles.modalOverlay} onPress={() => setIsModalVisible(false)}>
					<View style={styles.pickerContainer}>
						<View style={styles.header}>
							<Text style={styles.headerTitle}>{placeholder}</Text>
							<TouchableOpacity onPress={() => setIsModalVisible(false)}>
								<Text style={styles.doneButton}>Done</Text>
							</TouchableOpacity>
						</View>
						<ScrollView style={styles.scrollView}>
							{items.map((item, index) => {
								const isSelected = item.value === selectedValue;
								const isLast = index === items.length - 1;
								return (
									<TouchableOpacity key={item.value + index} style={[styles.item, !isLast && styles.itemBorder, isSelected && styles.itemSelected]} onPress={() => handleSelect(item.value)} activeOpacity={0.7}>
										<Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>{item.label}</Text>
										{isSelected && <Ionicons name="checkmark" size={22} color="#113E55" />}
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					</View>
				</Pressable>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	pickerContainer: {
		backgroundColor: '#1f2937', // gray-800
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		maxHeight: '70%',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#374151', // gray-700
	},
	headerTitle: {
		color: '#9CA3AF',
		fontSize: 14,
		fontWeight: '500',
	},
	doneButton: {
		color: '#113E55',
		fontSize: 16,
		fontWeight: '600',
	},
	scrollView: {
		maxHeight: 350,
	},
	item: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	itemBorder: {
		borderBottomWidth: 1,
		borderBottomColor: '#374151', // gray-700
	},
	itemSelected: {
		backgroundColor: 'rgba(17, 62, 85, 0.1)',
	},
	itemText: {
		color: '#fff',
		fontSize: 16,
	},
	itemTextSelected: {
		color: '#113E55',
		fontWeight: '600',
	},
});
