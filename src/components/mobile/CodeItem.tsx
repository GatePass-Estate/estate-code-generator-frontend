import { router } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import CountdownRing from '../common/CountdownRing';
import { useState } from 'react';
import { Codes } from '@/src/types/codes';
import { useUserStore } from '@/src/lib/stores/userStore';

const CodeItem = ({ item, timeframe, formattedDate, parsed }: { item: Codes; timeframe: string; formattedDate: string; parsed: Date }) => {
	const [codes, setCodes] = useState<Codes[]>([]);

	return (
		<Pressable
			className={`${Platform.OS === 'web' && 'cursor-pointer w-full'} flex flex-row justify-between items-center border-[0.5px] border-accent rounded-lg p-4 mb-4 bg-[#F9FDFF]`}
			onPress={() =>
				router.push({
					pathname: '/invite',
					params: {
						name: item.visitor_fullname,
						code: item.hashed_code,
						timeframe,
						address: `${useUserStore.getState().home_address}, ${useUserStore.getState().estate_name}.`,
						date: formattedDate,
					},
				})
			}
		>
			<View style={{ flex: 1 }}>
				<Text className={`text-sm font-medium text-grey mb-1`}>{item.visitor_fullname}</Text>

				<Text className={`text-[27px] font-UbuntuSans uppercase text-orange tracking-[5px] font-bold`}>{item.hashed_code.slice(0, 3) + ' ' + item.hashed_code.slice(3)}</Text>
			</View>
			<CountdownRing
				size={50}
				expiresAt={parsed.getTime()}
				onExpire={() => {
					setCodes((prev) => prev.filter((c) => c.hashed_code !== item.hashed_code));
				}}
			/>
		</Pressable>
	);
};

export default CodeItem;
