import { memo } from 'react';
import { View, TextInput, Text, Pressable, Image, TextInputProps, Platform } from 'react-native';
import icons from '@/src/constants/icons';

interface PasswordInputProps extends TextInputProps {
	label?: string;
	show: boolean;
	setShow: (show: boolean) => void;
	containerClassName?: string;
}

const PasswordInput = memo(({ label, show, setShow, containerClassName, ...textInputProps }: PasswordInputProps) => {
	return (
		<View className={containerClassName}>
			{label && <Text className="text-[12px] text-primary mt-5">{label}</Text>}
			<View className="relative mt-1">
				<TextInput
					className="bg-[#F7F9F9] rounded-lg px-5 py-3 h-16 text-base pr-12"
					secureTextEntry={!show}
					autoCapitalize="none"
					// Disable copy and paste on native platforms
					contextMenuHidden={true}
					// Also disable text selection
					selectTextOnFocus={false}
					{...textInputProps}
				/>
				<Pressable onPress={() => setShow(!show)} className="absolute right-3 top-5" disabled={textInputProps.editable === false}>
					<Image source={show ? icons.eye : icons.hiddenEye} style={{ width: 20, height: 20 }} resizeMode="contain" />
				</Pressable>
			</View>
		</View>
	);
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
