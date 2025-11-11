import { useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Text, TextInput, Keyboard, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sharedStyles } from '@/src/theme/styles';
import UserIcon from '@/src/components/mobile/UserIcon';
import { validateCode } from '@/src/lib/api/codes';

export default function SecurityVerificationMobile() {
	const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const input1Ref = useRef<TextInput>(null);
	const input2Ref = useRef<TextInput>(null);
	const input3Ref = useRef<TextInput>(null);
	const input4Ref = useRef<TextInput>(null);
	const input5Ref = useRef<TextInput>(null);
	const input6Ref = useRef<TextInput>(null);
	const inputContainer = useRef(null);

	const inputRefs = [input1Ref, input2Ref, input3Ref, input4Ref, input5Ref, input6Ref];

	const router = useRouter();

	const handleChange = (text: string, index: number) => {
		setErrorMessage('');
		const digit = text.slice(-1);
		const newCode = [...code];
		newCode[index] = digit;
		setCode(newCode);

		console.log(inputContainer.current);

		requestAnimationFrame(() => {
			if (digit && index < 5) {
				inputRefs[index + 1].current?.focus();
			} else if (!digit && index > 0) {
				inputRefs[index - 1].current?.focus();
			}
		});
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
			setCode(['', '', '', '', '', '']);
			router.push({
				pathname: '/security/result',
				params: {
					visitor_fullname: result.visitor_fullname,
					relationship_with_resident: result.relationship_with_resident,
					gender: result.gender,
					resident_name: '',
					resident_address: '',
					resident_email: '',
					resident_phone_number: '',
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
					headerRight: () => <UserIcon />,
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
							maxLength={1}
							value={digit}
							onChangeText={(t) => handleChange(t, idx)}
							ref={inputRefs[idx]}
							accessibilityLabel={`Digit ${idx + 1}`}
							returnKeyType={'done'}
							blurOnSubmit={true}
							// onSubmitEditing={() => {
							// 	if (idx < 5) inputs.current[idx + 1]?.focus();
							// }}
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
