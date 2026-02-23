import { useCallback } from 'react';
import { Image, Pressable } from 'react-native';
import icons from '@/src/constants/icons';

interface WebPasswordInputProps {
	label: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
	show: boolean;
	onToggle: () => void;
	disabled?: boolean;
	inputRef?: React.Ref<HTMLInputElement | null>;
}

const WebPasswordInput = ({ label, placeholder, value, onChange, show, onToggle, disabled, inputRef }: WebPasswordInputProps) => {
	// Prevent copy and paste events
	const handleCopy = useCallback((e: React.ClipboardEvent) => {
		e.preventDefault();
	}, []);

	const handlePaste = useCallback((e: React.ClipboardEvent) => {
		e.preventDefault();
	}, []);

	const handleCut = useCallback((e: React.ClipboardEvent) => {
		e.preventDefault();
	}, []);

	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
	}, []);

	return (
		<div className="flex flex-col gap-2">
			<label className="input-label-web text-left">{label}</label>
			<div className="relative">
				<input
					type={show ? 'text' : 'password'}
					placeholder={placeholder}
					className="input-style-web w-full pr-12"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					ref={inputRef as React.Ref<HTMLInputElement | null>}
					// Disable copy, paste, cut
					onCopy={handleCopy}
					onPaste={handlePaste}
					onCut={handleCut}
					// Disable right-click context menu
					onContextMenu={handleContextMenu}
				/>
				<Pressable onPress={onToggle} className="absolute right-5 top-1/2 -translate-y-1/2" disabled={disabled}>
					<Image source={show ? icons.eye : icons.hiddenEye} style={{ width: 20, height: 20 }} resizeMode="contain" />
				</Pressable>
			</div>
		</div>
	);
};

export default WebPasswordInput;
