import { useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Text, TextInput, Keyboard, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sharedStyles } from '@/src/theme/styles';
import UserIcon from '@/src/components/mobile/UserIcon';
import { validateCode } from '@/src/lib/api/codes';
import { InputRefsStorage } from '@/src/types/general';
import { getUserById } from '@/src/lib/api/user';

export default function SecurityVerificationMobile() {
	const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const inputs = useRef<InputRefsStorage>({});
	const inputContainer = useRef(null);

	const router = useRouter();

	const setInputRef = (el: TextInput | null, index: number) => {
		if (el) {
			inputs.current[index] = el;
		}
	};

	const handleChange = (text: string, index: number) => {
		// always convert to uppercase
		text = text.toUpperCase();
		setErrorMessage('');
		const newCode = [...code];

		// if the user pasted or typed multiple characters, spread them
		if (text.length > 1) {
			console.log(text);

			for (let i = 0; i < text.length && index + i < newCode.length; i++) {
				newCode[index + i] = text[i];
			}
			setCode(newCode);
			const lastFilled = Math.min(5, index + text.length - 1);
			inputs.current[lastFilled]?.focus();
			return;
		}

		const digit = text.slice(-1);

		// backspace on empty should clear previous
		if (!digit && newCode[index] === '' && index > 0) {
			newCode[index - 1] = '';
			setCode(newCode);
			inputs.current[index - 1]?.focus();
			return;
		}

		newCode[index] = digit;
		setCode(newCode);

		if (digit && index < 5) {
			inputs.current[index + 1]?.focus();
		} else if (!digit && index > 0) {
			inputs.current[index - 1]?.focus();
		}
	};

	const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
		if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
			const newCode = [...code];
			newCode[index - 1] = '';
			setCode(newCode);
			inputs.current[index - 1]?.focus();
		}
	};

	const handleValidation = async () => {
		const entered = code.join('');
		if (entered.length < 6) {
			setErrorMessage('Please fill all 6 digits');
			return;
		}

		setIsSubmitting(true);
		setErrorMessage('');
		Keyboard.dismiss();

		try {
			const result = await validateCode(entered);
			const resident = await getUserById(result.user_id);

			setCode(['', '', '', '', '', '']);

			router.push({
				pathname: '/security/result',
				params: {
					visitor_fullname: result.visitor_fullname,
					relationship_with_resident: result.relationship_with_resident,
					gender: result.gender,
					resident_name: `${resident?.first_name ?? ''} ${resident?.last_name ?? ''}`,
					resident_address: resident?.home_address,
					resident_email: resident?.email,
					resident_phone_number: resident?.phone_number,
					code: result.hashed_code,
				},
			});
		} catch (err: any) {
			setErrorMessage(err.message ?? 'Invalid Code');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<SafeAreaView style={sharedStyles.container}>
			<Stack.Screen
				options={{
					title: 'Incoming Guest',
					headerShown: true,
					headerShadowVisible: false,
					headerTitleAlign: 'left',
					headerStyle: sharedStyles.header,
					headerTitleStyle: sharedStyles.title,
					headerRight: () => (
						<View style={{ marginRight: -20 }}>
							<UserIcon />
						</View>
					),
				}}
			/>

			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					marginTop: -60,
				}}
			>
				<View className="gap-4 mb-12">
					<Text className="text-4xl font-UbuntuSans text-primary text-center">Verify incoming {'\n'} guest’s code</Text>
					<Text className="text-tertiary text-center text-sm">Enter the code from guest here</Text>
				</View>

				<View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }} ref={inputContainer}>
					{code.map((digit, idx) => (
						<TextInput
							key={idx}
							style={{
								backgroundColor: '#F7F9F9',
								borderWidth: 0.5,
								borderColor: '#9B9797',
								borderRadius: 10,
								width: 45,
								height: 64,
								textAlign: 'center',
								fontSize: 24,
								fontWeight: '600',
								color: '#113E55',
							}}
							value={digit}
							onChangeText={(t) => handleChange(t, idx)}
							onKeyPress={(e) => handleKeyPress(e, idx)}
							autoCapitalize="characters"
							onLayout={(e) => {
								setInputRef(e.target as unknown as TextInput, idx);
							}}
							accessibilityLabel={`Digit ${idx + 1}`}
							returnKeyType={'done'}
							blurOnSubmit={true}
						/>
					))}
				</View>

				{errorMessage && <Text className="text-danger text-center mt-5 text-base">{errorMessage}</Text>}

				<Pressable className={`bg-primary py-5 px-20 rounded-lg self-center mt-20 ${isSubmitting && 'opacity-70'}`} onPress={handleValidation} disabled={isSubmitting}>
					<Text className="text-white font-Roboto font-bold text-[16px]">{isSubmitting ? 'Validating…' : 'Validate Code'}</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}
