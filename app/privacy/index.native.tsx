import LoadingTransition from '@/src/components/common/LoadingTransition';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
	const router = useRouter();

	useEffect(() => {
		const timer = setTimeout(() => {
			router.push('/auth/login');
		}, 2000);

		return () => clearTimeout(timer);
	}, []);

	return <LoadingTransition />;
}
