import { View, Text, TouchableOpacity, Pressable, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '@/src/hooks/useAuthContext';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/lib/stores/userStore';
import icons from '@/src/constants/icons';
import Back from '@/src/components/mobile/Back';
import { SingleDetail } from '@/src/components/mobile/SIngleDetail';
import { sharedStyles } from '@/src/theme/styles';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { generateCode, getMyCode } from '@/src/lib/api/codes';
import { formatDateWithOrdinal } from '@/src/lib/helpers';

const ProfileScreen = () => {
	const { signOut } = useAuth();

	const { first_name, last_name, home_address, estate_name, email, phone_number, user_id, estate_id, role } = useUserStore.getState();

	const [code, setCode] = useState<string | null>(null);
	const [expiry, setExpiry] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [noCode, setNoCode] = useState(false);

	const fetchMyCode = useCallback(async () => {
		setLoading(true);
		try {
			const { hashed_code, valid_until } = await getMyCode(user_id);
			setCode(hashed_code);
			setNoCode(false);
			setExpiry(valid_until);
		} catch (e) {
			setNoCode(true);
		} finally {
			setLoading(false);
		}
	}, [user_id]);

	const handleGenerateCode = useCallback(async () => {
		setLoading(true);
		try {
			const { hashed_code, valid_until } = await generateCode({ user_id, estate_id: estate_id ?? '' }, 'resident');
			setCode(hashed_code);
			setExpiry(valid_until);
			setNoCode(false);
		} catch (e) {
			console.error('Failed to generate code:', e);
		} finally {
			setLoading(false);
		}
	}, [user_id, estate_id]);

	useEffect(() => {
		if (role != 'security') fetchMyCode();
	}, [fetchMyCode]);

	const { expiring, formattedDate } = useMemo(() => {
		if (!expiry) return { expiring: false, formattedDate: null };
		const expDate = new Date(expiry);
		const now = new Date();
		const daysLeft = (expDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
		return {
			expiring: daysLeft <= 30,
			formattedDate: formatDateWithOrdinal(expDate),
		};
	}, [expiry]);

	const CodeRow = () => (
		<View className="flex-row items-center justify-between bg-accent rounded-lg px-10 py-6">
			<Text className="text-primary text-lg font-Inter font-medium">My access code:</Text>

			<View className="flex-row items-center gap-2">
				<Text className="tracking-widest uppercase text-[17px] text-primary">{code ? `${code.slice(0, 3)} ${code.slice(3)}` : '-------------'} </Text>

				<Pressable onPress={handleGenerateCode} disabled={loading} className={loading ? 'opacity-50' : ''}>
					{loading ? <ActivityIndicator size="small" color="#113E55" /> : <Image source={icons.refresh} style={{ width: 22, height: 22 }} resizeMode="contain" />}
				</Pressable>
			</View>
		</View>
	);

	const ExpiryWarning = () =>
		!loading && formattedDate ? (
			<View className="flex-row items-center gap-2 mt-2">
				<Image source={expiring ? icons.warning : icons.warningInfo} style={{ width: 20, height: 20 }} resizeMode="contain" />
				<Text className={`text-base font-inter-medium-italic ${expiring ? 'text-tertiary' : 'text-primary'}`}>
					Code expires on {formattedDate}
					{expiring && ': Regenerate Code now'}
				</Text>
			</View>
		) : (
			noCode && (
				<View className="flex-row items-center gap-2 mt-2">
					<Image source={icons.warning} style={{ width: 20, height: 20 }} resizeMode="contain" />
					<Text className={`text-base font-inter-medium-italic text-tertiary`}>You do not have a code, please generate your code.</Text>
				</View>
			)
		);

	return (
		<SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
			<Stack.Screen options={{ headerShown: false }} />
			<Back type="short-arrow" />

			<View className="flex-1">
				<Text
					className="text-2xl text-primary mb-5 font-ubuntu-bold mt-8"
					style={{
						fontSize: 23,
					}}
				>
					My Profile
				</Text>

				{role != 'security' && <CodeRow />}
				<ExpiryWarning />

				<View className="my-5 mt-10">
					<TouchableOpacity className="flex-row items-center justify-between" onPress={() => router.push('/profile/edit')}>
						<Text className="text-base font-medium text-primary">PERSONAL DETAILS</Text>
						<Image source={icons.edit} style={{ width: 20, height: 20 }} resizeMode="contain" />
					</TouchableOpacity>

					<View className="mt-3 bg-transparent p-4 rounded-lg border-micro">
						<SingleDetail label="Name" value={`${first_name} ${last_name}`} />
						<SingleDetail label="Address" value={`${home_address}, ${estate_name}.`} />
						<SingleDetail label="Email Address" value={email} />
						<SingleDetail label="Phone Number" value={phone_number} />
					</View>
				</View>

				<View className="flex-row items-center justify-between border-[0.5px] border-grey rounded-lg px-5 py-6">
					<Text className="text-[17px] text-primary">My Password: </Text>
					<Pressable className="flex-row items-center gap-10" onPress={() => router.push('/profile/edit/password')}>
						<Text className="tracking-widest text-[18px] text-primary">**********</Text>

						<Image source={icons.edit} style={{ width: 20, height: 20 }} resizeMode="contain" />
					</Pressable>
				</View>

				<TouchableOpacity className="self-center mt-auto" onPress={signOut}>
					<Text className="text-tertiary font-bold text-[16px] p-5 font-UbuntuSans">Log Out</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
};

export default ProfileScreen;
