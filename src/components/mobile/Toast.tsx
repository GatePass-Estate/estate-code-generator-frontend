import { Text, View, Animated, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useEffect, useRef } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
	message: string;
	type: ToastType;
	visible: boolean;
	onHide: () => void;
	duration?: number;
	autoClose?: boolean;
}

export const Toast = ({ message, type, visible, onHide, duration = 4000, autoClose = true }: ToastProps) => {
	const slideAnim = useRef(new Animated.Value(-100)).current;

	useEffect(() => {
		if (visible) {
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}).start();

			if (autoClose) {
				const timer = setTimeout(() => {
					Animated.timing(slideAnim, {
						toValue: -100,
						duration: 300,
						useNativeDriver: true,
					}).start(() => onHide());
				}, duration);

				return () => clearTimeout(timer);
			}
		}
	}, [visible, slideAnim, onHide, duration, autoClose]);

	const handleClose = () => {
		Animated.timing(slideAnim, {
			toValue: -100,
			duration: 300,
			useNativeDriver: true,
		}).start(() => onHide());
	};

	if (!visible) return null;

	const getBgColor = () => {
		switch (type) {
			case 'success':
				return 'bg-green-50';
			case 'error':
				return 'bg-red-50';
			case 'info':
				return 'bg-blue-50';
			default:
				return 'bg-grey-50';
		}
	};

	const getBorderColor = () => {
		switch (type) {
			case 'success':
				return 'border-green-200';
			case 'error':
				return 'border-red-200';
			case 'info':
				return 'border-blue-200';
			default:
				return 'border-grey-200';
		}
	};

	const getTextColor = () => {
		switch (type) {
			case 'success':
				return 'text-green-800';
			case 'error':
				return 'text-red-800';
			case 'info':
				return 'text-blue-800';
			default:
				return 'text-grey-800';
		}
	};

	const getIconColor = () => {
		switch (type) {
			case 'success':
				return '#16a34a';
			case 'error':
				return '#dc2626';
			case 'info':
				return '#2563eb';
			default:
				return '#666';
		}
	};

	const getIconName = () => {
		switch (type) {
			case 'success':
				return 'checkmark-circle';
			case 'error':
				return 'close-circle';
			case 'info':
				return 'information-circle';
			default:
				return 'alert-circle';
		}
	};

	return (
		<Animated.View
			style={{
				zIndex: 999,
			}}
		>
			<View className={`${getBgColor()} border ${getBorderColor()} mt-4 rounded-lg p-4 flex-row items-center gap-3 w-full`}>
				<Icon name={getIconName()} size={24} color={getIconColor()} />
				<Text className={`${getTextColor()} font-ubuntu-medium flex-1`} numberOfLines={2}>
					{message}
				</Text>
				{!autoClose && (
					<TouchableOpacity onPress={handleClose} className="ml-2 p-1">
						<Icon name="close" size={20} color={getIconColor()} />
					</TouchableOpacity>
				)}
			</View>
		</Animated.View>
	);
};
