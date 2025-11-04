import { Text, View } from 'react-native';

export const SingleDetail = ({ label, value }: { label: string; value: string | null }) => (
	<View className="gap-1 flex-row items-center justify-between mb-5">
		<Text className="text-[14px] text-grey font-UbuntuSans">{label}: </Text>

		<Text
			numberOfLines={2}
			ellipsizeMode="head"
			style={{
				flexWrap: 'wrap',
				fontSize: 14,
			}}
		>
			{value}{' '}
		</Text>
	</View>
);
