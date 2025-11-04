import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { validateCode } from '@/src/lib/api/codes';
import { Platform } from 'react-native';

export default function SecurityVerificationWeb() {
	const [code, setCode] = useState(['', '', '', '', '', '']);
	const [errorMessage, setErrorMessage] = useState('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const inputs = useRef([]);
	const router = useRouter();

	const handleValidation = async () => {
		const entered = code.join('');
		if (entered.length < 6) {
			setErrorMessage('Please fill all 6 digits');
			return;
		}

		setIsSubmitting(true);
		setErrorMessage('');

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

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Home - GatePass';
	}, []);

	return <div></div>;
}
